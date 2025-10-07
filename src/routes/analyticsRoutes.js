import express from 'express';
import AnalyticsController from '../controllers/AnalyticsController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Middleware để kiểm tra admin role
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Access denied. Admin role required.',
            code: 'ADMIN_REQUIRED'
        });
    }
    next();
};

// Apply authentication và admin check cho tất cả routes
router.use(requireAuth, requireAdmin);

// Thống kê tổng hợp cho dashboard
router.get('/dashboard', AnalyticsController.getDashboardStats);

// Thống kê tổng quan
router.get('/general', AnalyticsController.getGeneralStats);

// Thống kê doanh thu
router.get('/revenue', AnalyticsController.getRevenue);

// Danh sách đơn hàng đã giao thành công
router.get('/completed-orders', AnalyticsController.getCompletedOrders);

// Thống kê khách hàng mới
router.get('/new-customers', AnalyticsController.getNewCustomers);

// Top sản phẩm bán chạy
router.get('/top-products', AnalyticsController.getTopProducts);

export default router;
