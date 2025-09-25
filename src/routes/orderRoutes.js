import express from 'express';
import OrderController from '../controllers/OrderController.js';
import { requireAuth, protect, admin } from '../middlewares/auth.js';

const router = express.Router();

// Admin routes (must come first to avoid conflicts)
router.get('/admin/all', protect, admin, OrderController.getAllOrdersAdmin);
router.get('/admin/statistics', protect, admin, OrderController.getOrderStatistics);
router.get('/admin/:orderId', protect, admin, OrderController.getOrderByIdAdmin);
router.put('/admin/:orderId/status', protect, admin, OrderController.updateOrderStatus);

// User routes
// Create a new order (requires authentication)
router.post('/', requireAuth, OrderController.createOrder);

// Get user's orders (requires authentication)
router.get('/', requireAuth, OrderController.getUserOrders);

// Cancel an order (requires authentication)
router.delete('/:orderId', requireAuth, OrderController.cancelOrder);
router.put('/:orderId', requireAuth, OrderController.cancelOrder);

export default router;
