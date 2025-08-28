import { Router } from "express";
import { getHomeBlocks, getProducts } from "../controllers/ProductController.js";

const router = Router();

router.get("/home-blocks", getHomeBlocks); // 4 khối trang chủ
router.get("/", getProducts);              // phân trang, lọc, sort

export default router;
