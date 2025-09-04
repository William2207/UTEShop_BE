import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, // copy giá tại thời điểm đặt hàng
    }
  ],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  shippingAddress: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ["COD", "ELECTRONIC_WALLET"],
    required: true,
    default: "COD"
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid"
  },
  codDetails: {
    phoneNumberConfirmed: { type: Boolean, default: false },
    additionalNotes: { type: String }
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
