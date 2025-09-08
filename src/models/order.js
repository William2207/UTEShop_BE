import mongoose from "mongoose";

const statusToNumberMap = {
  pending: 1,
  processing: 2,
  prepared: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 6,
};

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // copy giá tại thời điểm đặt hàng
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "prepared",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    shippingAddress: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ["COD", "ELECTRONIC_WALLET"],
      required: true,
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    codDetails: {
      phoneNumberConfirmed: { type: Boolean, default: false },
      additionalNotes: { type: String },
    },
  },
  { timestamps: true }
);

orderSchema.set("toJSON", {
  transform: function (doc, ret) {
    // 'ret' là object sắp được gửi đi.
    // Dòng này sẽ tìm giá trị chữ của status (ví dụ: "pending")
    // và thay thế nó bằng giá trị số tương ứng (ví dụ: 1)
    ret.status = statusToNumberMap[ret.status];
    return ret;
  },
});

export default mongoose.model("Order", orderSchema);
