import Product from "../models/product.js";

// Lấy 4 khối sản phẩm cho trang chủ
export const getHomeBlocks = async (req, res) => {
    try {
        const [newest, bestSelling, mostViewed, topDiscount] = await Promise.all([
            Product.find().sort({ createdAt: -1 }).limit(8).lean(),
            Product.find().sort({ soldCount: -1 }).limit(6).lean(),
            Product.find().sort({ viewCount: -1 }).limit(8).lean(),
            Product.find().sort({ discountPercentage: -1 }).limit(4).lean(),
        ]);

        res.json({ newest, bestSelling, mostViewed, topDiscount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy sản phẩm phân trang + sort
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort = "newest" } = req.query;

        const sortMap = {
            newest: { createdAt: -1 },
            "best-selling": { soldCount: -1 },
            "most-viewed": { viewCount: -1 },
            "top-discount": { discountPercentage: -1 },
            "price-asc": { price: 1 },
            "price-desc": { price: -1 },
        };

        const sortOption = sortMap[sort] || sortMap["newest"];

        const pageNum = parseInt(page);
        const pageSize = parseInt(limit);

        const [items, total] = await Promise.all([
            Product.find()
                .sort(sortOption)
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Product.countDocuments(),
        ]);

        res.json({
            page: pageNum,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
