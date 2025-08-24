import { Router } from "express";
import { login, me, refreshTokenController, logout } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

//router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
// refresh lại token
router.post("/refresh", refreshTokenController);
router.post("/logout", logout);
export default router;
