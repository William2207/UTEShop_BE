import jwt from "jsonwebtoken";

// Tạo Access Token
export const signToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "15m"; // access token ngắn hạn
  return jwt.sign(payload, secret, { expiresIn, ...options });
};

// Verify Access Token
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

// Tạo Refresh Token
export const signRefreshToken = (payload, options = {}) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d"; // refresh token dài hạn
  return jwt.sign(payload, secret, { expiresIn, ...options });
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  return jwt.verify(token, secret);
};
