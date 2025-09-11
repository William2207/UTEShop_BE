import { Router } from "express";
import { getCategories, getCategoryById } from "../controllers/CategoryController.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);

export default router;
