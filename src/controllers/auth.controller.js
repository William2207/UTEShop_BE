import { User } from "../models/User.model.js";
import { signToken, signRefreshToken, verifyRefreshToken } from "../services/jwt.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Lưu refresh tokens (tạm trong memory - có thể lưu DB/Redis)
let refreshTokens = [];

// Đăng ký
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email & password required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email already used" });
  }

  const user = await User.create({ name, email, password });

  return res.status(201).json({
    id: user._id,
    email: user.email,
    name: user.name,
  });
});

// Đăng nhập
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email & password required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  // Tạo access + refresh token
  const token = signToken({ id: user._id, email: user.email });
  const refresh = signRefreshToken({ id: user._id, email: user.email });
  refreshTokens.push(refresh);

  res.json({
    token,
    refreshToken: refresh,
    user: { id: user._id, email: user.email, name: user.name },
  });
});

// Lấy thông tin user
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ user });
});

// Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Refresh token required" });

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signToken({ id: payload.id, email: payload.email });

    // 👇 Log để bạn biết lúc nào có token mới
    console.log("🔄 New Access Token issued via refresh:", new Date().toISOString());
    console.log("🔄 New Access Token:", accessToken);
    res.json({ token: accessToken });
  } catch (e) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});



// Logout
export const logout = asyncHandler(async (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.json({ message: "Logged out successfully" });
});
