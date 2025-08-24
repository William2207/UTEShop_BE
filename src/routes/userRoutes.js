const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { default: User } = require("../models/user");
const UserController = require("../controllers/UserController");
// Route lấy profile (protected, cần token)
router.get("/profile",authMiddleware, UserController.getProfile);

module.exports = router;
