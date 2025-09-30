import mongoose from "mongoose";
import User from "./src/models/user.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/fashion_store";

async function updateUserToAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");

    const email = "hautq2004@gmail.com";
    const newId = new mongoose.Types.ObjectId("68cc4f900ad1b8e8406fb488");

    // Tìm user hiện tại
    const currentUser = await User.findOne({ email });
    
    if (!currentUser) {
      console.log("❌ Không tìm thấy user với email:", email);
      process.exit(1);
    }

    console.log("📋 User hiện tại:");
    console.log(`   - ID: ${currentUser._id}`);
    console.log(`   - Email: ${currentUser.email}`);
    console.log(`   - Role: ${currentUser.role}`);

    // Kiểm tra ID mới có bị trùng không
    const existingUserWithNewId = await User.findById(newId);
    if (existingUserWithNewId && existingUserWithNewId._id.toString() !== currentUser._id.toString()) {
      console.log("❌ ID mới đã được sử dụng bởi user khác");
      process.exit(1);
    }

    // Tạo user mới với ID và role mới
    const userData = {
      _id: newId,
      name: currentUser.name,
      email: currentUser.email,
      password: currentUser.password,
      role: "admin", // Thay đổi thành admin
      phone: currentUser.phone,
      address: currentUser.address,
      loyaltyPoints: currentUser.loyaltyPoints,
      voucherClaims: currentUser.voucherClaims || []
    };

    // Xóa user cũ và tạo user mới
    await User.deleteOne({ _id: currentUser._id });
    const newUser = new User(userData);
    await newUser.save();

    console.log("✅ Cập nhật thành công!");
    console.log("📋 User sau khi cập nhật:");
    console.log(`   - ID: ${newUser._id}`);
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Role: ${newUser.role}`);
    console.log(`   - Name: ${newUser.name}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi cập nhật user:", err);
    process.exit(1);
  }
}

updateUserToAdmin();
