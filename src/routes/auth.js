const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
const { default: User } = require("../models/user");

router.post("/login", authController.login);

// Route lấy profile (protected, cần token)
router.get("/profile", authMiddleware, UserController.getProfile);

module.exports = router;
