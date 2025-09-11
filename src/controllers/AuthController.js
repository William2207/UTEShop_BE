// src/controllers/authController.js
import User from '../models/user.js';
import Otp from '../models/Otp.js';
import { sendMail } from '../config/mailer.js';
import { otpHtml } from '../utils/emailTemplates.js';
import generateOtp from '../utils/generateOtp.js';
import { hash, compare } from '../utils/hash.js';
import {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/jwtServices.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/* ----------------------------- Helpers ----------------------------- */

const addMinutes = (d, mins) => new Date(d.getTime() + mins * 60000);

async function createAndSendOtp(email, type, title) {
  // clear OTP cũ cùng type
  await Otp.deleteMany({ email, type });

  const code = generateOtp(); // 6 chữ số
  const codeHash = await hash(code);
  const expiresAt = addMinutes(new Date(), 10); // 10 phút

  await Otp.create({ email, codeHash, type, expiresAt, attempts: 0 });

  await sendMail({
    to: email,
    subject: `${title} – Mã OTP`,
    html: otpHtml({ title, code }),
  });
}

/* ---------------------------- Controllers --------------------------- */

// 1) Gửi OTP đăng ký
export const registerRequestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const exists = await User.findOne({ email }).lean();
  if (exists) return res.status(409).json({ message: 'Email đã tồn tại' });

  await createAndSendOtp(email, 'register', 'Xác thực đăng ký');
  return res.json({ message: 'OTP đã được gửi' });
});

// 2) Xác minh OTP & tạo tài khoản
export const registerVerify = asyncHandler(async (req, res) => {
  const { email, code, name, password } = req.body;

  const otp = await Otp.findOne({ email, type: 'register' });
  if (!otp) return res.status(400).json({ message: 'OTP không tồn tại hoặc đã dùng' });

  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ message: 'OTP đã hết hạn' });
  }

  const ok = await compare(code, otp.codeHash);
  if (!ok) {
    otp.attempts = (otp.attempts || 0) + 1;
    await otp.save();
    return res.status(400).json({ message: 'Mã OTP không đúng' });
  }

  // Map name -> username để tương thích schema (kể cả khi bạn đã alias)
  const user = await User.create({ email, username: name, password });

  await Otp.deleteMany({ email, type: 'register' });

  return res.status(201).json({
    message: 'Đăng ký thành công',
    user: {
      id: user._id,
      email: user.email,
      name: user.name || user.username,
    },
  });
});

// 3) Gửi OTP quên mật khẩu
export const resetRequestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  await createAndSendOtp(email, 'reset', 'Đặt lại mật khẩu');
  return res.json({ message: 'OTP đã được gửi' });
});

// 4) Xác minh OTP & đổi mật khẩu
export const resetVerify = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  const otp = await Otp.findOne({ email, type: 'reset' });
  if (!otp) return res.status(400).json({ message: 'OTP không tồn tại hoặc đã dùng' });

  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ message: 'OTP đã hết hạn' });
  }

  const ok = await compare(code, otp.codeHash);
  if (!ok) {
    otp.attempts = (otp.attempts || 0) + 1;
    await otp.save();
    return res.status(400).json({ message: 'Mã OTP không đúng' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  user.password = newPassword; // pre-save hook sẽ hash
  await user.save();

  await Otp.deleteMany({ email, type: 'reset' });

  return res.json({ message: 'Đổi mật khẩu thành công' });
});

// 5) Đăng nhập
export const login = asyncHandler(async (req, res) => {
  console.log('🔐 LOGIN - Request body:', req.body);

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email & password required',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Tìm user theo email
  const user = await User.findOne({ email });
  if (!user) {
    console.log('❌ LOGIN - User not found:', email);
    return res.status(401).json({
      message: 'Sai email hoặc mật khẩu',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Kiểm tra password
  const ok = await user.comparePassword(password);
  if (!ok) {
    console.log('❌ LOGIN - Wrong password for:', email);
    return res.status(401).json({
      message: 'Sai email hoặc mật khẩu',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Tạo payload cho JWT với đầy đủ thông tin
  const payload = {
    _id: user._id, // Sử dụng _id thay vì id để nhất quán với MongoDB
    id: user._id, // Thêm id để tương thích
    email: user.email,
    name: user.name,
    role: user.role
  };

  console.log('🔑 LOGIN - Creating token with payload:', payload);

  // Tạo tokens
  const token = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  console.log('✅ LOGIN - Login successful for:', email);

  return res.json({
    token,
    refreshToken,
    user: {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      avatarUrl: user.avatarUrl || ''
    },
    message: 'Đăng nhập thành công'
  });
});

// 6) Lấy profile (yêu cầu middleware requireAuth set req.user)
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User không tồn tại' });
  res.json({ user });
});

// 7) Refresh access token
export const refreshTokenController = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const token = signToken({ id: payload.id, email: payload.email });
    return res.json({ token });
  } catch {
    return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
});

// 8) Logout (nếu bạn lưu refresh token server-side thì xoá ở đây)
// Hiện tại không lưu server-side -> chỉ trả OK để FE xoá local
export const logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});
