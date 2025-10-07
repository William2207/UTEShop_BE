import mongoose from "mongoose";
import User from "./src/models/user.js";
import PointTransaction from "./src/models/PointTransaction.js";
import Configuration from "./src/models/Configuration.js";
import Order from "./src/models/order.js";
import bcrypt from "bcryptjs";

const MONGO_URI = "mongodb://127.0.0.1:27017/fashion_store";

async function seedCompletePointsSystem() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");

    // Xóa dữ liệu cũ
    await User.deleteMany({ role: "customer" });
    await PointTransaction.deleteMany({});
    await Configuration.deleteMany({ key: 'points_config' });
    await Order.deleteMany({});
    
    // 1. Tạo cấu hình điểm tích lũy
    const pointsConfig = {
      pointsValue: 1000, // 1000 VND = 1 điểm
      silverThreshold: 1000,
      goldThreshold: 3000, // Thay đổi để test
      pointsPerOrder: 1
    };

    await Configuration.create({
      key: 'points_config',
      value: pointsConfig,
      description: 'Points system configuration'
    });
    console.log(`✅ Đã tạo cấu hình điểm: Bạc >= ${pointsConfig.silverThreshold}, Vàng >= ${pointsConfig.goldThreshold}`);

    const hashedPassword = await bcrypt.hash("123456", 10);
    
    // 2. Tạo customers với điểm khác nhau để test tier
    const customers = [
      {
        name: "Nguyễn Văn A (Đồng)",
        email: "bronze1@example.com", 
        password: hashedPassword,
        role: "customer",
        phone: "0901234567",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        loyaltyPoints: {
          balance: 500, // < 1000 -> BRONZE
          tier: "BRONZE"
        }
      },
      {
        name: "Trần Thị B (Đồng)",
        email: "bronze2@example.com",
        password: hashedPassword,
        role: "customer", 
        phone: "0907654321",
        address: "456 Đường DEF, Quận 3, TP.HCM",
        loyaltyPoints: {
          balance: 800, // < 1000 -> BRONZE
          tier: "BRONZE"
        }
      },
      {
        name: "Lê Văn C (Bạc)",
        email: "silver1@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0909876543", 
        address: "789 Đường GHI, Quận 5, TP.HCM",
        loyaltyPoints: {
          balance: 1500, // >= 1000, < 3000 -> SILVER
          tier: "SILVER"
        }
      },
      {
        name: "Phạm Thị D (Bạc)",
        email: "silver2@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0905432167",
        address: "321 Đường JKL, Quận 7, TP.HCM", 
        loyaltyPoints: {
          balance: 2500, // >= 1000, < 3000 -> SILVER
          tier: "SILVER"
        }
      },
      {
        name: "Hoàng Văn E (Vàng)",
        email: "gold1@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0903456789",
        address: "654 Đường MNO, Quận 10, TP.HCM",
        loyaltyPoints: {
          balance: 5200, // >= 3000 -> GOLD
          tier: "GOLD"
        }
      },
      {
        name: "Vũ Thị F (Vàng)",
        email: "gold2@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0908765432",
        address: "987 Đường PQR, Quận Bình Thạnh, TP.HCM",
        loyaltyPoints: {
          balance: 8500, // >= 3000 -> GOLD
          tier: "GOLD"
        }
      }
    ];

    const createdCustomers = await User.insertMany(customers);
    console.log(`✅ Đã tạo ${createdCustomers.length} khách hàng với các hạng khác nhau`);

    // 3. Tạo một số đơn hàng
    const orders = [
      {
        user: createdCustomers[0]._id,
        orderNumber: "ORD001",
        totalPrice: 2000000, // Sẽ tích được 2000 điểm
        status: "delivered",
        items: [],
        shippingAddress: `${createdCustomers[0].name}, ${createdCustomers[0].phone}, ${createdCustomers[0].address}`,
        paymentMethod: "COD",
        paymentStatus: "paid",
        createdAt: new Date("2024-01-15T10:30:00.000Z")
      },
      {
        user: createdCustomers[2]._id,
        orderNumber: "ORD002",
        totalPrice: 1500000, // Sẽ tích được 1500 điểm
        status: "delivered",
        items: [],
        shippingAddress: `${createdCustomers[2].name}, ${createdCustomers[2].phone}, ${createdCustomers[2].address}`,
        paymentMethod: "COD",
        paymentStatus: "paid",
        createdAt: new Date("2024-01-20T14:15:00.000Z")
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`✅ Đã tạo ${createdOrders.length} đơn hàng`);

    // 4. Tạo giao dịch điểm với đa dạng loại
    const transactions = [
      // Customer 1 (Bronze) - tích điểm từ order
      {
        user: createdCustomers[0]._id,
        type: "EARNED",
        points: 2000,
        description: "Tích điểm từ đơn hàng ORD001",
        order: createdOrders[0]._id,
        createdAt: new Date("2024-01-15T10:35:00.000Z")
      },
      {
        user: createdCustomers[0]._id,
        type: "REDEEMED",
        points: 500,
        description: "Sử dụng 500 điểm cho đơn hàng ORD001",
        order: createdOrders[0]._id,
        createdAt: new Date("2024-01-15T10:30:00.000Z")
      },

      // Customer 2 (Bronze)
      {
        user: createdCustomers[1]._id,
        type: "EARNED",
        points: 300,
        description: "Tích điểm từ đơn hàng nhỏ",
        createdAt: new Date("2024-02-01T12:00:00.000Z")
      },
      {
        user: createdCustomers[1]._id,
        type: "EARNED",
        points: 600,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-02-15T14:20:00.000Z")
      },
      {
        user: createdCustomers[1]._id,
        type: "REDEEMED",
        points: 100,
        description: "Đổi voucher giảm giá",
        createdAt: new Date("2024-02-20T16:30:00.000Z")
      },

      // Customer 3 (Silver) - tích điểm từ order
      {
        user: createdCustomers[2]._id,
        type: "EARNED",
        points: 1500,
        description: "Tích điểm từ đơn hàng ORD002",
        order: createdOrders[1]._id,
        createdAt: new Date("2024-01-20T14:20:00.000Z")
      },
      {
        user: createdCustomers[2]._id,
        type: "EARNED",
        points: 500,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-03-01T10:15:00.000Z")
      },
      {
        user: createdCustomers[2]._id,
        type: "REDEEMED",
        points: 500,
        description: "Sử dụng điểm tại cửa hàng",
        createdAt: new Date("2024-03-05T15:45:00.000Z")
      },

      // Customer 4 (Silver)
      {
        user: createdCustomers[3]._id,
        type: "EARNED",
        points: 1200,
        description: "Tích điểm từ đơn hàng",
        createdAt: new Date("2024-01-25T11:30:00.000Z")
      },
      {
        user: createdCustomers[3]._id,
        type: "EARNED",
        points: 800,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-02-10T13:20:00.000Z")
      },
      {
        user: createdCustomers[3]._id,
        type: "ADJUSTMENT",
        points: 700,
        description: "Thưởng điểm sinh nhật",
        createdAt: new Date("2024-03-01T09:00:00.000Z")
      },
      {
        user: createdCustomers[3]._id,
        type: "REDEEMED",
        points: 200,
        description: "Đổi voucher miễn phí ship",
        createdAt: new Date("2024-03-10T16:00:00.000Z")
      },

      // Customer 5 (Gold)
      {
        user: createdCustomers[4]._id,
        type: "EARNED",
        points: 2500,
        description: "Tích điểm từ đơn hàng lớn",
        createdAt: new Date("2024-01-10T09:20:00.000Z")
      },
      {
        user: createdCustomers[4]._id,
        type: "EARNED",
        points: 1800,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-02-05T11:30:00.000Z")
      },
      {
        user: createdCustomers[4]._id,
        type: "ADJUSTMENT",
        points: 1500,
        description: "Thưởng điểm khách hàng VIP",
        createdAt: new Date("2024-02-20T10:00:00.000Z")
      },
      {
        user: createdCustomers[4]._id,
        type: "REDEEMED",
        points: 600,
        description: "Sử dụng điểm đổi quà",
        createdAt: new Date("2024-03-01T14:15:00.000Z")
      },

      // Customer 6 (Gold)
      {
        user: createdCustomers[5]._id,
        type: "EARNED",
        points: 3200,
        description: "Tích điểm từ đơn hàng lớn",
        createdAt: new Date("2024-01-05T14:30:00.000Z")
      },
      {
        user: createdCustomers[5]._id,
        type: "EARNED",
        points: 2800,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-02-12T16:45:00.000Z")
      },
      {
        user: createdCustomers[5]._id,
        type: "EARNED",
        points: 2900,
        description: "Tích điểm từ đơn hàng cao cấp",
        createdAt: new Date("2024-02-25T12:00:00.000Z")
      },
      {
        user: createdCustomers[5]._id,
        type: "REDEEMED",
        points: 400,
        description: "Đổi voucher cao cấp",
        createdAt: new Date("2024-03-12T17:30:00.000Z")
      }
    ];

    const createdTransactions = await PointTransaction.insertMany(transactions);
    console.log(`✅ Đã tạo ${createdTransactions.length} giao dịch điểm`);

    // 5. Thống kê
    const totalEarned = transactions.filter(t => ['EARNED', 'ADJUSTMENT'].includes(t.type)).reduce((sum, t) => sum + t.points, 0);
    const totalUsed = transactions.filter(t => ['REDEEMED', 'EXPIRED'].includes(t.type)).reduce((sum, t) => sum + t.points, 0);
    const ordersWithPoints = transactions.filter(t => t.order).length;

    console.log("\n📊 Thống kê hệ thống:");
    console.log(`- Cấu hình: ${pointsConfig.pointsValue} VND = 1 điểm`);
    console.log(`- Hạng Bạc: >= ${pointsConfig.silverThreshold} điểm`);
    console.log(`- Hạng Vàng: >= ${pointsConfig.goldThreshold} điểm`);
    console.log("- Khách hàng hạng Đồng: 2");
    console.log("- Khách hàng hạng Bạc: 2"); 
    console.log("- Khách hàng hạng Vàng: 2");
    console.log(`- Tổng điểm đã phát: ${totalEarned.toLocaleString()}`);
    console.log(`- Tổng điểm đã sử dụng: ${totalUsed.toLocaleString()}`);
    console.log(`- Đơn hàng: ${createdOrders.length}`);
    console.log(`- Giao dịch liên kết đơn hàng: ${ordersWithPoints}`);

    process.exit();
  } catch (err) {
    console.error("❌ Lỗi seed dữ liệu:", err);
    process.exit(1);
  }
}

seedCompletePointsSystem();
