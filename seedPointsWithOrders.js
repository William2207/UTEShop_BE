import mongoose from "mongoose";
import User from "./src/models/user.js";
import PointTransaction from "./src/models/PointTransaction.js";
import Order from "./src/models/order.js";
import bcrypt from "bcryptjs";

const MONGO_URI = "mongodb://127.0.0.1:27017/fashion_store";

async function seedPointsWithOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");

    // Tạo các user customer với điểm tích lũy
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    const customers = [
      {
        name: "Nguyễn Văn A",
        email: "customer1@example.com", 
        password: hashedPassword,
        role: "customer",
        phone: "0901234567",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        loyaltyPoints: {
          balance: 2500,
          tier: "SILVER"
        }
      },
      {
        name: "Trần Thị B",
        email: "customer2@example.com",
        password: hashedPassword,
        role: "customer", 
        phone: "0907654321",
        address: "456 Đường DEF, Quận 3, TP.HCM",
        loyaltyPoints: {
          balance: 8500,
          tier: "GOLD"
        }
      },
      {
        name: "Lê Văn C",
        email: "customer3@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0909876543", 
        address: "789 Đường GHI, Quận 5, TP.HCM",
        loyaltyPoints: {
          balance: 500,
          tier: "BRONZE"
        }
      },
      {
        name: "Phạm Thị D",
        email: "customer4@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0905432167",
        address: "321 Đường JKL, Quận 7, TP.HCM", 
        loyaltyPoints: {
          balance: 12000,
          tier: "GOLD"
        }
      },
      {
        name: "Hoàng Văn E",
        email: "customer5@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0903456789",
        address: "654 Đường MNO, Quận 10, TP.HCM",
        loyaltyPoints: {
          balance: 1200,
          tier: "SILVER"
        }
      },
      {
        name: "Vũ Thị F",
        email: "customer6@example.com",
        password: hashedPassword,
        role: "customer",
        phone: "0908765432",
        address: "987 Đường PQR, Quận Bình Thạnh, TP.HCM",
        loyaltyPoints: {
          balance: 300,
          tier: "BRONZE"
        }
      }
    ];

    // Xóa dữ liệu cũ
    await User.deleteMany({ role: "customer" });
    await PointTransaction.deleteMany({});
    await Order.deleteMany({}); // Xóa orders cũ nếu có
    
    // Tạo customers
    const createdCustomers = await User.insertMany(customers);
    console.log(`✅ Đã tạo ${createdCustomers.length} khách hàng`);

    // Tạo một số đơn hàng mẫu
    const orders = [
      {
        user: createdCustomers[0]._id,
        orderNumber: "ORD001",
        total: 1500000,
        status: "completed",
        items: [],
        shippingAddress: {
          name: "Nguyễn Văn A",
          phone: "0901234567",
          address: "123 Đường ABC, Quận 1, TP.HCM"
        },
        createdAt: new Date("2024-01-15T10:30:00.000Z")
      },
      {
        user: createdCustomers[1]._id,
        orderNumber: "ORD002",
        total: 2500000,
        status: "completed",
        items: [],
        shippingAddress: {
          name: "Trần Thị B",
          phone: "0907654321", 
          address: "456 Đường DEF, Quận 3, TP.HCM"
        },
        createdAt: new Date("2024-01-20T14:15:00.000Z")
      },
      {
        user: createdCustomers[3]._id,
        orderNumber: "ORD003",
        total: 3200000,
        status: "completed",
        items: [],
        shippingAddress: {
          name: "Phạm Thị D",
          phone: "0905432167",
          address: "321 Đường JKL, Quận 7, TP.HCM"
        },
        createdAt: new Date("2024-02-10T09:20:00.000Z")
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`✅ Đã tạo ${createdOrders.length} đơn hàng`);

    // Tạo point transactions với references đến orders
    const transactions = [
      // Customer 1 (Nguyễn Văn A)
      {
        user: createdCustomers[0]._id,
        type: "EARNED",
        points: 150,
        description: "Tích điểm từ đơn hàng ORD001",
        order: createdOrders[0]._id,
        createdAt: new Date("2024-01-15T10:35:00.000Z")
      },
      {
        user: createdCustomers[0]._id,
        type: "REDEEMED", 
        points: 100,
        description: "Sử dụng 100 điểm cho đơn hàng ORD001",
        order: createdOrders[0]._id,
        createdAt: new Date("2024-01-15T10:30:00.000Z")
      },
      {
        user: createdCustomers[0]._id,
        type: "EARNED",
        points: 200,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-02-15T14:20:00.000Z")
      },
      {
        user: createdCustomers[0]._id,
        type: "ADJUSTMENT",
        points: 500,
        description: "Điều chỉnh điểm thưởng sinh nhật",
        createdAt: new Date("2024-03-10T09:00:00.000Z")
      },
      
      // Customer 2 (Trần Thị B)
      {
        user: createdCustomers[1]._id,
        type: "EARNED",
        points: 250,
        description: "Tích điểm từ đơn hàng ORD002",
        order: createdOrders[1]._id,
        createdAt: new Date("2024-01-20T14:20:00.000Z")
      },
      {
        user: createdCustomers[1]._id,
        type: "REDEEMED",
        points: 200,
        description: "Sử dụng 200 điểm cho đơn hàng ORD002",
        order: createdOrders[1]._id,
        createdAt: new Date("2024-01-20T14:15:00.000Z")
      },
      {
        user: createdCustomers[1]._id,
        type: "EARNED",
        points: 300,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-02-10T13:20:00.000Z")
      },
      {
        user: createdCustomers[1]._id,
        type: "REDEEMED",
        points: 150,
        description: "Đổi điểm lấy voucher giảm giá",
        createdAt: new Date("2024-03-05T10:15:00.000Z")
      },
      
      // Customer 3 (Lê Văn C)
      {
        user: createdCustomers[2]._id,
        type: "EARNED",
        points: 75,
        description: "Tích điểm từ đơn hàng",
        createdAt: new Date("2024-02-20T12:30:00.000Z")
      },
      {
        user: createdCustomers[2]._id,
        type: "REDEEMED",
        points: 50,
        description: "Sử dụng điểm đổi voucher",
        createdAt: new Date("2024-03-15T15:45:00.000Z")
      },
      
      // Customer 4 (Phạm Thị D)
      {
        user: createdCustomers[3]._id,
        type: "EARNED",
        points: 320,
        description: "Tích điểm từ đơn hàng ORD003",
        order: createdOrders[2]._id,
        createdAt: new Date("2024-02-10T09:25:00.000Z")
      },
      {
        user: createdCustomers[3]._id,
        type: "REDEEMED",
        points: 300,
        description: "Sử dụng 300 điểm cho đơn hàng ORD003",
        order: createdOrders[2]._id,
        createdAt: new Date("2024-02-10T09:20:00.000Z")
      },
      {
        user: createdCustomers[3]._id,
        type: "EARNED", 
        points: 800,
        description: "Tích điểm từ đơn hàng khác",
        createdAt: new Date("2024-02-25T11:30:00.000Z")
      },
      {
        user: createdCustomers[3]._id,
        type: "ADJUSTMENT",
        points: 1000,
        description: "Thưởng điểm khách hàng VIP",
        createdAt: new Date("2024-03-01T10:00:00.000Z")
      },
      
      // Customer 5 (Hoàng Văn E)
      {
        user: createdCustomers[4]._id,
        type: "EARNED",
        points: 180,
        description: "Tích điểm từ đơn hàng",
        createdAt: new Date("2024-02-25T14:30:00.000Z")
      },
      {
        user: createdCustomers[4]._id,
        type: "REDEEMED",
        points: 120,
        description: "Sử dụng điểm đổi voucher miễn phí ship",
        createdAt: new Date("2024-03-20T13:15:00.000Z")
      },
      
      // Customer 6 (Vũ Thị F)
      {
        user: createdCustomers[5]._id,
        type: "EARNED",
        points: 60,
        description: "Tích điểm từ đơn hàng",
        createdAt: new Date("2024-03-12T12:00:00.000Z")
      },
      {
        user: createdCustomers[5]._id,
        type: "REDEEMED",
        points: 30,
        description: "Sử dụng điểm tại cửa hàng",
        createdAt: new Date("2024-03-15T16:00:00.000Z")
      }
    ];

    const createdTransactions = await PointTransaction.insertMany(transactions);
    console.log(`✅ Đã tạo ${createdTransactions.length} giao dịch điểm`);

    // Thống kê
    const totalEarned = transactions.filter(t => ['EARNED', 'ADJUSTMENT'].includes(t.type)).reduce((sum, t) => sum + t.points, 0);
    const totalUsed = transactions.filter(t => ['REDEEMED', 'EXPIRED'].includes(t.type)).reduce((sum, t) => sum + t.points, 0);
    const ordersWithPoints = transactions.filter(t => t.order).length;

    console.log("\n📊 Thống kê:");
    console.log("- Khách hàng BRONZE: 2");
    console.log("- Khách hàng SILVER: 2"); 
    console.log("- Khách hàng GOLD: 2");
    console.log(`- Tổng điểm đã phát: ${totalEarned}`);
    console.log(`- Tổng điểm đã sử dụng: ${totalUsed}`);
    console.log(`- Đơn hàng: ${createdOrders.length}`);
    console.log(`- Giao dịch liên kết đơn hàng: ${ordersWithPoints}`);

    process.exit();
  } catch (err) {
    console.error("❌ Lỗi seed dữ liệu điểm tích lũy:", err);
    process.exit(1);
  }
}

seedPointsWithOrders();

