import { Router } from "express";
import { addViewedProduct, getViewedProducts, removeViewedProduct } from "../controllers/ViewedProductController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Tất cả routes đều cần authentication
router.use(requireAuth);

// Thêm sản phẩm vào danh sách đã xem
router.post("/:productId", addViewedProduct);

// Lấy danh sách sản phẩm đã xem
router.get("/", getViewedProducts);

// Xóa sản phẩm khỏi danh sách đã xem
router.delete("/:productId", removeViewedProduct);

export default router;
