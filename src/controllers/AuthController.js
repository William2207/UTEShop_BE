import { z } from 'zod';
import User from '../models/user.js';
import Otp from '../models/Otp.js';
import { sendMail } from '../config/mailer.js';
import { otpHtml } from '../utils/emailTemplates.js';
import generateOtp from '../utils/generateOtp.js';
import { hash, compare } from '../utils/hash.js';
import { signToken, signRefreshToken, verifyRefreshToken } from '../services/jwtServices.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ------------------- Zod Schemas -------------------

const EMAIL = z.string().email();
const PASSWORD = z.string().min(6);

const RegisterRequestSchema = z.object({ body: z.object({ email: EMAIL }) });
const RegisterVerifySchema = z.object({
  body: z.object({
    email: EMAIL,
    code: z.string().length(6),
    name: z.string().min(2),
    password: PASSWORD,
  }),
});

const ResetRequestSchema = z.object({ body: z.object({ email: EMAIL }) });
const ResetVerifySchema = z.object({
  body: z.object({ email: EMAIL, code: z.string().length(6), newPassword: PASSWORD }),
});

// ------------------- Helper Functions -------------------

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

async function createAndSendOtp(email, type, title) {
  await Otp.deleteMany({ email, type });
  const code = generateOtp();
  const codeHash = await hash(code);
  const expiresAt = addMinutes(new Date(), 10);
  await Otp.create({ email, codeHash, type, expiresAt });
  await sendMail({ to: email, subject: `${title} – Mã OTP`, html: otpHtml({ title, code }) });
}

// Lưu refresh tokens (tạm trong memory - có thể lưu DB/Redis)
let refreshTokens = [];

// ------------------- Controllers -------------------

// 1) Đăng ký: yêu cầu OTP
export const registerRequestOtp = asyncHandler(async (req, res) => {
  const { email } = RegisterRequestSchema.parse(req).body;
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ error: 'Email đã tồn tại' });
  }
  await createAndSendOtp(email, 'register', 'Xác thực đăng ký');
  return res.json({ message: 'OTP đã được gửi' });
});

/// 2) Đăng ký: xác minh OTP & tạo tài khoản
export const registerVerify = asyncHandler(async (req, res) => {
  // THAY ĐỔI 1: Không cần parse lại schema ở đây.
  // Middleware `validate` đã làm việc này rồi. Chúng ta chỉ cần lấy dữ liệu đã được
  // xác thực từ `req.body`.
  const { email, code, username, password } = req.body;

  // Logic xác thực OTP của bạn đã đúng, giữ nguyên.
  const otp = await Otp.findOne({ email, type: 'register' });

  if (!otp) {
    return res.status(400).json({ error: 'OTP không tồn tại hoặc đã dùng' });
  }
  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ error: 'OTP đã hết hạn' });
  }
  if (!(await compare(code, otp.codeHash))) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ error: 'Mã OTP không đúng' });
  }

  // THAY ĐỔI 2 (QUAN TRỌNG NHẤT): Ánh xạ dữ liệu trước khi tạo User.
  // Lấy giá trị từ biến `name` (mà frontend gửi) và gán nó vào trường `username`
  // (mà Mongoose Model yêu cầu).
  // Mật khẩu plaintext `password` được truyền vào, vì chúng ta tin tưởng
  // Mongoose middleware `pre('save')` sẽ tự động hash nó.
  const user = await User.create({
    email,
    username,
    password,
  });

  await Otp.deleteMany({ email, type: 'register' });

  // THAY ĐỔI 3: Khi trả về dữ liệu, đảm bảo trả về đúng trường.
  // Đối tượng `user` từ database sẽ có `user.username`. Chúng ta sẽ trả về
  // là `name: user.username` để frontend nhận được dữ liệu nhất quán.
  return res.status(201).json({
    message: 'Đăng ký thành công',
    user: { id: user._id, email: user.email, name: user.username },
  });
});

// 3) Quên mật khẩu: yêu cầu OTP
export const resetRequestOtp = asyncHandler(async (req, res) => {
  const { email } = ResetRequestSchema.parse(req).body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'Email không tồn tại' });
  }
  await createAndSendOtp(email, 'reset', 'Đặt lại mật khẩu');
  return res.json({ message: 'OTP đã được gửi' });
});

// 4) Quên mật khẩu: xác minh OTP & đổi mật khẩu
export const resetVerify = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = ResetVerifySchema.parse(req).body;
  const otp = await Otp.findOne({ email, type: 'reset' });

  if (!otp) {
    return res.status(400).json({ error: 'OTP không tồn tại hoặc đã dùng' });
  }
  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ error: 'OTP đã hết hạn' });
  }
  if (!(await compare(code, otp.codeHash))) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ error: 'Mã OTP không đúng' });
  }

  const user = await User.findOne({ email });
  user.password = newPassword; // Gán password mới
  await user.save(); // Mongoose middleware sẽ hash password trước khi lưu

  await Otp.deleteMany({ email, type: 'reset' });
  return res.json({ message: 'Đổi mật khẩu thành công' });
});

// 5) Đăng nhập
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  // Tạo access + refresh token
  const token = signToken({ id: user._id, email: user.email });
  const refresh = signRefreshToken({ id: user._id, email: user.email });
  refreshTokens.push(refresh);

  // Log token lúc login
  console.log('✅ Access Token created at login:', new Date().toISOString());
  console.log('✅ Access Token:', token);
  console.log('✅ Refresh Token:', refresh);

  res.json({
    token,
    refreshToken: refresh,
    user: { id: user._id, email: user.email, name: user.name },
  });
});

// 6) Lấy thông tin user
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json({ user });
});

// 7) Refresh token
export const refreshTokenController = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signToken({ id: payload.id, email: payload.email });

    // Log token khi refresh từ client
    console.log('🔄 New Access Token issued via refresh:', new Date().toISOString());
    console.log('🔄 New Access Token:', accessToken);

    res.json({ token: accessToken });
  } catch (e) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
});

// 8) Logout
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  refreshTokens = refreshTokens.filter((t) => t !== refreshToken);
  res.json({ message: 'Logged out successfully' });
});

// ------------------- Auto Token mỗi 15 phút -------------------

// Hàm tạo access token từ refreshTokens trong memory
function autoGenerateToken() {
  if (refreshTokens.length === 0) return;

  refreshTokens.forEach((rt) => {
    try {
      const payload = verifyRefreshToken(rt); // kiểm tra refresh token còn hạn
      const accessToken = signToken({ id: payload.id, email: payload.email });
      console.log('🔄 Auto Access Token (15 phút):', new Date().toISOString());
      console.log('🔄 Access Token:', accessToken);
    } catch (err) {
      console.log('❌ Refresh token hết hạn hoặc không hợp lệ:', rt);
      // Nếu muốn xóa refresh token hết hạn khỏi array:
      // refreshTokens = refreshTokens.filter(t => t !== rt);
    }
  });
}

// Gọi lần đầu
autoGenerateToken();

// Lặp lại mỗi 15 phút
setInterval(autoGenerateToken, 15 * 60 * 1000);