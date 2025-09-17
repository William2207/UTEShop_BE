import { Router } from "express";
import {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    getUserReview,
    checkOrderReviewed
} from "../controllers/ReviewController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Tạo review mới (cần authentication)
router.post("/:productId", requireAuth, createReview);

// Lấy danh sách review của sản phẩm (không cần authentication)
router.get("/:productId", getProductReviews);

// Lấy review của user cho sản phẩm (cần authentication)
router.get("/:productId/user", requireAuth, getUserReview);

// Cập nhật review (cần authentication)
router.put("/:reviewId", requireAuth, updateReview);

// Xóa review (cần authentication)
router.delete("/:reviewId", requireAuth, deleteReview);

// Check if order has been reviewed (cần authentication)
router.get("/order/:orderId/check", requireAuth, checkOrderReviewed);

export default router;
