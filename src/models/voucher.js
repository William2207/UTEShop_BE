import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Thường mã giảm giá sẽ không phân biệt hoa thường, đưa về in hoa cho nhất quán
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIP"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      // Chỉ áp dụng cho loại PERCENTAGE, giới hạn số tiền giảm tối đa
      type: Number,
      min: 0,
    },
    minOrderAmount: {
      // Số tiền đơn hàng tối thiểu để áp dụng voucher
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxUses: {
      // Tổng số lần voucher có thể được sử dụng
      type: Number,
      required: true,
      min: 1,
    },
    usesCount: {
      // Số lần voucher đã được sử dụng
      type: Number,
      default: 0,
    },
    maxUsesPerUser: {
      // Giới hạn số lần mỗi người dùng có thể sử dụng
      type: Number,
      default: 1,
    },
    // (Nâng cao) Dùng để lưu trữ những user nào đã sử dụng voucher này và bao nhiêu lần
    usersUsed: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 1 },
      },
    ],
    isActive: {
      // Để admin có thể bật/tắt voucher thủ công
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// (Nâng cao) Thêm một virtual property để kiểm tra voucher còn hợp lệ không
voucherSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.usesCount < this.maxUses &&
    now >= this.startDate &&
    now <= this.endDate
  );
});

const Voucher = mongoose.model("Voucher", voucherSchema);
export default Voucher;
