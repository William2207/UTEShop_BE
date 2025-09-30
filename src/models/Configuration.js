import mongoose from "mongoose";

const configurationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    
    description: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

const Configuration = mongoose.model("Configuration", configurationSchema);

export default Configuration;

