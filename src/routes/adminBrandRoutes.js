import express from 'express';
import { getBrands, createBrand, updateBrand, deleteBrand, deleteMultipleBrands } from '../controllers/AdminBrandController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Brand CRUD routes
router.get('/', getBrands);
router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);
router.delete('/multiple', deleteMultipleBrands);

export default router;
