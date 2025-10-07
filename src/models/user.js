import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    avatarUrl: { type: String, default: "" },
    name: {
      // dùng name làm cột chính
      type: String,
      required: [true, "Name is required"],
      minlength: 2,
      trim: true,
      alias: "username", // alias để code cũ dùng username vẫn chạy
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    phone: { type: String },
    address: { type: String },
    birthDate: {
      type: Date,
      required: false,
    },
    loyaltyPoints: {
      balance: {
        // Số điểm hiện có
        type: Number,
        default: 0,
        min: 0,
      },
      tier: {
        // (Nâng cao) Hạng thành viên (Vàng, Bạc, Đồng)
        type: String,
        enum: ["BRONZE", "SILVER", "GOLD"],
        default: "BRONZE",
      }
    },
    
    // Track voucher claims để kiểm soát limit chính xác
    voucherClaims: [{
      voucherCode: { type: String, required: true },
      claimCount: { type: Number, default: 1, min: 1 },
      lastClaimed: { type: Date, default: Date.now },
      source: { type: String, enum: ["REVIEW", "ADMIN_GIFT", "PROMOTION", "LOYALTY", "OTHER"], default: "OTHER" }
    }]
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
