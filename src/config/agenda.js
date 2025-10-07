// config/agenda.js
import { Agenda } from 'agenda';
import Order from '../models/order.js';

// Hàm này sẽ được gọi từ server.js
export const initializeAgenda = (io, sendNotificationToUser) => {
    const mongoConnectionString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uteshop';
    
    const agenda = new Agenda({ 
        db: { 
            address: mongoConnectionString,
            options: {
                family: 4, // ép IPv4, tránh ::1
                serverSelectionTimeoutMS: 5000
            }
        } 
    });

    // Thêm event listeners cho Agenda
    agenda.on('ready', () => {
        console.log('✅ Agenda connected to MongoDB');
    });

    agenda.on('error', (error) => {
        console.error('❌ Agenda connection error:', error.message);
    });

    /**
     * Định nghĩa logic cho job 'process pending order'.
     * Bây giờ nó có thể truy cập vào `sendNotificationToUser`.
     */
    agenda.define('process pending order', async (job) => {
        const { orderId } = job.attrs.data;
        console.log(`Processing job for orderId: ${orderId}`);
        
        const order = await Order.findById(orderId);
        
        if (order && order.status === 'pending') {
            order.status = 'processing';
            await order.save();
            console.log(`✅ Order ${orderId} status updated to processing.`);
            const userId = order.user;
            sendNotificationToUser(io, userId, 'order_status_update', {
                orderId: order._id,
                newStatus: 'processing',
                message: `Đơn hàng #${order._id} của bạn đã bắt đầu được xử lý.`
            });
        }
    });

const mongoConnectionString = process.env.MONGO_URI 
// Hàm này sẽ được gọi từ server.js
export const initializeAgenda = (io, sendNotificationToUser) => {
    const agenda = new Agenda({ db: { address: mongoConnectionString } });

    /**
     * Định nghĩa logic cho job 'process pending order'.
     * Bây giờ nó có thể truy cập vào `sendNotificationToUser`.
     */
    agenda.define('process pending order', async (job) => {
        const { orderId } = job.attrs.data;
        console.log(`Processing job for orderId: ${orderId}`);
        
        const order = await Order.findById(orderId);
        
        if (order && order.status === 'pending') {
            order.status = 'processing';
            await order.save();
            console.log(`✅ Order ${orderId} status updated to processing.`);
            const userId = order.user;
            sendNotificationToUser(io, userId, 'order_status_update', {
                orderId: order._id,
                newStatus: 'processing',
                message: `Đơn hàng #${order._id} của bạn đã bắt đầu được xử lý.`
            });
        }
    });

    return agenda;
};