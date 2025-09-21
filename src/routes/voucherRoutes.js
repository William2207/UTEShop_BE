import express from 'express';
import {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  applyVoucher,
  getVoucherStats
} from '../controllers/VoucherController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/validate', protect, validateVoucher);
router.post('/apply', protect, applyVoucher);

// Admin routes
router.use(protect, admin); // All routes below require admin access

router.route('/')
  .get(getAllVouchers)
  .post(createVoucher);

router.get('/stats', getVoucherStats);

router.route('/:id')
  .get(getVoucherById)
  .put(updateVoucher)
  .delete(deleteVoucher);

export default router;
