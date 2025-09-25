import Category from "../models/category.js";
import Product from "../models/product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Lấy tất cả categories với phân trang và tìm kiếm
export const getCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);

    // Build filter
    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const [categories, total] = await Promise.all([
        Category.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        Category.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: categories,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / pageSize),
            totalItems: total,
            itemsPerPage: pageSize
        }
    });
});

// Lấy category theo ID
export const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Danh mục không tồn tại'
        });
    }

    res.status(200).json({
        success: true,
        data: category
    });
});

// Tạo category mới
export const createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Kiểm tra category đã tồn tại
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({
            success: false,
            message: 'Tên danh mục đã tồn tại'
        });
    }

    const category = await Category.create({
        name,
        description
    });

    res.status(201).json({
        success: true,
        data: category,
        message: 'Tạo danh mục thành công'
    });
});

// Cập nhật category
export const updateCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Kiểm tra category có tồn tại
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Danh mục không tồn tại'
        });
    }

    // Kiểm tra tên category trùng lặp (trừ chính nó)
    if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ name, _id: { $ne: req.params.id } });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục đã tồn tại'
            });
        }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { name, description },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: updatedCategory,
        message: 'Cập nhật danh mục thành công'
    });
});

// Xóa category
export const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Danh mục không tồn tại'
        });
    }

    // Kiểm tra có sản phẩm nào thuộc category này không
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
        return res.status(400).json({
            success: false,
            message: `Không thể xóa danh mục này vì có ${productsCount} sản phẩm đang sử dụng`
        });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Xóa danh mục thành công'
    });
});

// Xóa nhiều categories
export const deleteMultipleCategories = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn danh mục để xóa'
        });
    }

    // Kiểm tra có sản phẩm nào thuộc các categories này không
    const productsCount = await Product.countDocuments({ category: { $in: ids } });
    if (productsCount > 0) {
        return res.status(400).json({
            success: false,
            message: `Không thể xóa vì có ${productsCount} sản phẩm đang sử dụng các danh mục này`
        });
    }

    const result = await Category.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} danh mục thành công`
    });
});
