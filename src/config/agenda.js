// config/agenda.js
import { Agenda } from 'agenda';
import Order from '../models/order.js';

const mongoConnectionString = process.env.MONGO_URI;

const agenda = new Agenda({ 
  db: { 
    address: mongoConnectionString,
    options: {
      serverSelectionTimeoutMS: 30000, // Tăng timeout lên 30s
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      family: 4, // Force IPv4 để tránh lỗi ::1
    }
  } 
});

// Xử lý lỗi connection cho Agenda
agenda.on('ready', () => {
  console.log('✅ Agenda connected to MongoDB');
});

agenda.on('error', (error) => {
  console.error('❌ Agenda connection error:', error.message);
  // Không exit process, chỉ log lỗi
});

// Định nghĩa logic cho một job có tên là 'process pending order'
agenda.define('process pending order', async (job) => {
  const { orderId } = job.attrs.data;
  console.log(`Processing job for orderId: ${orderId}`);
  
  const order = await Order.findById(orderId);
  
  // Kiểm tra để đảm bảo đơn hàng vẫn còn pending (tránh trường hợp người dùng đã hủy)
  if (order && order.status === 'pending') {
    order.status = 'processing';
    await order.save();
    console.log(`Order ${orderId} status updated to processing.`);
  }
});

export default agenda;