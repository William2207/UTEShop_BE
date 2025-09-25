import Brand from '../models/brand.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get all brands with pagination
const getBrands = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const brands = await Brand.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalBrands = await Brand.countDocuments();
    const totalPages = Math.ceil(totalBrands / limit);

    res.status(200).json({
        success: true,
        data: brands,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalBrands,
            itemsPerPage: limit
        }
    });
});

// Create new brand
const createBrand = asyncHandler(async (req, res) => {
    const { name, description, logo } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Tên thương hiệu là bắt buộc'
        });
    }

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
        return res.status(400).json({
            success: false,
            message: 'Thương hiệu đã tồn tại'
        });
    }

    const brand = await Brand.create({
        name,
        description,
        logo
    });

    res.status(201).json({
        success: true,
        data: brand,
        message: 'Thêm thương hiệu thành công'
    });
});

// Update brand
const updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, logo } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Tên thương hiệu là bắt buộc'
        });
    }

    const brand = await Brand.findById(id);
    if (!brand) {
        return res.status(404).json({
            success: false,
            message: 'Thương hiệu không tồn tại'
        });
    }

    // Check if name is being changed and if new name already exists
    if (name !== brand.name) {
        const existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            return res.status(400).json({
                success: false,
                message: 'Tên thương hiệu đã tồn tại'
            });
        }
    }

    brand.name = name;
    brand.description = description;
    brand.logo = logo;

    await brand.save();

    res.status(200).json({
        success: true,
        data: brand,
        message: 'Cập nhật thương hiệu thành công'
    });
});

// Delete brand
const deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) {
        return res.status(404).json({
            success: false,
            message: 'Thương hiệu không tồn tại'
        });
    }

    await Brand.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Xóa thương hiệu thành công'
    });
});

// Delete multiple brands
const deleteMultipleBrands = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Danh sách ID không hợp lệ'
        });
    }

    const result = await Brand.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} thương hiệu`,
        deletedCount: result.deletedCount
    });
});

export {
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    deleteMultipleBrands
};
