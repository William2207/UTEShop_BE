import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

// Import các module tùy chỉnh
import connectDB from './src/config/db.js'; // Giả sử đường dẫn này là chính xác
import rateLimiter from './src/middlewares/rateLimiter.js'; // Điều chỉnh đường dẫn nếu cần
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

// Tải biến môi trường
dotenv.config();

// Kết nối cơ sở dữ liệu
connectDB();

const app = express();

// ------------------- Middlewares -------------------

// Cấu hình CORS chi tiết hơn từ file gốc đầu tiên
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: false // Thường đặt là false cho REST API công khai
}));

// Ghi log request
app.use(morgan('dev'));

// Parse JSON body
app.use(express.json());

// ------------------- Routes -------------------

// Route kiểm tra "sức khỏe" của server
app.get('/health', (req, res) => res.json({ ok: true }));

// Route gốc
app.get('/', (req, res) => res.send('UTEShop API running...'));

// Áp dụng Rate Limiter cho các route xác thực và sau đó là router chính
app.use('/api/auth', rateLimiter, authRoutes);

// Các route khác
app.use('/api/users', userRoutes);

// ------------------- Khởi động Server -------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
