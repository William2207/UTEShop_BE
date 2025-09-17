import ViewedProduct from "../models/viewedProduct.js";
import Product from "../models/product.js";

// Thêm sản phẩm vào danh sách đã xem
export const addViewedProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        // Kiểm tra sản phẩm có tồn tại không
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        // Tìm hoặc tạo viewed product record
        const viewedProduct = await ViewedProduct.findOneAndUpdate(
            { user: userId, product: productId },
            { viewedAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ message: "Đã thêm vào danh sách đã xem" });
    } catch (error) {
        console.error('Error in addViewedProduct:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy danh sách sản phẩm đã xem
export const getViewedProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 12 } = req.query;

        const pageNum = parseInt(page);
        const pageSize = parseInt(limit);

        const [viewedProducts, total] = await Promise.all([
            ViewedProduct.find({ user: userId })
                .populate({
                    path: 'product',
                    populate: [
                        { path: 'category', select: 'name' },
                        { path: 'brand', select: 'name logo' }
                    ]
                })
                .sort({ viewedAt: -1 })
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            ViewedProduct.countDocuments({ user: userId })
        ]);

        // Lọc ra các sản phẩm còn tồn tại
        const validProducts = viewedProducts.filter(vp => vp.product !== null);

        res.json({
            page: pageNum,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items: validProducts
        });
    } catch (error) {
        console.error('Error in getViewedProducts:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Xóa sản phẩm khỏi danh sách đã xem
export const removeViewedProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        await ViewedProduct.findOneAndDelete({
            user: userId,
            product: productId
        });

        res.json({ message: "Đã xóa khỏi danh sách đã xem" });
    } catch (error) {
        console.error('Error in removeViewedProduct:', error);
        res.status(500).json({ message: "Server error" });
    }
};
