import { Router } from "express";
import { getBrands, getBrandById } from "../controllers/BrandController.js";

const router = Router();

router.get("/", getBrands);
router.get("/:id", getBrandById);

export default router;

