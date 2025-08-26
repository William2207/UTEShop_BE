// ESM
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT || 587),
  secure: String(process.env.MAIL_PORT) === '465', // 465 => SSL
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Named export: sendMail
export async function sendMail({ to, subject, text, html, from }) {
  return transporter.sendMail({
    from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

// (tuỳ chọn) kiểm tra cấu hình SMTP
export async function verifyMailer() {
  return transporter.verify();
}
