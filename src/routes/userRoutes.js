import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import User from "../models/user.js";
import UserController from "../controllers/UserController.js";

const router = express.Router();

// Route lấy profile (protected, cần token)
router.get("/profile", requireAuth, UserController.getProfile);

export default router;