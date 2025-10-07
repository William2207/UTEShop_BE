import Order from "../models/order.js";
import Product from "../models/product.js";
import Cart from "../models/cart.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import momoService from "../services/momoServices.js";
import Notification from "../models/Notification.js";
class OrderController {
  // Create a new order
  createOrder = asyncHandler(async (req, res) => {
    console.log("🛒 ORDER CREATE - req.user:", req.user);
    console.log("🛒 ORDER CREATE - req.body:", req.body);
    const { agenda, io, sendNotificationToUser } = req.app.locals;

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
    
    // Schedule job with Agenda (if available)
    try {
      const agenda = req.app.locals.agenda;
      if (agenda) {
        await agenda.schedule("in 1 minute", "process pending order", {
          orderId: order._id,
        });
        console.log(`Job scheduled for order ${order._id} in 1 minute.`);
      }
    } catch (agendaError) {
      console.warn("⚠️ Agenda scheduling failed (non-critical):", agendaError.message);
    }
    
    console.log("✅ ORDER - Order saved successfully:", order._id);

    // Remove ordered items from user's cart
    const notificationMessage = `Đơn hàng #${order._id} của bạn đã được tạo thành công!`;
    
    // 1. Lưu thông báo vào database
    const newNotification = new Notification({
      user: userId,
      message: notificationMessage,
      link: `/orders/tracking/${order._id}`, // Link để người dùng xem chi tiết đơn hàng
    });
    await newNotification.save();

    sendNotificationToUser(io, userId, 'new_notification', newNotification);

    // Clear user's cart after order creation
    try {
      const cart = await Cart.findOne({ user: userId });
      if (cart && cart.items.length > 0) {
        // Lấy danh sách product IDs đã đặt hàng
        const orderedProductIds = orderItems.map(item => item.product.toString());

        // Lọc ra những sản phẩm chưa được đặt hàng
        const remainingItems = cart.items.filter(
          cartItem => !orderedProductIds.includes(cartItem.product.toString())
        );

        // Cập nhật giỏ hàng với những sản phẩm còn lại
        cart.items = remainingItems;
        await cart.save();

        console.log("🛒 ORDER - Removed ordered items from cart, remaining items:", remainingItems.length);
      }
    } catch (cartError) {
      console.log(
        "⚠️ ORDER - Cart update failed (not critical):",
        cartError.message
      );
    }

    // Populate order để trả về đầy đủ thông tin
    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name price image")
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
      .populate("items.product")
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

  // ==================== ADMIN METHODS ====================

  // Get all orders for admin
  getAllOrdersAdmin = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentStatus,
      paymentMethod,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .populate("items.product", "name price images")
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  });

  // Get order statistics for admin
  getOrderStatistics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      paidOrders,
      unpaidOrders
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, status: 'pending' }),
      Order.countDocuments({ ...dateFilter, status: 'processing' }),
      Order.countDocuments({ ...dateFilter, status: 'shipped' }),
      Order.countDocuments({ ...dateFilter, status: 'delivered' }),
      Order.countDocuments({ ...dateFilter, status: 'cancelled' }),
      Order.aggregate([
        { $match: { ...dateFilter, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.countDocuments({ ...dateFilter, paymentStatus: 'paid' }),
      Order.countDocuments({ ...dateFilter, paymentStatus: 'unpaid' })
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        totalRevenue: totalRevenue[0]?.total || 0,
        paymentStatus: {
          paid: paidOrders,
          unpaid: unpaidOrders
        }
      }
    });
  });

  // Get order by ID for admin
  getOrderByIdAdmin = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price images description");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  });

  // Update order status
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update status if provided
    if (status) {
      order.status = status;
    }

    // Update payment status if provided
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // Send notification to user
    try {
      const io = req.app.locals.io;
      const sendNotificationToUser = req.app.locals.sendNotificationToUser;
      
      if (io && sendNotificationToUser && status) {
        sendNotificationToUser(io, order.user, 'order_status_update', {
          orderId: order._id,
          newStatus: status,
          message: `Đơn hàng #${order._id} của bạn đã được cập nhật sang trạng thái: ${status}`
        });
      }
    } catch (notificationError) {
      console.warn("⚠️ Notification failed (non-critical):", notificationError.message);
    }

    const updatedOrder = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price images");

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder
    });
  });
}

export default new OrderController();
