import mongoose from "mongoose";

const pointTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["EARNED", "REDEEMED", "EXPIRED", "ADJUSTMENT"],
      required: true,
    },

    points: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const PointTransaction = mongoose.model(
  "PointTransaction",
  pointTransactionSchema
);

export default PointTransaction;
