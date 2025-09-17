import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }, // Tham chiếu đến đơn hàng để xác minh đã mua
  },
  { timestamps: true }
);

// Index để tối ưu truy vấn
reviewSchema.index({ product: 1, createdAt: -1 });
// Option 2: One review per order (recommended)
reviewSchema.index({ order: 1 }, { unique: true }); // Mỗi đơn hàng chỉ được review 1 lần
reviewSchema.index({ user: 1, product: 1 }); // Index for performance

export default mongoose.model("Review", reviewSchema);
