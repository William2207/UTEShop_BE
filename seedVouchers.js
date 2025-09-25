import mongoose from "mongoose";
import Voucher from "./src/models/voucher.js"; // Đường dẫn đến Voucher model của bạn
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Dữ liệu mẫu voucher
const sampleVouchers = [
  // Voucher giảm theo phần trăm
  {
    code: "NEWUSER20",
    description: "Giảm 20% cho khách hàng mới - Tối đa 100k",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscountAmount: 100000,
    minOrderAmount: 200000,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    maxIssued: 1000,
    usesCount: 245,
    claimsCount: 245,
    maxUsesPerUser: 1,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },

  // Voucher giảm giá cố định
  {
    code: "SAVE50K",
    description: "Giảm ngay 50.000đ cho đơn hàng từ 500k",
    discountType: "FIXED_AMOUNT",
    discountValue: 50000,
    minOrderAmount: 500000,
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-03-31"),
    maxIssued: 500,
    usesCount: 123,
    claimsCount: 123,
    maxUsesPerUser: 2,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },

  // Voucher miễn phí ship
  {
    code: "FREESHIP",
    description: "Miễn phí vận chuyển toàn quốc",
    discountType: "FREE_SHIP",
    discountValue: 30000,
    minOrderAmount: 200000,
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-04-30"),
    maxIssued: 2000,
    usesCount: 1567,
    claimsCount: 1567,
    maxUsesPerUser: 5,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },

  // Voucher sale lớn
  {
    code: "SALE40",
    description: "SALE SỐC - Giảm 40% tối đa 300k",
    discountType: "PERCENTAGE",
    discountValue: 40,
    maxDiscountAmount: 300000,
    minOrderAmount: 1000000,
    startDate: new Date("2024-03-15"),
    endDate: new Date("2024-03-25"),
    maxIssued: 100,
    usesCount: 89,
    claimsCount: 89,
    maxUsesPerUser: 1,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },

  // Voucher VIP
  {
    code: "VIP30",
    description: "Ưu đãi VIP - Giảm 30% không giới hạn",
    discountType: "PERCENTAGE",
    discountValue: 30,
    minOrderAmount: 2000000,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    maxIssued: 50,
    usesCount: 12,
    claimsCount: 12,
    maxUsesPerUser: 3,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },

  // Voucher cuối tuần
  {
    code: "WEEKEND15",
    description: "Khuyến mãi cuối tuần - Giảm 15%",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscountAmount: 150000,
    minOrderAmount: 300000,
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-06-30"),
    maxIssued: 300,
    usesCount: 78,
    claimsCount: 78,
    maxUsesPerUser: 2,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },

  // Voucher sinh nhật
  {
    code: "BIRTHDAY25",
    description: "Khuyến mãi sinh nhật - Giảm 25%",
    discountType: "PERCENTAGE",
    discountValue: 25,
    maxDiscountAmount: 200000,
    minOrderAmount: 500000,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    maxIssued: 200,
    usesCount: 45,
    claimsCount: 45,
    maxUsesPerUser: 1,
    usersUsed: [],
    isActive: true,
    rewardType: "BIRTHDAY",
  },

  // Voucher flash sale
  {
    code: "FLASH50",
    description: "Flash Sale - Giảm ngay 50k",
    discountType: "FIXED_AMOUNT",
    discountValue: 50000,
    minOrderAmount: 200000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày từ bây giờ
    maxIssued: 100,
    usesCount: 23,
    claimsCount: 23,
    maxUsesPerUser: 1,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },

  // Voucher phần thưởng đánh giá
  {
    code: "REVIEW15",
    description: "Cảm ơn bạn đã đánh giá - Giảm 15%",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscountAmount: 200000,
    minOrderAmount: 200000,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"), // Còn hạn lâu
    maxIssued: 1000,
    usesCount: 0,
    claimsCount: 0,
    maxUsesPerUser: 1,
    usersUsed: [],
    isActive: true,
    rewardType: "REVIEW", // Dành cho reward đánh giá
  },

  // Voucher đã hết lượt (để test)
  {
    code: "SOLDOUT",
    description: "Voucher giảm 15% - Đã hết lượt",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscountAmount: 75000,
    minOrderAmount: 300000,
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-06-30"),
    maxIssued: 200,
    usesCount: 200,
    claimsCount: 200,
    maxUsesPerUser: 1,
    usersUsed: [],
    isActive: true,
    rewardType: "GENERAL",
  },
];

// Hàm kết nối database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      family: 4, // ép IPv4, tránh ::1
    });
    console.log("✅ Kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

// Hàm seed dữ liệu
const seedVouchers = async () => {
  try {
    console.log("🌱 Bắt đầu seed dữ liệu vouchers...");

    // Xóa tất cả voucher cũ (tùy chọn)
    await Voucher.deleteMany({});
    console.log("🗑️  Đã xóa tất cả vouchers cũ");

    // Thêm vouchers mới
    const result = await Voucher.insertMany(sampleVouchers);

    console.log(`✅ Đã thêm ${result.length} vouchers thành công:`);
    result.forEach((voucher) => {
      console.log(`   - ${voucher.code}: ${voucher.description}`);
    });
  } catch (error) {
    console.error("❌ Lỗi khi seed vouchers:", error.message);

    // Nếu lỗi trùng code, thử update thay vì insert
    if (error.code === 11000) {
      console.log("⚠️  Phát hiện voucher trùng code, đang thử cập nhật...");
      await updateExistingVouchers();
    }
  }
};

// Hàm cập nhật voucher đã tồn tại
const updateExistingVouchers = async () => {
  try {
    for (const voucher of sampleVouchers) {
      await Voucher.findOneAndUpdate({ code: voucher.code }, voucher, {
        upsert: true,
        new: true,
      });
      console.log(`   ✅ Cập nhật/thêm voucher: ${voucher.code}`);
    }
    console.log("✅ Hoàn thành cập nhật vouchers!");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật vouchers:", error.message);
  }
};

// Hàm chính
const main = async () => {
  await connectDB();
  await seedVouchers();

  console.log("🎉 Seed vouchers hoàn thành!");
  console.log("📊 Tổng quan:");

  const totalVouchers = await Voucher.countDocuments();
  const activeVouchers = await Voucher.countDocuments({ isActive: true });

  console.log(`   - Tổng số vouchers: ${totalVouchers}`);
  console.log(`   - Vouchers đang hoạt động: ${activeVouchers}`);

  // Đóng kết nối
  await mongoose.connection.close();
  console.log("🔐 Đã đóng kết nối database");
  process.exit(0);
};

// Chạy script
main().catch((error) => {
  console.error("❌ Lỗi chung:", error);
  process.exit(1);
});
