import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  const uri = process.env.MONGO_URI; 
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      family: 4, // ép IPv4, tránh ::1
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
