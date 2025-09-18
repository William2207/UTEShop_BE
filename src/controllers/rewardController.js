// controllers/rewardController.js
import User from "../models/user.js";
import Voucher from "../models/voucher.js";
import PointTransaction from "../models/PointTransaction.js"; // Import model lịch sử điểm

export const claimReviewReward = async (req, res) => {
  const userId = req.user.id;
  // Frontend sẽ gửi lên: { rewardType: 'VOUCHER', voucherCode: '...' } hoặc { rewardType: 'POINTS', value: 100 }
  const { rewardType, voucherCode, value } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (rewardType === "VOUCHER") {
      if (!voucherCode)
        return res.status(400).json({ message: "Mã voucher không hợp lệ." });

      // Gán voucher cho người dùng (logic này tùy thuộc vào thiết kế của bạn)
      // Cách đơn giản là không cần làm gì, người dùng chỉ cần biết mã và tự sử dụng.
      // Cách phức tạp hơn là tạo một collection "UserVouchers" để lưu voucher vào kho của người dùng.
      // Giả sử cách đơn giản:
      return res
        .status(200)
        .json({
          message: `Bạn đã nhận được voucher ${voucherCode}! Sử dụng ngay tại trang thanh toán.`,
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
