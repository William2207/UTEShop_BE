import { Router } from "express";
import { toggleFavorite, getFavorites, checkFavorite } from "../controllers/FavoriteController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Tất cả routes đều cần authentication
router.use(requireAuth);

// Thêm/xóa sản phẩm yêu thích
router.post("/:productId", toggleFavorite);

// Lấy danh sách sản phẩm yêu thích
router.get("/", getFavorites);

// Kiểm tra sản phẩm có trong danh sách yêu thích không
router.get("/:productId/check", checkFavorite);

export default router;
