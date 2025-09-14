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
        originalPrice: { type: Number, required: true }, // Giá gốc tại thời điểm đặt hàng
        discountPercentage: { type: Number, default: 0 }, // % giảm giá tại thời điểm đặt hàng
        discountedPrice: { type: Number, required: true }, // Giá đã giảm tại thời điểm đặt hàng
        price: { type: Number, required: true }, // Giá cuối cùng (đã giảm) - để tương thích với code cũ
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
      enum: ["COD", "STRIPE", "MOMO", "ZALOPAY"],
      required: true,
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "processing"],
      default: "unpaid",
    },
    codDetails: {
      phoneNumberConfirmed: { type: Boolean, default: false },
      additionalNotes: { type: String },
    },
    stripePaymentInfo: {
      paymentIntentId: { type: String },
      clientSecret: { type: String },
      paymentMethodId: { type: String },
    },
    onlinePaymentInfo: {
      transactionId: { type: String },
      gateway: { type: String }, // "STRIPE", "MOMO", "ZALOPAY"
      paidAt: { type: Date },
      amount: { type: Number },
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
