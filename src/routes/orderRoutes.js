import express from 'express';
import OrderController from '../controllers/OrderController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Create a new order (requires authentication)
router.post('/', requireAuth, OrderController.createOrder);

// Get user's orders (requires authentication)
router.get('/', requireAuth, OrderController.getUserOrders);

// Cancel an order (requires authentication)
router.delete('/:orderId', requireAuth, OrderController.cancelOrder);
router.put('/:orderId',requireAuth,OrderController.cancelOrder);


export default router;
