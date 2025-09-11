import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    logo: { type: String }, // URL logo thương hiệu
    website: { type: String }, // Website chính thức
    country: { type: String }, // Quốc gia xuất xứ
}, { timestamps: true });

export default mongoose.model("Brand", brandSchema);

