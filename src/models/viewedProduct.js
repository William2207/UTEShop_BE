import mongoose from "mongoose";

const viewedProductSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Index để tối ưu truy vấn
viewedProductSchema.index({ user: 1, viewedAt: -1 });
viewedProductSchema.index({ user: 1, product: 1 }, { unique: true }); // Mỗi user chỉ xem 1 sản phẩm 1 lần

export default mongoose.model("ViewedProduct", viewedProductSchema);
