import Order from "../models/order.js";
import Product from "../models/product.js";
import Cart from "../models/cart.js";
import agenda from "../config/agenda.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import momoService from "../services/momoServices.js";

class OrderController {
  // Create a new order
  createOrder = asyncHandler(async (req, res) => {
    console.log("🛒 ORDER CREATE - req.user:", req.user);
    console.log("🛒 ORDER CREATE - req.body:", req.body);

    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
      codDetails,
      totalPrice: providedTotalPrice,
      momoOrderId, // Cho thanh toán MoMo
      momoRequestId, // requestId từ MoMo để đối soát giao dịch
    } = req.body;

    // Kiểm tra user authentication
    if (!req.user || !req.user._id) {
      console.log("❌ ORDER - No authenticated user");
      return res.status(401).json({
        message: "User authentication failed. Please login again.",
        code: "NO_AUTH_USER",
      });
    }

    const userId = req.user._id;
    console.log("✅ ORDER - User ID:", userId);

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order items are required",
        code: "NO_ITEMS",
      });
    }

    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({
        message: "Shipping address is required",
        code: "NO_ADDRESS",
      });
    }

    // Validate items and calculate total price
    let totalPrice = 0;
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product ${item.product} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        // Calculate discounted price
        const discountAmount = (product.price * product.discountPercentage) / 100;
        const discountedPrice = product.price - discountAmount;

        // Calculate item price with discount and update total
        const itemPrice = discountedPrice * item.quantity;
        totalPrice += itemPrice;

        // Reduce product stock
        product.stock -= item.quantity;
        product.soldCount += item.quantity;
        await product.save();

        return {
          product: item.product,
          quantity: item.quantity,
          originalPrice: product.price, // Giá gốc
          discountPercentage: product.discountPercentage, // % giảm giá
          discountedPrice: discountedPrice, // Giá đã giảm
          price: discountedPrice, // Giá cuối cùng (đã giảm) để tương thích với code cũ
        };
      })
    );

    console.log("💰 ORDER - Calculated total price:", totalPrice);
    console.log("💰 ORDER - Provided total price:", providedTotalPrice);

    // Xử lý thanh toán online nếu cần
    let onlinePaymentInfo = {};
    let initialPaymentStatus = "unpaid";

    if (paymentMethod === "MOMO" && momoOrderId) {
      // Kiểm tra trạng thái thanh toán MoMo
      const requestIdForQuery = momoRequestId || momoOrderId;
      const paymentResult = await momoService.queryTransaction(momoOrderId, requestIdForQuery);

      if (!paymentResult.success || String(paymentResult.data.resultCode) !== '0') {
        return res.status(400).json({
          message: "Payment verification failed",
          code: "PAYMENT_FAILED",
          error: paymentResult.data?.message || "Payment not completed",
        });
      }

      onlinePaymentInfo = {
        transactionId: paymentResult.data.transId,
        gateway: 'MOMO',
        paidAt: new Date(),
        amount: paymentResult.data.amount,
      };

      initialPaymentStatus = "paid";
    }

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalPrice,
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      codDetails: {
        phoneNumberConfirmed: false,
        additionalNotes: codDetails?.additionalNotes || "",
      },
      ...(Object.keys(onlinePaymentInfo).length > 0 && { onlinePaymentInfo }),
    });

    console.log("📝 ORDER - Creating order:", {
      user: userId,
      items: orderItems.length,
      totalPrice,
      shippingAddress,
    });

    // Save order
    await order.save();
    await agenda.schedule("in 1 minute", "process pending order", {
      orderId: order._id,
    });
    console.log(`Job scheduled for order ${order._id} in 1 minute.`);
    console.log("✅ ORDER - Order saved successfully:", order._id);

    // Clear user's cart after order creation
    try {
      await Cart.findOneAndUpdate({ user: userId }, { items: [] });
      console.log("🛒 ORDER - Cart cleared");
    } catch (cartError) {
      console.log(
        "⚠️ ORDER - Cart clear failed (not critical):",
        cartError.message
      );
    }

    // Populate order để trả về đầy đủ thông tin
    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name price images")
      .populate("user", "name email");

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
      success: true,
    });
  });

  // Get user's orders
  getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId })
      .populate("items.product", "name price images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      orders,
      count: orders.length,
    });
  });

  // Cancel an order
  cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow cancellation of pending orders
    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Cannot cancel order that is not in pending status",
      });
    }

    // Restore product stocks
    await Promise.all(
      order.items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          product.soldCount -= item.quantity;
          await product.save();
        }
      })
    );

    // Cancel the order
    order.status = "cancelled";
    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  });

  // ===== ADMIN METHODS =====

  // Get all orders (Admin only)
  getAllOrdersAdmin = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      paymentStatus, 
      search,
      dateFrom,
      dateTo 
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }
    
    if (search) {
      filter.$or = [
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() để tránh transform status

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  });

  // Get order statistics (Admin only)
  getOrderStatistics = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    // Count orders by status
    const totalOrders = await Order.countDocuments(dateFilter);
    const pendingOrders = await Order.countDocuments({ ...dateFilter, status: 'pending' });
    const processingOrders = await Order.countDocuments({ ...dateFilter, status: 'processing' });
    const deliveredOrders = await Order.countDocuments({ ...dateFilter, status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ ...dateFilter, status: 'cancelled' });
    

    // Calculate revenue
    const revenueData = await Order.aggregate([
      { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            pendingRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$totalPrice', 0]
              }
            },
            confirmedRevenue: {
              $sum: {
                $cond: [{ $in: ['$status', ['confirmed', 'shipped', 'delivered']] }, '$totalPrice', 0]
              }
            }
          }
        }
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      pendingRevenue: 0,
      confirmedRevenue: 0
    };

    res.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: revenue.totalRevenue,
      pendingRevenue: revenue.pendingRevenue,
      confirmedRevenue: revenue.confirmedRevenue,
      walletBalance: revenue.confirmedRevenue // Simplified
    });
  });

  // Get order by ID (Admin only)
  getOrderByIdAdmin = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images')
      .lean(); // Use lean() để tránh transform status

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  });

  // Update order status (Admin only)
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    // Validate order status
    const validStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid order status",
        validStatuses 
      });
    }

    // Validate payment status
    const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        message: "Invalid payment status",
        validPaymentStatuses 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status if provided
    if (status) {
      order.status = status;
      
      // Auto-update payment status if order is delivered and COD
      if (status === 'delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    }

    // Update payment status if provided
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // Populate for response
    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images')
      .lean(); // Use lean() để tránh transform status

    res.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  });
}

export default new OrderController();
