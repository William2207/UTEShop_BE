import express from 'express';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteMultipleCategories
} from '../controllers/AdminCategoryController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(requireAuth);

// Routes cho quản lý categories
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.delete('/', deleteMultipleCategories); // Xóa nhiều

export default router;
