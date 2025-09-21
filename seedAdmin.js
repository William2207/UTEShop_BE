import mongoose from "mongoose";
import User from "./src/models/user.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/fashion_store";

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Kết nối MongoDB thành công!");

        // Kiểm tra xem admin đã tồn tại chưa
        const existingAdmin = await User.findOne({ email: "admin@uteshop.com" });
        
        if (existingAdmin) {
            console.log("⚠️ Tài khoản admin đã tồn tại!");
            console.log("📧 Email: admin@uteshop.com");
            console.log("🔑 Mật khẩu: Admin@123");
            process.exit(0);
        }

        // Tạo tài khoản admin mặc định
        const admin = await User.create({
            name: "Admin UTEShop",
            email: "admin@uteshop.com",
            password: "Admin@123", // Mật khẩu mặc định
            role: "admin",
            phone: "0123456789",
            address: "UTE, Hồ Chí Minh"
        });

        console.log("✅ Tạo tài khoản admin thành công!");
        console.log("📧 Email: admin@uteshop.com");
        console.log("🔑 Mật khẩu: Admin@123");
        console.log("⚠️ Hãy đổi mật khẩu ngay sau khi đăng nhập lần đầu!");

        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi tạo tài khoản admin:", err);
        process.exit(1);
    }
}

seedAdmin();
