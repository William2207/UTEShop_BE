import Product from "../models/product.js";

// Lấy 4 khối sản phẩm cho trang chủ
export const getHomeBlocks = async (req, res) => {
    try {
        const [newest, bestSelling, mostViewed, topDiscount, totalCounts] = await Promise.all([
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ soldCount: -1 })
                .limit(6)
                .lean(),
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ viewCount: -1 })
                .limit(8)
                .lean(),
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ discountPercentage: -1 })
                .limit(4)
                .lean(),
            // Đếm tổng số sản phẩm cho mỗi category
            Promise.all([
                Product.countDocuments().lean(), // total newest
                Product.countDocuments({ soldCount: { $gt: 0 } }).lean(), // total bestselling
                Product.countDocuments({ viewCount: { $gt: 0 } }).lean(), // total mostviewed
                Product.countDocuments({ discountPercentage: { $gt: 0 } }).lean() // total discount
            ])
        ]);

        const [totalNewest, totalBestSelling, totalMostViewed, totalDiscount] = totalCounts;

        res.json({
            newest,
            bestSelling,
            mostViewed,
            topDiscount,
            totals: {
                newest: totalNewest,
                bestSelling: totalBestSelling,
                mostViewed: totalMostViewed,
                topDiscount: totalDiscount
            }
        });
    } catch (err) {
        console.error('Error in getHomeBlocks:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy sản phẩm phân trang + sort
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort = "newest", category, search, brand } = req.query;

        const sortMap = {
            newest: { createdAt: -1 },
            "best-selling": { soldCount: -1 },
            "most-viewed": { viewCount: -1 },
            "top-discount": { discountPercentage: -1 },
            "price-asc": { price: 1 },
            "price-desc": { price: -1 },
        };

        const sortOption = sortMap[sort] || sortMap["newest"];

        // Build filter
        const filter = {};
        if (category) filter.category = category;
        if (brand) filter.brand = brand;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page);
        const pageSize = parseInt(limit);

        const [items, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort(sortOption)
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Product.countDocuments(filter),
        ]);

        res.json({
            page: pageNum,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items,
        });
    } catch (err) {
        console.error('Error in getProducts:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// Tăng view count
export const increaseView = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📈 Increasing view count for product: ${id} at ${new Date().toISOString()}`);

        // Sử dụng findOneAndUpdate với upsert: false để đảm bảo chỉ update 1 lần
        const product = await Product.findOneAndUpdate(
            { _id: id },
            { $inc: { viewCount: 1 } },
            { new: true, upsert: false }
        ).populate('category', 'name').populate('brand', 'name logo');

        if (!product) {
            console.log(`❌ Product not found: ${id}`);
            return res.status(404).json({ message: "Product not found" });
        }

        console.log(`✅ View count increased to: ${product.viewCount} for product: ${product.name}`);
        res.json(product);
    } catch (error) {
        console.error('Error in increaseView:', error);
        res.status(500).json({ message: error.message });
    }
};

// Tăng sold count
export const increaseSold = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body; // số lượng mua
        const product = await Product.findByIdAndUpdate(
            id,
            { $inc: { soldCount: quantity || 1 } }, // tăng theo số lượng
            { new: true }
        );
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
