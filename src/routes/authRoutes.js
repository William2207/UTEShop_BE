import { Router } from "express";
import { z } from 'zod';

// Middlewares
import validate from '../middlewares/validateRequest.js';
import { requireAuth } from "../middlewares/auth.js";

// Controllers (import tất cả các hàm cần thiết từ file controller đã hợp nhất)
import {
  registerRequestOtp,
  registerVerify,
  resetRequestOtp,
  resetVerify,
  login,
  me,
  refreshTokenController,
  logout,
} from "../controllers/authController.js";

const router = Router();

// ------------------- Zod Validation Schemas -------------------

const emailSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const registerVerifySchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    name: z.string().min(2),
    password: z.string().min(6),
  }),
});

const resetVerifySchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string().min(6),
  }),
});

// ------------------- Route Definitions -------------------

// --- OTP & Registration Routes ---
router.post('/register/request-otp', validate(emailSchema), registerRequestOtp);
router.post('/register/verify', validate(registerVerifySchema), registerVerify);

// --- Password Reset Routes ---
router.post('/forgot/request-otp', validate(emailSchema), resetRequestOtp);
router.post('/forgot/verify', validate(resetVerifySchema), resetVerify);

// --- Standard Auth Routes ---
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/refresh", refreshTokenController);
router.post("/logout", logout);

export default router;