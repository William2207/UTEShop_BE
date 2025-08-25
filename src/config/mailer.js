import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // đảm bảo .env luôn được load


console.log("MAIL_HOST:", process.env.MAIL_HOST);
console.log("MAIL_PORT:", process.env.MAIL_PORT);
console.log("MAIL_USER:", process.env.MAIL_USER);


const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 587,
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP error:", err);
  } else {
    console.log("✅ SMTP ready:", success);
  }
});

export async function sendMail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || "noreply@example.com";
  return transporter.sendMail({ from, to, subject, html });
}
