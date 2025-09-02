// middleware/cloudinaryUpload.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Cấu hình Cloudinary với credentials từ file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình storage cho multer để upload lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatars", // Tên thư mục trên Cloudinary để lưu ảnh
    format: async (req, file) => "jpg", // Tự động chuyển đổi ảnh sang jpg (hoặc png, webp,...)
    public_id: (req, file) => {
      // Tạo một tên file duy nhất, ví dụ: user-id-timestamp
      return `avatar-${req.user.id}-${Date.now()}`;
    },
    // (Tùy chọn) Tự động resize ảnh khi upload
    transformation: [{ width: 250, height: 250, crop: "limit" }],
  },
});

// Tạo middleware multer với storage đã cấu hình
const upload = multer({ storage: storage });

export default upload;