import Saved from "../models/saved.js";
import Product from "../models/product.js";

// Thêm/xóa sản phẩm yêu thích
export const toggleFavorite = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        // Tìm hoặc tạo saved document cho user
        let saved = await Saved.findOne({ user: userId });

        if (!saved) {
            saved = new Saved({ user: userId, products: [] });
        }

        // Kiểm tra sản phẩm đã có trong danh sách yêu thích chưa
        const productIndex = saved.products.indexOf(productId);

        if (productIndex > -1) {
            // Nếu đã có, xóa khỏi danh sách
            saved.products.splice(productIndex, 1);
            await saved.save();
            res.json({
                message: "Đã xóa khỏi danh sách yêu thích",
                isFavorite: false
            });
        } else {
            // Nếu chưa có, thêm vào danh sách
            saved.products.push(productId);
            await saved.save();
            res.json({
                message: "Đã thêm vào danh sách yêu thích",
                isFavorite: true
            });
        }
    } catch (error) {
        console.error('Error in toggleFavorite:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy danh sách sản phẩm yêu thích
export const getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 12 } = req.query;

        const saved = await Saved.findOne({ user: userId })
            .populate({
                path: 'products',
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'brand', select: 'name logo' }
                ]
            });

        if (!saved) {
            return res.json({
                page: 1,
                limit: parseInt(limit),
                total: 0,
                totalPages: 0,
                items: []
            });
        }

        const pageNum = parseInt(page);
        const pageSize = parseInt(limit);
        const startIndex = (pageNum - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const items = saved.products.slice(startIndex, endIndex);
        const total = saved.products.length;

        res.json({
            page: pageNum,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items
        });
    } catch (error) {
        console.error('Error in getFavorites:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Kiểm tra sản phẩm có trong danh sách yêu thích không
export const checkFavorite = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        const saved = await Saved.findOne({
            user: userId,
            products: productId
        });

        res.json({ isFavorite: !!saved });
    } catch (error) {
        console.error('Error in checkFavorite:', error);
        res.status(500).json({ message: "Server error" });
    }
};
