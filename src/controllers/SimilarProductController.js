import Product from "../models/product.js";
import mongoose from "mongoose";

// Lấy sản phẩm tương tự
export const getSimilarProducts = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 8 } = req.query;

        console.log('🔍 Getting similar products for:', productId);

        // Convert productId to ObjectId if needed
        const productObjectId = new mongoose.Types.ObjectId(productId);

        // Lấy thông tin sản phẩm hiện tại
        const currentProduct = await Product.findById(productObjectId)
            .populate('category', 'name')
            .populate('brand', 'name');

        if (!currentProduct) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        const limitNum = parseInt(limit);

        // Tìm sản phẩm tương tự theo category và brand
        const similarProducts = await Product.find({
            _id: { $ne: productObjectId }, // Loại trừ sản phẩm hiện tại
            $or: [
                { category: currentProduct.category._id },
                { brand: currentProduct.brand._id }
            ]
        })
            .populate('category', 'name')
            .populate('brand', 'name logo')
            .sort({ soldCount: -1, viewCount: -1 }) // Ưu tiên sản phẩm bán chạy và xem nhiều
            .limit(limitNum)
            .lean();

        // Nếu không đủ sản phẩm theo category/brand, bổ sung từ category
        if (similarProducts.length < limitNum) {
            const remainingLimit = limitNum - similarProducts.length;
            const existingIds = similarProducts.map(p => p._id.toString());
            existingIds.push(productId);

            const additionalProducts = await Product.find({
                _id: { $nin: existingIds.map(id => new mongoose.Types.ObjectId(id)) },
                category: currentProduct.category._id
            })
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ soldCount: -1, viewCount: -1 })
                .limit(remainingLimit)
                .lean();

            similarProducts.push(...additionalProducts);
        }

        console.log('✅ Found', similarProducts.length, 'similar products');

        res.json({
            currentProduct: {
                _id: currentProduct._id,
                name: currentProduct.name,
                category: currentProduct.category,
                brand: currentProduct.brand
            },
            similarProducts
        });
    } catch (error) {
        console.error('Error in getSimilarProducts:', error);
        res.status(500).json({ message: "Server error" });
    }
};
