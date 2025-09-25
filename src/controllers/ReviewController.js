import Review from "../models/review.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import Voucher from "../models/voucher.js";
import User from "../models/user.js";
import UserVoucher from "../models/userVoucher.js";
import mongoose from "mongoose";

// Tạo review mới
export const createReview = async (req, res) => {
  try {
    console.log("🎯 createReview called");
    console.log("- req.params:", req.params);
    console.log("- req.body:", req.body);
    console.log("- req.user:", req.user);

    const { productId } = req.params;
    const { rating, comment, orderId } = req.body;
    const userId = req.user.id;

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Kiểm tra đơn hàng này đã được review chưa (nếu có orderId)
    if (orderId) {
      const existingOrderReview = await Review.findOne({
        order: orderId,
      });

      if (existingOrderReview) {
        console.log("❌ Order already reviewed:", orderId);
        return res.status(400).json({
          message: "Đơn hàng này đã được đánh giá rồi",
        });
      }
    }

    // Debug logging
    console.log("🔍 Review validation debug:");
    console.log("- userId:", userId);
    console.log("- productId:", productId);
    console.log("- orderId:", orderId);

    // Convert productId to ObjectId if it's a string
    const productObjectId = new mongoose.Types.ObjectId(productId);
    console.log("- productObjectId:", productObjectId);

    // Kiểm tra user đã mua và nhận hàng chưa
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        status: "delivered", // status trong DB là string, không phải số
        "items.product": productObjectId,
      });

      console.log("- Found order with orderId:", order ? "YES" : "NO");
      if (order) {
        console.log(
          "- Order items:",
          order.items.map((item) => ({
            product: item.product,
            matches: item.product.toString() === productId,
          }))
        );
      }

      if (!order) {
        console.log("❌ No delivered order found for orderId:", orderId);
        // TEMPORARY: Allow review without order for testing
        console.log("⚠️ BYPASSING ORDER VALIDATION FOR TESTING");
        // return res.status(400).json({
        //   message: "Bạn cần mua và nhận hàng trước khi đánh giá",
        // });
      }
    } else {
      // Nếu không có orderId, kiểm tra xem user có đơn hàng delivered với sản phẩm này không
      const deliveredOrder = await Order.findOne({
        user: userId,
        status: "delivered", // status trong DB là string, không phải số
        "items.product": productObjectId,
      });

      console.log(
        "- Found delivered order without orderId:",
        deliveredOrder ? "YES" : "NO"
      );
      if (deliveredOrder) {
        console.log(
          "- Order items:",
          deliveredOrder.items.map((item) => ({
            product: item.product,
            matches: item.product.toString() === productId,
          }))
        );
      }

      if (!deliveredOrder) {
        console.log(
          "❌ No delivered order found for user:",
          userId,
          "product:",
          productId
        );
        // TEMPORARY: Allow review without order for testing  
        console.log("⚠️ BYPASSING ORDER VALIDATION FOR TESTING");
        // return res.status(400).json({
        //   message: "Bạn cần mua và nhận hàng trước khi đánh giá",
        // });
      }
    }

    // Tạo review mới
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
      order: orderId,
    });

    await review.save();
    console.log("✅ Review saved successfully:", review);

    // TÌM TẤT CẢ voucher loại "ĐÁNH GIÁ" và đang "HOẠT ĐỘNG"
    const now = new Date();
    
    // 1. Tìm tất cả voucher REVIEW đang hoạt động
    const allReviewVouchers = await Voucher.find({
      rewardType: 'REVIEW',
      startDate: { $lte: now },
      endDate: { $gt: now },
      $expr: { $lt: ["$claimsCount", "$maxIssued"] },
    }).sort({ createdAt: 1 });

    console.log('🔍 Found all active REVIEW vouchers:', allReviewVouchers.length);

    // 2. ĐẾM SỐ LẦN user đã nhận mỗi voucher (dùng UserVoucher collection - đáng tin cậy)
    console.log('🔍 Counting voucher claims from UserVoucher collection...');
    const userClaimedVouchers = await UserVoucher.find({ 
      user: userId 
    }).select('voucherCode').lean();
    
    const userVoucherCounts = {};
    userClaimedVouchers.forEach(uv => {
      userVoucherCounts[uv.voucherCode] = (userVoucherCounts[uv.voucherCode] || 0) + 1;
    });
    
    console.log('🔍 User voucher claim counts (from UserVoucher DB):', userVoucherCounts);

    // 3. Lọc voucher dựa trên SỐ LẦN ĐÃ NHẬN so với GIỚI HẠN
    const availableVouchers = allReviewVouchers.filter(voucher => {
      const userClaimCount = userVoucherCounts[voucher.code] || 0; // Số lần đã nhận
      const maxAllowed = voucher.maxUsesPerUser || 1; // Giới hạn cho phép
      
      // Chỉ hiển thị nếu chưa đạt giới hạn
      const canClaimMore = userClaimCount < maxAllowed;
      
      console.log(`📋 ${voucher.code}: claimed=${userClaimCount}/${maxAllowed}, canClaim=${canClaimMore}`);
      
      return canClaimMore;
    });

    console.log('🎯 Available vouchers for user:', availableVouchers.length);
    
    availableVouchers.forEach((voucher, index) => {
      console.log(`✅ Voucher ${index + 1}: ${voucher.code}`, {
        description: voucher.description,
        discount: `${voucher.discountValue}%`,
        maxUsesPerUser: voucher.maxUsesPerUser,
        available: `${voucher.maxIssued - (voucher.claimsCount || 0)}/${voucher.maxIssued}`
      });
    });

    const reviewVouchers = availableVouchers; // Rename để giữ tương thích code bên dưới

    // 2. Định nghĩa phần thưởng điểm tích lũy
    const pointsReward = {
      type: "POINTS",
      description: "Nhận 100 điểm tích lũy",
      value: 100, // Số điểm sẽ nhận
    };

    // 3. Tạo danh sách phần thưởng
    const availableRewards = [pointsReward];
    
    // THÊM TẤT CẢ voucher loại "ĐÁNH GIÁ" đang "HOẠT ĐỘNG"
    if (reviewVouchers && reviewVouchers.length > 0) {
      reviewVouchers.forEach((voucher, index) => {
        const voucherReward = {
          type: "VOUCHER",
          description: `Nhận voucher: ${voucher.description}`,
          voucherCode: voucher.code,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          minOrderAmount: voucher.minOrderAmount,
          endDate: voucher.endDate
        };
        availableRewards.push(voucherReward);
        console.log(`🎁 Thêm voucher ${index + 1}:`, {
          code: voucherReward.voucherCode,
          discount: `${voucherReward.discountValue}%`,
          description: voucherReward.description
        });
      });
    } else {
      console.log('❌ Không có voucher ĐÁNH GIÁ nào hoạt động - chỉ tặng điểm thưởng');
    }
    
    console.log('📝 Tổng số phần thưởng gửi về frontend:', availableRewards.length);
    console.log('🎯 Chi tiết tất cả phần thưởng:', availableRewards.map(r => ({
      type: r.type,
      description: r.description,
      ...(r.voucherCode && { voucherCode: r.voucherCode })
    })));

    // Populate thông tin user
    await review.populate("user", "name avatarUrl");

    res.status(201).json({
      message: "Đánh giá thành công",
      review,
      rewards: availableRewards,
    });
  } catch (error) {
    console.error("❌ Error in createReview:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách review của sản phẩm
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);

    // Build filter - convert productId to ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const filter = { product: productObjectId };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    console.log(
      "🔍 Getting reviews for product:",
      productId,
      "with filter:",
      filter
    );

    const [reviews, total, stats] = await Promise.all([
      Review.find(filter)
        .populate("user", "name avatarUrl")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Review.countDocuments(filter),
      // Thống kê rating
      Review.aggregate([
        { $match: { product: productObjectId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: "$rating",
            },
          },
        },
      ]),
    ]);

    // Tính phân bố rating
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach((rating) => {
        ratingDistribution[rating]++;
      });
    }

    const responseStats = {
      averageRating:
        stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0,
      totalReviews: stats.length > 0 ? stats[0].totalReviews : 0,
      ratingDistribution,
    };

    console.log("📊 Returning review stats:", responseStats);

    res.json({
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      reviews,
      stats: responseStats,
    });
  } catch (error) {
    console.error("Error in getProductReviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, user: userId },
      { rating, comment },
      { new: true }
    ).populate("user", "name avatarUrl");

    if (!review) {
      return res.status(404).json({ message: "Review không tồn tại" });
    }

    res.json({
      message: "Cập nhật đánh giá thành công",
      review,
    });
  } catch (error) {
    console.error("Error in updateReview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Xóa review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({ message: "Review không tồn tại" });
    }

    res.json({ message: "Xóa đánh giá thành công" });
  } catch (error) {
    console.error("Error in deleteReview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if an order has been reviewed
export const checkOrderReviewed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify order belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: "delivered",
    });

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại hoặc chưa được giao",
      });
    }

    // Check if order has been reviewed
    const review = await Review.findOne({
      order: orderId,
    });

    res.json({
      hasReview: !!review,
      review: review
        ? {
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in checkOrderReviewed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy review của user cho sản phẩm
export const getUserReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      user: userId,
      product: productId,
    }).populate("user", "name avatarUrl");

    res.json({ review });
  } catch (error) {
    console.error("Error in getUserReview:", error);
    res.status(500).json({ message: "Server error" });
  }
};
