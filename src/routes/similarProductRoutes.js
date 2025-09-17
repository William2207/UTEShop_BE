import { Router } from "express";
import { getSimilarProducts } from "../controllers/SimilarProductController.js";

const router = Router();

// Lấy sản phẩm tương tự (không cần authentication)
router.get("/:productId", getSimilarProducts);

export default router;
