// src/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendMail } from "./mailer.js";

const userSocketMap = new Map();

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173", // URL của frontend
      methods: ["GET", "POST"],
    },
  });

  // Middleware để xác thực người dùng qua JWT khi họ kết nối
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.userId = decoded.id; // Gắn userId vào object socket
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId}, socketId: ${socket.id}`);

    // Lưu lại kết nối của người dùng
    userSocketMap.set(socket.userId, socket.id);

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      // Xóa người dùng khỏi "sổ danh bạ" khi họ ngắt kết nối
      userSocketMap.delete(socket.userId);
    });
  });

  return io;
};

/**
 * Hàm tiện ích để gửi thông báo đến một người dùng cụ thể
 * @param {string} userId - ID của người dùng cần nhận thông báo
 * @param {string} eventName - Tên của sự kiện (ví dụ: 'order_status_update')
 * @param {object} data - Dữ liệu cần gửi (ví dụ: { orderId, newStatus, message })
 */
export const sendNotificationToUser = async (io, userId, eventName, data) => {
  const socketId = userSocketMap.get(userId.toString());
  if (socketId) {
    console.log(
      `🚀 Sending event '${eventName}' to user ${userId} via socket ${socketId}`
    );
    io.to(socketId).emit(eventName, data);
  } else {
    console.log(`🤷 User ${userId} is not connected.`);
  }

  // Gửi email thông báo nếu có email trong data
  try {
    // Lấy thông tin người dùng để có email
    const user = await User.findById(userId).select("email name");
    if (!user) {
      console.error(`Email not sent: User with ID ${userId} not found.`);
      return;
    }

    console.log(`📧 Preparing to send email notification to ${user.email}`);
    await sendMail({
      to: user.email,
      subject: `🔔 Thông báo mới từ UTE SHOP`,
      html: `
                <h1>Xin chào ${user.name},</h1>
                <p>Bạn có một thông báo mới:</p>
                <blockquote>${data.message}</blockquote>
                <br><br>
                <p>Trân trọng,<br>Đội ngũ UTE SHOP</p>
            `,
    });

    console.log(`✅ Email notification sent successfully to ${user.email}`);
  } catch (error) {
    console.error(
      `❌ Failed to send email notification to user ${userId}:`,
      error
    );
  }
};
