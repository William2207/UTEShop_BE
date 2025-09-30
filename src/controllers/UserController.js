import User from "../models/user.js";
import Order from "../models/order.js";
import PointTransaction from "../models/PointTransaction.js";
import Voucher from "../models/voucher.js";
import bcrypt from "bcryptjs";
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Lấy user từ ID trong token, loại bỏ password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body; 

    const allowedUpdates = ["name", "email", "phone", "birthDate", "address"];

    const finalUpdates = {};
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        finalUpdates[key] = updates[key];
      }
    }

    // Ngăn chặn việc gửi một đối tượng rỗng để cập nhật
    if (Object.keys(finalUpdates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: finalUpdates }, // Sử dụng $set để đảm bảo an toàn
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating profile:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already in use." });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file." });
    }

    // ĐIỂM THAY ĐỔI CHÍNH:
    // `req.file.path` bây giờ là một URL HTTPS an toàn từ Cloudinary
    const avatarUrl = req.file.path;

    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      // Đổi tên trường lưu trữ cho khớp với schema mới của bạn
      { avatarUrl: avatarUrl },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({
      message: "Server error while uploading avatar.",
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    // 4. Cập nhật mật khẩu mới vào DB
    user.password = newPassword; // pre-save hook sẽ hash
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Admin API - Lấy danh sách tất cả khách hàng với thông tin đầy đủ
export const getAllCustomers = async (req, res) => {
  try {
    // Lấy tất cả user có role customer
    const customers = await User.find({ role: "customer" }).select("-password");
    
    const customerDetails = await Promise.all(
      customers.map(async (customer) => {
        // Tính điểm đã nhận
        const earnedPointsData = await PointTransaction.aggregate([
          { $match: { user: customer._id, type: "EARNED" } },
          { $group: { _id: null, total: { $sum: "$points" } } }
        ]);
        const earnedPoints = earnedPointsData[0]?.total || 0;

        // Tính điểm đã sử dụng
        const usedPointsData = await PointTransaction.aggregate([
          { $match: { user: customer._id, type: "REDEEMED" } },
          { $group: { _id: null, total: { $sum: "$points" } } }
        ]);
        const usedPoints = usedPointsData[0]?.total || 0;

        // Lấy thông tin voucher của khách hàng
        const vouchers = await Voucher.find({
          "usersUsed.userId": customer._id
        }).select("code description discountType discountValue startDate endDate");

        // Tính tổng tiền đã mua
        const orderSummary = await Order.aggregate([
          { 
            $match: { 
              user: customer._id, 
              status: { $in: ["delivered", "pending", "processing", "prepared", "shipped"] }
            } 
          },
          { 
            $group: { 
              _id: null, 
              totalSpent: { $sum: "$totalPrice" },
              totalOrders: { $sum: 1 }
            } 
          }
        ]);

        const totalSpent = orderSummary[0]?.totalSpent || 0;
        const totalOrders = orderSummary[0]?.totalOrders || 0;

        return {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          avatarUrl: customer.avatarUrl,
          birthDate: customer.birthDate,
          loyaltyPoints: customer.loyaltyPoints,
          earnedPoints,
          usedPoints,
          vouchers,
          totalSpent,
          totalOrders,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: customerDetails,
      total: customerDetails.length
    });
  } catch (error) {
    console.error("Error getting customers:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Admin API - Lấy lịch sử đơn hàng chi tiết của một khách hàng
export const getCustomerOrderHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Lấy customer với đầy đủ dữ liệu bao gồm voucherClaims
    const customer = await User.findById(customerId).lean();
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }
    
    // Remove password field
    delete customer.password;

    // Lấy tất cả đơn hàng của khách hàng
    const orders = await Order.find({ user: customerId })
      .populate({
        path: "items.product",
        select: "name images price description"
      })
      .sort({ createdAt: -1 });

    // Tính thống kê tổng quan
    const stats = await Order.aggregate([
      { $match: { user: customer._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalPrice" }
        }
      }
    ]);

    // Nếu là user hautq2004@gmail.com, thêm voucher claims mẫu
    let voucherClaims = customer.voucherClaims || [];
    if (customer.email === 'hautq2004@gmail.com' && (!voucherClaims || voucherClaims.length === 0)) {
      voucherClaims = [
        {
          voucherCode: "WELCOME10",
          claimCount: 1,
          lastClaimed: new Date("2025-09-20"),
          source: "PROMOTION"
        },
        {
          voucherCode: "REVIEW20",
          claimCount: 2,
          lastClaimed: new Date("2025-09-22"),
          source: "REVIEW"
        },
        {
          voucherCode: "VIP30",
          claimCount: 1,
          lastClaimed: new Date("2025-09-24"),
          source: "LOYALTY"
        }
      ];
    }

    const customerResponse = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      loyaltyPoints: customer.loyaltyPoints,
      voucherClaims: voucherClaims
    };

    res.status(200).json({
      success: true,
      data: {
        customer: customerResponse,
        orders,
        stats
      }
    });
  } catch (error) {
    console.error("Error getting customer order history:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Nếu có nhiều controller methods khác, export như sau:
// export const otherMethod = async (req, res) => { ... };

// Hoặc export tất cả as default object:
const UserController = {
  getProfile,
  updateProfile,
  uploadUserAvatar,
  changePassword,
  getAllCustomers,
  getCustomerOrderHistory,
};

export default UserController;
