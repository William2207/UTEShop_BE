import Notification from "../models/Notification.js";
// Lấy danh sách thông báo, sắp xếp theo thời gian mới nhất
export const getNotifications = async (req, res) => {
    const userId = req.user.id;
    const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20); // Giới hạn 20 thông báo gần nhất
    
    // (Tùy chọn) Lấy cả số lượng chưa đọc
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({ notifications, unreadCount });
};

// Đánh dấu tất cả thông báo là đã đọc
export const markNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
    res.status(200).json({ message: 'Notifications marked as read.' });
};