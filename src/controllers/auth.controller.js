import { User } from "../models/User.model.js";
import { signToken } from "../services/jwt.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email & password required" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already used" });
  const user = await User.create({ name, email, password });
  return res.status(201).json({ id: user._id, email: user.email, name: user.name });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email & password required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken({ id: user._id, email: user.email });
  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name }
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ user });
});
