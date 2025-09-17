import { Router } from "express";
import { getHomeBlocks, getProducts, increaseView, increaseSold, getProductStats } from "../controllers/ProductController.js";

const router = Router();

router.get("/home-blocks", getHomeBlocks); // 4 khối trang chủ
router.get("/", getProducts);              // phân trang, lọc, sort

// tăng view count khi user click sản phẩm
router.post("/:id/view", increaseView);

// tăng sold count khi mua hàng thành công
router.post("/:id/sold", increaseSold);

// lấy thống kê sản phẩm (số khách mua, số review)
router.get("/:id/stats", getProductStats);


router.get("/:id", async (req, res) => {
    try {
        const Product = (await import("../models/product.js")).default;
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('brand', 'name logo website country');
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

export default router;
