import Brand from "../models/brand.js";

// Lấy tất cả brands
export const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 }).lean();
        res.json(brands);
    } catch (err) {
        console.error('Error in getBrands:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy brand theo ID
export const getBrandById = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }
        res.json(brand);
    } catch (err) {
        console.error('Error in getBrandById:', err);
        res.status(500).json({ message: "Server error" });
    }
};

