import Category from "../models/category.js";

// Lấy tất cả categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        res.json(categories);
    } catch (err) {
        console.error('Error in getCategories:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy category theo ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
    } catch (err) {
        console.error('Error in getCategoryById:', err);
        res.status(500).json({ message: "Server error" });
    }
};
