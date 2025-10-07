import express from 'express';
import {
  getCustomersWithPoints,
  getPointTransactions,
  createPointTransaction,
  getCustomerPointHistory,
  earnPointsFromOrder,
  redeemPoints,
  usePointsForOrder,
  getPointsStats,
  updatePointsConfig,
  getPointsConfig
} from '../controllers/PointsController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/config', getPointsConfig);

// Customer routes (require authentication)
router.use(protect);

router.get('/history', getCustomerPointHistory);
router.post('/earn', earnPointsFromOrder);
router.post('/redeem', redeemPoints);
router.post('/use-for-order', usePointsForOrder);

// Admin routes
router.use(admin); // All routes below require admin access

router.get('/customers', getCustomersWithPoints);
router.get('/transactions', getPointTransactions);
router.post('/transactions', createPointTransaction);
router.get('/stats', getPointsStats);
router.put('/config', updatePointsConfig);

export default router;
