import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    toggleDiscount,
    toggleVisibility
} from '../controllers/AdminProductController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(requireAuth);

// Routes cho quản lý products
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.delete('/', deleteMultipleProducts); // Xóa nhiều

// Toggle actions
router.patch('/:id/toggle-discount', toggleDiscount);
router.patch('/:id/toggle-visibility', toggleVisibility);

export default router;
