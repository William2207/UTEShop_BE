import User from "../models/user.js";
import PointTransaction from "../models/PointTransaction.js";
import Configuration from "../models/Configuration.js";
import asyncHandler from "../utils/asyncHandler.js";

// Helper function to get points configuration
const getPointsConfigFromDB = async () => {
  const config = await Configuration.findOne({ key: 'points_config' });
  if (config) {
    return config.value;
  }
  
  // Default configuration
  const defaultConfig = {
    pointsValue: 1000, // 1000 VND = 1 point
    silverThreshold: 1000,
    goldThreshold: 5000,
    pointsPerOrder: 1
  };
  
  // Save default config to DB
  await Configuration.create({
    key: 'points_config',
    value: defaultConfig,
    description: 'Points system configuration'
  });
  
  return defaultConfig;
};

// Helper function to calculate tier based on points and config
const calculateTier = (points, config) => {
  if (points >= config.goldThreshold) {
    return 'GOLD';
  } else if (points >= config.silverThreshold) {
    return 'SILVER';
  } else {
    return 'BRONZE';
  }
};

// @desc    Get all customers with points (Admin only)
// @route   GET /api/admin/points/customers
// @access  Private/Admin
export const getCustomersWithPoints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, tier } = req.query;
  
  // Build filter object
  let filter = { role: 'customer' };
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (tier && tier !== 'all') {
    filter['loyaltyPoints.tier'] = tier;
  }
  
  const skip = (page - 1) * limit;
  
  const customers = await User.find(filter)
    .select('-password')
    .sort({ 'loyaltyPoints.balance': -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Calculate points used for each customer
  const customersWithPointsUsed = await Promise.all(
    customers.map(async (customer) => {
      // Calculate total points earned
      const pointsEarned = await PointTransaction.aggregate([
        {
          $match: {
            user: customer._id,
            type: { $in: ['EARNED', 'ADJUSTMENT'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$points' }
          }
        }
      ]);

      // Calculate total points redeemed/used
      const pointsUsed = await PointTransaction.aggregate([
        {
          $match: {
            user: customer._id,
            type: { $in: ['REDEEMED', 'EXPIRED'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$points' }
          }
        }
      ]);

      const totalEarned = pointsEarned[0]?.total || 0;
      const totalUsed = pointsUsed[0]?.total || 0;

      return {
        ...customer.toObject(),
        pointsEarned: totalEarned,
        pointsUsed: totalUsed,
        // Current balance should equal earned - used
        remainingPoints: customer.loyaltyPoints.balance
      };
    })
  );
    
  const total = await User.countDocuments(filter);
  
  res.json({
    customers: customersWithPointsUsed,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get point transactions
// @route   GET /api/admin/points/transactions
// @access  Private/Admin
export const getPointTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, type, userId } = req.query;
  
  // Build filter object
  let filter = {};
  
  if (type && type !== 'all') {
    filter.type = type;
  }
  
  if (userId) {
    filter.user = userId;
  }
  
  const skip = (page - 1) * limit;
  
  let query = PointTransaction.find(filter)
    .populate('user', 'name email')
    .populate('order', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Apply search filter if provided
  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    const userIds = users.map(u => u._id);
    
    filter.$or = [
      { user: { $in: userIds } },
      { description: { $regex: search, $options: 'i' } }
    ];
    
    query = PointTransaction.find(filter)
      .populate('user', 'name email')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
  }
  
  const transactions = await query;
  const total = await PointTransaction.countDocuments(filter);
  
  res.json({
    transactions,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Create point transaction (Admin only)
// @route   POST /api/admin/points/transactions
// @access  Private/Admin
export const createPointTransaction = asyncHandler(async (req, res) => {
  const { userId, type, points, description } = req.body;
  
  if (!userId || !type || !points || !description) {
    res.status(400);
    throw new Error('All fields are required');
  }
  
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Validate points value
  if (points <= 0) {
    res.status(400);
    throw new Error('Points must be greater than 0');
  }
  
  // Check if user has enough points for redemption
  if (type === 'REDEEMED' && user.loyaltyPoints.balance < points) {
    res.status(400);
    throw new Error('Insufficient points balance');
  }
  
  // Create transaction
  const transaction = await PointTransaction.create({
    user: userId,
    type,
    points,
    description
  });
  
  // Update user's points balance
  let newBalance = user.loyaltyPoints.balance;
  
  switch (type) {
    case 'EARNED':
    case 'ADJUSTMENT':
      newBalance += points;
      break;
    case 'REDEEMED':
      newBalance -= points;
      break;
    case 'EXPIRED':
      newBalance = Math.max(0, newBalance - points);
      break;
  }
  
  // Get current points configuration
  const config = await getPointsConfigFromDB();
  
  // Update user's tier based on new balance and config
  const newTier = calculateTier(newBalance, config);
  
  user.loyaltyPoints.balance = newBalance;
  user.loyaltyPoints.tier = newTier;
  await user.save();
  
  const populatedTransaction = await PointTransaction.findById(transaction._id)
    .populate('user', 'name email loyaltyPoints');
  
  res.status(201).json({
    transaction: populatedTransaction,
    newBalance,
    newTier
  });
});

// @desc    Get customer point history
// @route   GET /api/points/history
// @access  Private
export const getCustomerPointHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  
  const skip = (page - 1) * limit;
  
  const transactions = await PointTransaction.find({ user: userId })
    .populate('order', 'orderNumber total')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await PointTransaction.countDocuments({ user: userId });
  
  const user = await User.findById(userId).select('loyaltyPoints');
  
  res.json({
    currentBalance: user.loyaltyPoints.balance,
    currentTier: user.loyaltyPoints.tier,
    transactions,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Add points for order completion
// @route   POST /api/points/earn
// @access  Private
export const earnPointsFromOrder = asyncHandler(async (req, res) => {
  const { orderId, orderAmount } = req.body;
  const userId = req.user._id;
  
  if (!orderId || !orderAmount) {
    res.status(400);
    throw new Error('Order ID and amount are required');
  }
  
  // Check if points already earned for this order
  const existingTransaction = await PointTransaction.findOne({
    user: userId,
    order: orderId,
    type: 'EARNED'
  });
  
  if (existingTransaction) {
    res.status(400);
    throw new Error('Points already earned for this order');
  }
  
  // Get current points configuration
  const config = await getPointsConfigFromDB();
  
  // Calculate points based on configuration
  const pointsEarned = Math.floor(orderAmount / config.pointsValue);
  
  if (pointsEarned <= 0) {
    res.status(400);
    throw new Error('Order amount too small to earn points');
  }
  
  // Create transaction
  const transaction = await PointTransaction.create({
    user: userId,
    type: 'EARNED',
    points: pointsEarned,
    description: `Tích điểm từ đơn hàng`,
    order: orderId
  });
  
  // Update user's points
  const user = await User.findById(userId);
  const newBalance = user.loyaltyPoints.balance + pointsEarned;
  
  // Calculate tier using existing config
  const newTier = calculateTier(newBalance, config);
  
  user.loyaltyPoints.balance = newBalance;
  user.loyaltyPoints.tier = newTier;
  await user.save();
  
  res.json({
    pointsEarned,
    newBalance,
    newTier,
    transaction: transaction._id
  });
});

// @desc    Redeem points for discount
// @route   POST /api/points/redeem
// @access  Private
export const redeemPoints = asyncHandler(async (req, res) => {
  const { points, description } = req.body;
  const userId = req.user._id;
  
  if (!points || points <= 0) {
    res.status(400);
    throw new Error('Invalid points amount');
  }
  
  const user = await User.findById(userId);
  
  if (user.loyaltyPoints.balance < points) {
    res.status(400);
    throw new Error('Insufficient points balance');
  }
  
  // Create redemption transaction
  const transaction = await PointTransaction.create({
    user: userId,
    type: 'REDEEMED',
    points,
    description: description || `Đổi ${points} điểm lấy voucher`
  });
  
  // Update user's points
  const newBalance = user.loyaltyPoints.balance - points;
  
  // Get current points configuration and update tier
  const config = await getPointsConfigFromDB();
  const newTier = calculateTier(newBalance, config);
  
  user.loyaltyPoints.balance = newBalance;
  user.loyaltyPoints.tier = newTier;
  await user.save();
  
  // Calculate discount amount (1 point = 1000 VND)
  const discountAmount = points * 1000;
  
  res.json({
    pointsRedeemed: points,
    discountAmount,
    newBalance,
    newTier,
    transaction: transaction._id
  });
});

// @desc    Use points for order discount
// @route   POST /api/points/use-for-order
// @access  Private
export const usePointsForOrder = asyncHandler(async (req, res) => {
  const { points, orderId, orderNumber } = req.body;
  const userId = req.user._id;
  
  if (!points || points <= 0) {
    res.status(400);
    throw new Error('Invalid points amount');
  }
  
  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }
  
  const user = await User.findById(userId);
  
  if (user.loyaltyPoints.balance < points) {
    res.status(400);
    throw new Error('Insufficient points balance');
  }
  
  // Check if points already used for this order
  const existingTransaction = await PointTransaction.findOne({
    user: userId,
    order: orderId,
    type: 'REDEEMED'
  });
  
  if (existingTransaction) {
    res.status(400);
    throw new Error('Points already used for this order');
  }
  
  // Create redemption transaction with order reference
  const transaction = await PointTransaction.create({
    user: userId,
    type: 'REDEEMED',
    points,
    description: `Sử dụng ${points} điểm cho đơn hàng ${orderNumber || orderId}`,
    order: orderId
  });
  
  // Update user's points
  const newBalance = user.loyaltyPoints.balance - points;
  
  // Get current points configuration and update tier
  const config = await getPointsConfigFromDB();
  const newTier = calculateTier(newBalance, config);
  
  user.loyaltyPoints.balance = newBalance;
  user.loyaltyPoints.tier = newTier;
  await user.save();
  
  // Calculate discount amount (1 point = 1000 VND)
  const discountAmount = points * 1000;
  
  res.json({
    success: true,
    pointsUsed: points,
    discountAmount,
    newBalance,
    newTier,
    transaction: transaction._id,
    message: `Đã sử dụng ${points} điểm cho đơn hàng`
  });
});

// @desc    Get points statistics (Admin only)
// @route   GET /api/admin/points/stats
// @access  Private/Admin
export const getPointsStats = asyncHandler(async (req, res) => {
  // Total points issued
  const totalPointsIssued = await PointTransaction.aggregate([
    { $match: { type: { $in: ['EARNED', 'ADJUSTMENT'] } } },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  
  // Total points redeemed
  const totalPointsRedeemed = await PointTransaction.aggregate([
    { $match: { type: 'REDEEMED' } },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  
  // Active members (with points > 0)
  const activeMembers = await User.countDocuments({
    role: 'customer',
    'loyaltyPoints.balance': { $gt: 0 }
  });
  
  // Members by tier
  const membersByTier = await User.aggregate([
    { $match: { role: 'customer' } },
    { $group: { _id: '$loyaltyPoints.tier', count: { $sum: 1 } } }
  ]);
  
  // Recent transactions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTransactions = await PointTransaction.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  // Top customers by points
  const topCustomers = await User.find({ role: 'customer' })
    .sort({ 'loyaltyPoints.balance': -1 })
    .limit(10)
    .select('name email loyaltyPoints');
  
  // Monthly points trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyTrend = await PointTransaction.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, type: 'EARNED' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        points: { $sum: '$points' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  res.json({
    overview: {
      totalPointsIssued: totalPointsIssued[0]?.total || 0,
      totalPointsRedeemed: totalPointsRedeemed[0]?.total || 0,
      activeMembers,
      recentTransactions
    },
    membersByTier: membersByTier.reduce((acc, tier) => {
      acc[tier._id] = tier.count;
      return acc;
    }, { BRONZE: 0, SILVER: 0, GOLD: 0 }),
    topCustomers,
    monthlyTrend
  });
});

// @desc    Update points configuration (Admin only)
// @route   PUT /api/admin/points/config
// @access  Private/Admin
export const updatePointsConfig = asyncHandler(async (req, res) => {
  const { pointsValue, silverThreshold, goldThreshold } = req.body;
  
  // Validate input
  if (!pointsValue || !silverThreshold || !goldThreshold) {
    res.status(400);
    throw new Error('All configuration values are required');
  }
  
  if (silverThreshold >= goldThreshold) {
    res.status(400);
    throw new Error('Gold threshold must be greater than silver threshold');
  }
  
  const newConfig = {
    pointsValue: parseInt(pointsValue),
    silverThreshold: parseInt(silverThreshold),
    goldThreshold: parseInt(goldThreshold),
    pointsPerOrder: 1
  };
  
  // Save to configuration collection
  await Configuration.findOneAndUpdate(
    { key: 'points_config' },
    { 
      value: newConfig,
      description: 'Points system configuration'
    },
    { upsert: true, new: true }
  );
  
  // Update all existing users' tiers based on new thresholds
  const users = await User.find({ role: 'customer' });
  for (let user of users) {
    const newTier = calculateTier(user.loyaltyPoints.balance, newConfig);
    if (user.loyaltyPoints.tier !== newTier) {
      user.loyaltyPoints.tier = newTier;
      await user.save();
    }
  }
  
  res.json({
    message: 'Points configuration updated successfully',
    config: newConfig
  });
});

// @desc    Get points configuration
// @route   GET /api/points/config
// @access  Public
export const getPointsConfig = asyncHandler(async (req, res) => {
  const config = await getPointsConfigFromDB();
  res.json(config);
});
