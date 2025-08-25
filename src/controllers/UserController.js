import User from "../models/user.js";

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

// Nếu có nhiều controller methods khác, export như sau:
// export const otherMethod = async (req, res) => { ... };

// Hoặc export tất cả as default object:
const UserController = {
  getProfile,
};

export default UserController;
