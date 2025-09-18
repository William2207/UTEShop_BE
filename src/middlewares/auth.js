import { verifyToken } from "../services/jwtServices.js";
import User from "../models/user.js";

export const requireAuth = async (req, res, next) => {
  try {
    //console.log('🔍 AUTH DEBUG - Headers:', req.headers.authorization);

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.substring(7) : null;

    //console.log('🔍 AUTH DEBUG - Token extracted:', token ? 'Token exists' : 'No token');

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
        code: "NO_TOKEN"
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    //console.log('🔍 AUTH DEBUG - Decoded user:', decoded);

    // Lấy thông tin user từ database để đảm bảo dữ liệu mới nhất
    const user = await User.findById(decoded._id || decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized - User not found",
        code: "USER_NOT_FOUND"
      });
    }

    //console.log('✅ AUTH DEBUG - User found:', user._id);

    // Gán user vào req
    req.user = user;
    next();

  } catch (error) {
    console.log('❌ AUTH DEBUG - Token verification failed:', error.message);

    // Xử lý các loại lỗi JWT khác nhau
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Token expired - Please login again",
        code: "TOKEN_EXPIRED"
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: "Invalid token - Please login again",
        code: "INVALID_TOKEN"
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
      code: "AUTH_FAILED",
      error: error.message
    });
  }
};

// Optional auth - không bắt buộc phải có token
export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.substring(7) : null;

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded._id || decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Nếu có lỗi, vẫn tiếp tục mà không có user
    next();
  }
};

// Alias export for compatibility
export const authMiddleware = requireAuth;