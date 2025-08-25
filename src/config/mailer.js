import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: Boolean(process.env.SECURE_SMTP === "true"),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendMail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || "noreply@example.com";
  return transporter.sendMail({ from, to, subject, html });
}

// Hoặc export as default object:
const mailService = {
  sendMail,
};

export default mailService;
