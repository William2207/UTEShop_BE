import User from "../models/user.js";
import PointTransaction from "../models/PointTransaction.js";
import asyncHandler from "../utils/asyncHandler.js";

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
    
  const total = await User.countDocuments(filter);
  
  res.json({
    customers,
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
  
  // Update user's tier based on new balance
  let newTier = 'BRONZE';
  if (newBalance >= 5000) {
    newTier = 'GOLD';
  } else if (newBalance >= 1000) {
    newTier = 'SILVER';
  }
  
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
  
  // Calculate points (1 point per 1000 VND)
  const pointsEarned = Math.floor(orderAmount / 1000);
  
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
  
  // Update tier
  let newTier = 'BRONZE';
  if (newBalance >= 5000) {
    newTier = 'GOLD';
  } else if (newBalance >= 1000) {
    newTier = 'SILVER';
  }
  
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
  
  // Update tier if necessary
  let newTier = 'BRONZE';
  if (newBalance >= 5000) {
    newTier = 'GOLD';
  } else if (newBalance >= 1000) {
    newTier = 'SILVER';
  }
  
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
  
  // This would typically be stored in a configuration collection
  // For now, we'll just return the updated config
  const config = {
    pointsValue: pointsValue || 1000,
    silverThreshold: silverThreshold || 1000,
    goldThreshold: goldThreshold || 5000,
    updatedAt: new Date()
  };
  
  // TODO: Save to configuration collection
  
  res.json({
    message: 'Points configuration updated successfully',
    config
  });
});

// @desc    Get points configuration
// @route   GET /api/points/config
// @access  Public
export const getPointsConfig = asyncHandler(async (req, res) => {
  // TODO: Fetch from configuration collection
  const config = {
    pointsValue: 1000, // 1000 VND = 1 point
    silverThreshold: 1000,
    goldThreshold: 5000,
    pointsPerOrder: 1 // 1 point per 1000 VND
  };
  
  res.json(config);
});
