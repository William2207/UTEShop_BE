import express from "express";
import PaymentController from "../controllers/PaymentController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// Tạo payment request cho MoMo (cần xác thực)
router.post("/create-payment-request", authMiddleware, PaymentController.createPaymentRequest);

// Xác nhận thanh toán (cần xác thực)
router.post("/confirm-payment", authMiddleware, PaymentController.confirmPayment);

// Hủy thanh toán (cần xác thực)
router.post("/cancel-payment", authMiddleware, PaymentController.cancelPayment);

// Webhook từ MoMo (không cần xác thực vì từ MoMo)
router.post("/momo-webhook", express.json(), PaymentController.handleMoMoWebhook);

export default router;
