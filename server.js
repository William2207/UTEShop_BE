// server.js
import "dotenv/config"; // nạp .env sớm nhất
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Modules của bạn
import connectDB from "./src/config/db.js";
import rateLimiter from "./src/middlewares/rateLimiter.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";

// tạo 4 khoi hien thi san pham
import productRoutes from "./src/routes/productRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import brandRoutes from "./src/routes/brandRoutes.js";
import orderRoutes from './src/routes/orderRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';


const app = express();

/* ----------------------------- Middlewares ------------------------------ */

// CORS: hỗ trợ 1 hoặc nhiều origin, cách nhau dấu phẩy trong FRONTEND_URL
const origins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: false, // nếu dùng cookie/session hãy chuyển true và cấu hình lại
  })
);

app.use(morgan("dev"));

// parse JSON (giới hạn để tránh payload quá lớn)
app.use(express.json({ limit: "200kb" }));

/* -------------------------------- Routes -------------------------------- */

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => res.send("UTEShop API running..."));

app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/user", userRoutes);

// thêm 4 khối sản phẩm trang chủ
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

/* ------------------------------- 404 & Err ------------------------------ */

// 404 JSON thay vì HTML
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler cuối cùng
app.use((err, req, res, next) => {
  // Nếu là lỗi CORS ở trên, trả 403 thay vì 500
  const isCors = err?.message === "Not allowed by CORS";
  const status = isCors ? 403 : err.status || 500;
  const msg = isCors ? "CORS blocked" : err.message || "Internal Server Error";
  if (status >= 500) console.error(err); // log lỗi server
  res.status(status).json({ message: msg });
});

/* ------------------------------- Bootstrap ------------------------------ */

const PORT = Number(process.env.PORT) || 5000;

const serverStart = async () => {
  try {
    await connectDB(); // chỉ start server sau khi DB OK
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (e) {
    console.error("❌ Failed to start server:", e);
    process.exit(1);
  }
};

serverStart();

/* --------------------------- Graceful Shutdown -------------------------- */
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

export default app; // tiện cho test/e2e
