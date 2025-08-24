const { z } = require('zod');
const { sendMail } = require('../config/mailer');
const { otpHtml } = require('../utils/emailTemplates');
const generateOtp = require('../utils/generateOtp');
const { hash, compare } = require('../utils/hash');
const User = require('../models/User');
const Otp = require('../models/Otp');

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

function addMinutes(date, minutes) { return new Date(date.getTime() + minutes * 60000); }

async function createAndSendOtp(email, type, title) {
  await Otp.deleteMany({ email, type });
  const code = generateOtp();
  const codeHash = await hash(code);
  const expiresAt = addMinutes(new Date(), 10);
  await Otp.create({ email, codeHash, type, expiresAt });
  await sendMail({ to: email, subject: `${title} – Mã OTP`, html: otpHtml({ title, code }) });
}

// 1) Đăng ký: yêu cầu OTP
async function registerRequestOtp(req, res) {
  const { email } = RegisterRequestSchema.parse(req).body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email đã tồn tại' });
  await createAndSendOtp(email, 'register', 'Xác thực đăng ký');
  return res.json({ message: 'OTP đã được gửi' });
}

// 2) Đăng ký: xác minh OTP & tạo tài khoản
async function registerVerify(req, res) {
  const { email, code, name, password } = RegisterVerifySchema.parse(req).body;
  const otp = await Otp.findOne({ email, type: 'register' });
  if (!otp) return res.status(400).json({ error: 'OTP không tồn tại hoặc đã dùng' });
  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ error: 'OTP đã hết hạn' });
  }
  if (!(await compare(code, otp.codeHash))) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ error: 'Mã OTP không đúng' });
  }
  const passwordHash = await hash(password);
  const user = await User.create({ email, name, passwordHash });
  await Otp.deleteMany({ email, type: 'register' });
  return res.json({ message: 'Đăng ký thành công', user: { id: user._id, email, name } });
}

// 3) Quên mật khẩu: yêu cầu OTP
async function resetRequestOtp(req, res) {
  const { email } = ResetRequestSchema.parse(req).body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'Email không tồn tại' });
  await createAndSendOtp(email, 'reset', 'Đặt lại mật khẩu');
  return res.json({ message: 'OTP đã được gửi' });
}

// 4) Quên mật khẩu: xác minh OTP & đổi mật khẩu
async function resetVerify(req, res) {
  const { email, code, newPassword } = ResetVerifySchema.parse(req).body;
  const otp = await Otp.findOne({ email, type: 'reset' });
  if (!otp) return res.status(400).json({ error: 'OTP không tồn tại hoặc đã dùng' });
  if (otp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otp._id });
    return res.status(400).json({ error: 'OTP đã hết hạn' });
  }
  if (!(await compare(code, otp.codeHash))) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ error: 'Mã OTP không đúng' });
  }
  const passwordHash = await hash(newPassword);
  await User.updateOne({ email }, { $set: { passwordHash } });
  await Otp.deleteMany({ email, type: 'reset' });
  return res.json({ message: 'Đổi mật khẩu thành công' });
}

module.exports = {
  registerRequestOtp,
  registerVerify,
  resetRequestOtp,
  resetVerify,
};
