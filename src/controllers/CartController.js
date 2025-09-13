import Cart from "../models/cart.js";
import Product from "../models/product.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Lấy giỏ hàng của user
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images category brand stock",
  });

  if (!cart) {
    return res.status(200).json({
      success: true,
      data: {
        items: [],
        totalItems: 0,
        totalAmount: 0,
      },
    });
  }

  // Tính tổng số lượng và tổng tiền
  const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
  const distinctItemCount = cart.items.length; // Số loại sản phẩm khác nhau

  res.status(200).json({
    success: true,
    data: {
      items: cart.items,
      totalItems,
      totalAmount,
      distinctItemCount, // Số loại sản phẩm khác nhau cho badge
    },
  });
});

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/cart/add
// @access  Private
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  // Kiểm tra sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Sản phẩm không tồn tại",
    });
  }

  // Kiểm tra số lượng trong kho
  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Chỉ còn ${product.stock} sản phẩm trong kho`,
    });
  }

  // Tìm giỏ hàng của user
  let cart = await Cart.findOne({ user: req.user._id });
  let isNewProduct = false;

  if (!cart) {
    // Tạo giỏ hàng mới nếu chưa có
    cart = new Cart({
      user: req.user._id,
      items: [{ product: productId, quantity }],
    });
    isNewProduct = true; // Giỏ hàng mới = sản phẩm mới
  } else {
    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Cập nhật số lượng nếu sản phẩm đã có
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Chỉ còn ${product.stock} sản phẩm trong kho`,
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
      isNewProduct = false; // Sản phẩm đã có, chỉ tăng số lượng
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      cart.items.push({ product: productId, quantity });
      isNewProduct = true; // Sản phẩm mới được thêm vào
    }
  }

  await cart.save();

  // Populate và trả về giỏ hàng đã cập nhật
  const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images category brand stock",
  });

  const totalItems = updatedCart.items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = updatedCart.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
  const distinctItemCount = updatedCart.items.length; // Số loại sản phẩm khác nhau

  console.log('🛒 Backend AddToCart Debug:', {
    isNewProduct,
    totalItems,
    distinctItemCount,
    cartItems: updatedCart.items.map(item => ({
      productId: item.product._id,
      quantity: item.quantity
    }))
  });

  res.status(200).json({
    success: true,
    message: "Đã thêm sản phẩm vào giỏ hàng",
    data: {
      items: updatedCart.items,
      totalItems,
      totalAmount,
      distinctItemCount, // Số loại sản phẩm khác nhau cho badge
      isNewProduct, // Thêm flag để frontend biết có phải sản phẩm mới không
    },
  });
});

// @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // Kiểm tra sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Sản phẩm không tồn tại",
    });
  }

  // Kiểm tra số lượng trong kho
  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Chỉ còn ${product.stock} sản phẩm trong kho`,
    });
  }

  // Tìm giỏ hàng của user
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: "Giỏ hàng không tồn tại",
    });
  }

  // Tìm index của sản phẩm trong giỏ hàng
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Sản phẩm không có trong giỏ hàng",
    });
  }

  // Lưu lại số lượng cũ
  const oldQuantity = cart.items[itemIndex].quantity;
  
  // Cập nhật số lượng
  cart.items[itemIndex].quantity = quantity;

  await cart.save();

  // Populate và trả về giỏ hàng đã cập nhật
  const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images category brand stock",
  });

  const totalItems = updatedCart.items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = updatedCart.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
  const distinctItemCount = updatedCart.items.length; // Số loại sản phẩm khác nhau

  console.log('🛒 UpdateCartItem Debug:', {
    productId,
    oldQuantity,
    newQuantity: quantity,
    totalItems,
    distinctItemCount,
    isQuantityUpdate: true, // Đánh dấu rõ là cập nhật số lượng
    isNewProduct: false // Không phải sản phẩm mới
  });

  res.status(200).json({
    success: true,
    message: "Đã cập nhật số lượng sản phẩm",
    data: {
      items: updatedCart.items,
      totalItems,
      totalAmount,
      distinctItemCount, // Số loại sản phẩm khác nhau cho badge
      isQuantityUpdate: true, // Thêm flag để frontend biết là cập nhật số lượng
      isNewProduct: false, // Không phải sản phẩm mới
    },
  });
});

// @desc    Xóa sản phẩm khỏi giỏ hàng
// @route   DELETE /api/cart/remove/:productId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: "Giỏ hàng không tồn tại",
    });
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();

  // Populate và trả về giỏ hàng đã cập nhật
  const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name price images category brand stock",
  });

  const totalItems = updatedCart.items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = updatedCart.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
  const distinctItemCount = updatedCart.items.length; // Số loại sản phẩm khác nhau

  res.status(200).json({
    success: true,
    message: "Đã xóa sản phẩm khỏi giỏ hàng",
    data: {
      items: updatedCart.items,
      totalItems,
      totalAmount,
      distinctItemCount, // Số loại sản phẩm khác nhau cho badge
    },
  });
});

// @desc    Xóa toàn bộ giỏ hàng
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(200).json({
    success: true,
    message: "Đã xóa toàn bộ giỏ hàng",
    data: {
      items: [],
      totalItems: 0,
      totalAmount: 0,
      distinctItemCount: 0, // Số loại sản phẩm khác nhau cho badge
    },
  });
});

// @desc    Lấy số lượng sản phẩm trong giỏ hàng
// @route   GET /api/cart/count
// @access  Private
export const getCartItemCount = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  const totalItems = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
  const distinctItemCount = cart ? cart.items.length : 0; // Số loại sản phẩm khác nhau

  res.status(200).json({
    success: true,
    data: {
      totalItems,
      distinctItemCount, // Số loại sản phẩm khác nhau cho badge
    },
  });
});
