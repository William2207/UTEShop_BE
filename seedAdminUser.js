import mongoose from "mongoose";
import User from "./src/models/user.js";
import bcrypt from "bcryptjs";

const MONGO_URI = "mongodb://127.0.0.1:27017/fashion_store";

async function seedAdminUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");

    const adminId = new mongoose.Types.ObjectId("68cc4f900ad1b8e8406fb488");
    const adminEmail = "hautq2004@gmail.com";

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ 
      $or: [
        { _id: adminId }, 
        { email: adminEmail }
      ]
    });

    if (existingAdmin) {
      console.log("⚠️  Tài khoản admin đã tồn tại:");
      console.log(`   - ID: ${existingAdmin._id}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Role: ${existingAdmin.role}`);
      console.log(`   - Name: ${existingAdmin.name}`);
      
      // Nếu muốn cập nhật thay vì tạo mới
      if (existingAdmin._id.toString() !== adminId.toString()) {
        console.log("🔄 Cập nhật ID của admin...");
        // Xóa admin cũ và tạo lại với ID mới
        await User.deleteOne({ _id: existingAdmin._id });
      } else {
        process.exit(0);
      }
    }

    // Tạo mật khẩu đã hash
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    // Tạo admin user với ID cụ thể
    const adminUser = new User({
      _id: adminId,
      name: "Admin User",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      phone: "0900000000",
      address: "Admin Address",
      loyaltyPoints: {
        balance: 0,
        tier: "BRONZE"
      }
    });

    await adminUser.save();

    console.log("✅ Đã tạo tài khoản admin thành công!");
    console.log(`   - ID: ${adminUser._id}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Name: ${adminUser.name}`);
    console.log(`   - Password: 123456 (mặc định)`);
    
    console.log("\n🔑 Thông tin đăng nhập:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: 123456`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi tạo admin user:", err);
    process.exit(1);
  }
}

seedAdminUser();
