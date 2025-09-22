import mongoose from "mongoose";

const userVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
    },
    voucherCode: {
      type: String,
      required: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    orderId: {
      // ID đơn hàng đã sử dụng voucher này
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    source: {
      // Nguồn nhận voucher: 'REVIEW', 'ADMIN_GIFT', 'PROMOTION', etc.
      type: String,
      enum: ["REVIEW", "ADMIN_GIFT", "PROMOTION", "LOYALTY", "OTHER"],
      default: "OTHER",
    },
  },
  { timestamps: true }
);

// Compound index để đảm bảo user không claim cùng voucher nhiều lần
userVoucherSchema.index({ user: 1, voucher: 1 }, { unique: true });

// Index để query nhanh
userVoucherSchema.index({ user: 1, isUsed: 1 });
userVoucherSchema.index({ voucher: 1, isUsed: 1 });

const UserVoucher = mongoose.model("UserVoucher", userVoucherSchema);
export default UserVoucher;
