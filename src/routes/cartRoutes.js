import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount,
} from "../controllers/CartController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(requireAuth);

// @route   GET /api/cart
// @desc    Lấy giỏ hàng của user
router.get("/", getCart);

// @route   GET /api/cart/count
// @desc    Lấy số lượng sản phẩm trong giỏ hàng
router.get("/count", getCartItemCount);

// @route   POST /api/cart/add
// @desc    Thêm sản phẩm vào giỏ hàng
router.post("/add", addToCart);

// @route   PUT /api/cart/update
// @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
router.put("/update", updateCartItem);

// @route   DELETE /api/cart/remove/:productId
// @desc    Xóa sản phẩm khỏi giỏ hàng
router.delete("/remove/:productId", removeFromCart);

// @route   DELETE /api/cart/clear
// @desc    Xóa toàn bộ giỏ hàng
router.delete("/clear", clearCart);

export default router;
