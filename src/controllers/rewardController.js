// controllers/rewardController.js
import User from "../models/user.js";
import Voucher from "../models/voucher.js";
import UserVoucher from "../models/userVoucher.js";
import PointTransaction from "../models/PointTransaction.js"; // Import model lịch sử điểm

export const claimReviewReward = async (req, res) => {
  const userId = req.user.id;
  // Frontend sẽ gửi lên: { rewardType: 'VOUCHER', voucherCode: '...' } hoặc { rewardType: 'POINTS', value: 100 }
  const { rewardType, voucherCode, value } = req.body;
  
  console.log("🎯 claimReviewReward called:", { userId, rewardType, voucherCode, value });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (rewardType === "VOUCHER") {
      if (!voucherCode)
        return res.status(400).json({ message: "Mã voucher không hợp lệ." });

      // Tìm voucher
      const voucher = await Voucher.findOne({ code: voucherCode });
      if (!voucher) {
        return res.status(404).json({ message: "Voucher không tồn tại." });
      }

      // Kiểm tra voucher có còn khả dụng để phát hành không
      if (voucher.claimsCount >= voucher.maxIssued) {
        return res.status(400).json({ 
          message: `Voucher ${voucherCode} đã hết lượt phát hành.` 
        });
      }

      // Kiểm tra user đã claim voucher này chưa
      const userUsedIndex = voucher.usersUsed.findIndex(
        u => u.userId.toString() === userId
      );

      if (userUsedIndex > -1) {
        // User đã từng nhận voucher này
        voucher.usersUsed[userUsedIndex].claimCount += 1;
      } else {
        // User chưa từng nhận voucher này
        voucher.usersUsed.push({ 
          userId: userId, 
          claimCount: 1, 
          useCount: 0 
        });
      }

      // Tạo bản ghi UserVoucher
      console.log("📝 Creating UserVoucher record...");
      const userVoucher = await UserVoucher.create({
        user: userId,
        voucher: voucher._id,
        voucherCode: voucher.code,
        source: "REVIEW"
      });
      console.log("✅ UserVoucher created:", userVoucher._id);

      // Cập nhật số lần voucher được claim
      console.log(`🎯 Before claim: ${voucher.code} claimsCount=${voucher.claimsCount || 0}`);
      voucher.claimsCount = (voucher.claimsCount || 0) + 1;
      await voucher.save();
      console.log(`✅ After claim: ${voucher.code} claimsCount=${voucher.claimsCount}`);
      
      // Verify the update worked
      const updatedVoucher = await Voucher.findById(voucher._id);
      console.log(`🔍 Verification: ${updatedVoucher.code} claimsCount=${updatedVoucher.claimsCount}`);

      return res
        .status(200)
        .json({
          message: `Bạn đã nhận được voucher ${voucherCode}! Sử dụng ngay tại trang thanh toán.`,
          userVoucher: {
            id: userVoucher._id,
            code: voucher.code,
            claimedAt: userVoucher.claimedAt
          }
        });
    } else if (rewardType === "POINTS") {
      if (!value || value <= 0)
        return res.status(400).json({ message: "Số điểm không hợp lệ." });

      // 1. Cộng điểm vào tài khoản người dùng
      user.loyaltyPoints.balance += value;
      await user.save();

      // 2. Tạo một bản ghi lịch sử giao dịch điểm
      const transaction = new PointTransaction({
        user: userId,
        type: "EARNED",
        points: value,
        description: "Nhận điểm thưởng từ việc đánh giá sản phẩm",
      });
      await transaction.save();

      return res
        .status(200)
        .json({ message: `Bạn đã nhận được ${value} điểm tích lũy!` });
    } else {
      return res
        .status(400)
        .json({ message: "Loại phần thưởng không hợp lệ." });
    }
  } catch (error) {
    console.error("Error claiming reward:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's vouchers
// @route   GET /user/vouchers
// @access  Private
export const getUserVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userVouchers = await UserVoucher.find({ user: userId })
      .populate('voucher')
      .sort({ claimedAt: -1 });

    const availableVouchers = userVouchers.filter(uv => !uv.isUsed);
    const usedVouchers = userVouchers.filter(uv => uv.isUsed);

    res.json({
      success: true,
      data: {
        available: availableVouchers,
        used: usedVouchers,
        total: userVouchers.length
      }
    });
  } catch (error) {
    console.error("Error getting user vouchers:", error);
    res.status(500).json({ message: "Server error" });
  }
};
