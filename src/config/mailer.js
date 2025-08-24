const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
host: process.env.MAIL_HOST,
port: Number(process.env.MAIL_PORT || 587),
secure: Boolean(process.env.SECURE_SMTP === 'true'),
auth: {
user: process.env.MAIL_USER,
pass: process.env.MAIL_PASS,
},
});


async function sendMail({ to, subject, html }) {
const from = process.env.MAIL_FROM || 'noreply@example.com';
return transporter.sendMail({ from, to, subject, html });
}


module.exports = { sendMail };