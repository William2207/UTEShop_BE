import Voucher from "../models/voucher.js";
import UserVoucher from "../models/userVoucher.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Get all vouchers (Admin only)
// @route   GET /api/admin/vouchers
// @access  Private/Admin
export const getAllVouchers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, discountType } = req.query;
  
  // Build filter object
  let filter = {};
  
  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status === 'active') {
    filter.isActive = true;
  } else if (status === 'inactive') {
    filter.isActive = false;
  }
  
  if (discountType && discountType !== 'all') {
    filter.discountType = discountType;
  }
  
  const skip = (page - 1) * limit;
  
  const vouchers = await Voucher.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  // Auto-migrate: Add claimsCount field to vouchers that don't have it
  // And sync claimsCount with actual UserVoucher records
  // Also migrate maxUses to maxIssued
  for (let voucher of vouchers) {
    let needsSave = false;
    
    if (voucher.claimsCount === undefined) {
      // Count actual claims from UserVoucher table
      const actualClaimsCount = await UserVoucher.countDocuments({ 
        voucher: voucher._id 
      });
      voucher.claimsCount = actualClaimsCount;
      needsSave = true;
    }
    
    // Migrate maxUses to maxIssued
    if (voucher.maxUses !== undefined && (!voucher.maxIssued || voucher.maxIssued === null)) {
      voucher.maxIssued = voucher.maxUses;
      voucher.maxUses = undefined;
      needsSave = true;
    }
    
    
    if (needsSave) {
      await voucher.save();
    }

    // Tìm số lần nhận tối đa của 1 user
    const maxUserClaims = voucher.usersUsed ? 
      Math.max(...voucher.usersUsed.map(u => u.claimCount || 0), 0) : 
      0;
    
    // Thêm thông tin về lượt nhận vào voucher
    voucher._doc.maxUserClaims = maxUserClaims;
  }
    
  const total = await Voucher.countDocuments(filter);
  
  res.json({
    vouchers,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get single voucher
// @route   GET /api/admin/vouchers/:id
// @access  Private/Admin
export const getVoucherById = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }
  
  res.json(voucher);
});

// @desc    Create new voucher
// @route   POST /api/admin/vouchers
// @access  Private/Admin
export const createVoucher = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    startDate,
    endDate,
    maxIssued,
    maxIssuedPerUser,
    isActive,
    rewardType
  } = req.body;
  
  // Check if voucher code already exists
  const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
  if (existingVoucher) {
    res.status(400);
    throw new Error('Voucher code already exists');
  }
  
  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    res.status(400);
    throw new Error('Start date must be before end date');
  }
  
  // Validate discount value for percentage type
  if (discountType === 'PERCENTAGE' && (discountValue <= 0 || discountValue > 100)) {
    res.status(400);
    throw new Error('Percentage discount must be between 1 and 100');
  }
  
  const voucher = await Voucher.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue: discountType === 'FREE_SHIP' ? 0 : discountValue,
    maxDiscountAmount,
    minOrderAmount: minOrderAmount || 0,
    startDate,
    endDate,
    maxIssued,
    maxIssuedPerUser: maxIssuedPerUser || 1,
    isActive: isActive !== undefined ? isActive : true,
    rewardType: rewardType || 'GENERAL'
  });
  
  res.status(201).json(voucher);
});

// @desc    Update voucher
// @route   PUT /api/admin/vouchers/:id
// @access  Private/Admin
export const updateVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }
  
  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    startDate,
    endDate,
    maxIssued,
    maxUsesPerUser,
    isActive
  } = req.body;
  
  // Check if code is being changed and if new code already exists
  if (code && code.toUpperCase() !== voucher.code) {
    const existingVoucher = await Voucher.findOne({ 
      code: code.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existingVoucher) {
      res.status(400);
      throw new Error('Voucher code already exists');
    }
  }
  
  // Validate dates if provided
  const newStartDate = startDate || voucher.startDate;
  const newEndDate = endDate || voucher.endDate;
  if (new Date(newStartDate) >= new Date(newEndDate)) {
    res.status(400);
    throw new Error('Start date must be before end date');
  }
  
  // Validate discount value for percentage type
  const newDiscountType = discountType || voucher.discountType;
  const newDiscountValue = discountValue !== undefined ? discountValue : voucher.discountValue;
  if (newDiscountType === 'PERCENTAGE' && (newDiscountValue <= 0 || newDiscountValue > 100)) {
    res.status(400);
    throw new Error('Percentage discount must be between 1 and 100');
  }
  
  // Update fields
  voucher.code = code ? code.toUpperCase() : voucher.code;
  voucher.description = description || voucher.description;
  voucher.discountType = discountType || voucher.discountType;
  voucher.discountValue = discountType === 'FREE_SHIP' ? 0 : (discountValue !== undefined ? discountValue : voucher.discountValue);
  voucher.maxDiscountAmount = maxDiscountAmount !== undefined ? maxDiscountAmount : voucher.maxDiscountAmount;
  voucher.minOrderAmount = minOrderAmount !== undefined ? minOrderAmount : voucher.minOrderAmount;
  voucher.startDate = startDate || voucher.startDate;
  voucher.endDate = endDate || voucher.endDate;
  voucher.maxIssued = maxIssued !== undefined ? maxIssued : voucher.maxIssued;
  voucher.maxUsesPerUser = maxUsesPerUser !== undefined ? maxUsesPerUser : voucher.maxUsesPerUser;
  voucher.isActive = isActive !== undefined ? isActive : voucher.isActive;
  
  const updatedVoucher = await voucher.save();
  res.json(updatedVoucher);
});

