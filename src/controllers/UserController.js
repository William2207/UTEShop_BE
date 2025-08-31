import User from "../models/user.js";
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
    const updates = req.body; // Lấy toàn bộ body từ request

    // 1. Định nghĩa các trường mà người dùng được phép cập nhật thông qua endpoint này
    const allowedUpdates = ["name", "email", "phone", "birthDate", "address"];

    // 2. Tạo một đối tượng mới chỉ chứa các trường hợp lệ từ `updates`
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

    // 3. Sử dụng đối tượng `finalUpdates` đã được làm sạch
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

    // 3. Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Cập nhật mật khẩu mới vào DB
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error." });
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
};

export default UserController;