// @desc    Delete voucher
// @route   DELETE /api/admin/vouchers/:id
// @access  Private/Admin
export const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }
  
  // Check if voucher has been used
  if (voucher.usesCount > 0) {
    res.status(400);
    throw new Error('Cannot delete voucher that has been used. Deactivate it instead.');
  }
  
  await Voucher.deleteOne({ _id: req.params.id });
  res.json({ message: 'Voucher deleted successfully' });
});

// @desc    Validate voucher code (for customer use)
// @route   POST /api/vouchers/validate
// @access  Private
export const validateVoucher = asyncHandler(async (req, res) => {
  const { code, orderAmount, userId } = req.body;
  
  if (!code || !orderAmount) {
    res.status(400);
    throw new Error('Voucher code and order amount are required');
  }
  
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }
  
  // Check if voucher is active
  if (!voucher.isActive) {
    res.status(400);
    throw new Error('Voucher is not active');
  }
  
  // Check if voucher is within valid date range
  const now = new Date();
  if (now < voucher.startDate || now > voucher.endDate) {
    res.status(400);
    throw new Error('Voucher is not valid at this time');
  }
  
  // Check if voucher has remaining issuing slots
  if (voucher.claimsCount >= voucher.maxIssued) {
    res.status(400);
    throw new Error('Voucher has reached maximum issuance limit');
  }
  
  // Check minimum order amount
  if (orderAmount < voucher.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount is ${voucher.minOrderAmount.toLocaleString('vi-VN')} VND`);
  }
  
  // Check user usage limit
  if (userId) {
    const userUsage = voucher.usersUsed.find(u => u.userId.toString() === userId);
    if (userUsage && userUsage.count >= voucher.maxIssuedPerUser) {
      res.status(400);
      throw new Error('You have reached the maximum usage limit for this voucher');
    }
  }
  
  // Calculate discount amount
  let discountAmount = 0;
  switch (voucher.discountType) {
    case 'PERCENTAGE':
      discountAmount = (orderAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
        discountAmount = voucher.maxDiscountAmount;
      }
      break;
    case 'FIXED_AMOUNT':
      discountAmount = Math.min(voucher.discountValue, orderAmount);
      break;
    case 'FREE_SHIP':
      discountAmount = 0; // This will be handled separately for shipping costs
      break;
  }
  
  res.json({
    valid: true,
    voucher: {
      _id: voucher._id,
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue
    },
    discountAmount,
    finalAmount: Math.max(0, orderAmount - discountAmount)
  });
});

// @desc    Apply voucher to order
// @route   POST /api/vouchers/apply
// @access  Private
export const applyVoucher = asyncHandler(async (req, res) => {
  const { code, userId, orderId } = req.body;
  
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }
  
  // Increment usage count
  voucher.usesCount += 1;
  
  // Track user usage
  const userUsageIndex = voucher.usersUsed.findIndex(u => u.userId.toString() === userId);
  if (userUsageIndex >= 0) {
    voucher.usersUsed[userUsageIndex].count += 1;
  } else {
    voucher.usersUsed.push({ userId, count: 1 });
  }
  
  await voucher.save();
  
  res.json({ 
    message: 'Voucher applied successfully',
    voucher: {
      code: voucher.code,
      usesCount: voucher.usesCount,
      claimsCount: voucher.claimsCount,
      maxIssued: voucher.maxIssued
    }
  });
});

// @desc    Get voucher statistics
// @route   GET /api/admin/vouchers/stats
// @access  Private/Admin
export const getVoucherStats = asyncHandler(async (req, res) => {
  const totalVouchers = await Voucher.countDocuments();
  const activeVouchers = await Voucher.countDocuments({ isActive: true });
  const expiredVouchers = await Voucher.countDocuments({ 
    endDate: { $lt: new Date() }
  });
  
  const totalUsage = await Voucher.aggregate([
    { $group: { _id: null, totalUses: { $sum: '$usesCount' } } }
  ]);
  
  const topVouchers = await Voucher.find()
    .sort({ claimsCount: -1 })
    .limit(5)
    .select('code description usesCount claimsCount maxIssued discountType discountValue');
  
  res.json({
    overview: {
      total: totalVouchers,
      active: activeVouchers,
      expired: expiredVouchers,
      totalUsage: totalUsage[0]?.totalUses || 0
    },
    topVouchers
  });
});
