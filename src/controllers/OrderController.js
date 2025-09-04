import Order from '../models/order.js';
import Product from '../models/product.js';
import Cart from '../models/cart.js';
import { asyncHandler } from '../utils/asyncHandler.js';

class OrderController {
    // Create a new order
    createOrder = asyncHandler(async (req, res) => {
        console.log('🛒 ORDER CREATE - req.user:', req.user);
        console.log('🛒 ORDER CREATE - req.body:', req.body);

        const {
            items,
            shippingAddress,
            paymentMethod = 'COD',
            codDetails,
            totalPrice: providedTotalPrice
        } = req.body;

        // Kiểm tra user authentication
        if (!req.user || !req.user._id) {
            console.log('❌ ORDER - No authenticated user');
            return res.status(401).json({
                message: 'User authentication failed. Please login again.',
                code: 'NO_AUTH_USER'
            });
        }

        const userId = req.user._id;
        console.log('✅ ORDER - User ID:', userId);

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Order items are required',
                code: 'NO_ITEMS'
            });
        }

        if (!shippingAddress || !shippingAddress.trim()) {
            return res.status(400).json({
                message: 'Shipping address is required',
                code: 'NO_ADDRESS'
            });
        }

        // Validate items and calculate total price
        let totalPrice = 0;
        const orderItems = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product ${item.product} not found`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}`);
            }

            // Calculate price and update total
            const itemPrice = product.price * item.quantity;
            totalPrice += itemPrice;

            // Reduce product stock
            product.stock -= item.quantity;
            product.soldCount += item.quantity;
            await product.save();

            return {
                product: item.product,
                quantity: item.quantity,
                price: product.price
            };
        }));

        console.log('💰 ORDER - Calculated total price:', totalPrice);
        console.log('💰 ORDER - Provided total price:', providedTotalPrice);

        // Create order
        const order = new Order({
            user: userId,
            items: orderItems,
            totalPrice,
            shippingAddress: shippingAddress.trim(),
            paymentMethod,
            codDetails: {
                phoneNumberConfirmed: false,
                additionalNotes: codDetails?.additionalNotes || ''
            }
        });

        console.log('📝 ORDER - Creating order:', {
            user: userId,
            items: orderItems.length,
            totalPrice,
            shippingAddress
        });

        // Save order
        await order.save();
        console.log('✅ ORDER - Order saved successfully:', order._id);

        // Clear user's cart after order creation
        try {
            await Cart.findOneAndUpdate(
                { user: userId },
                { items: [] }
            );
            console.log('🛒 ORDER - Cart cleared');
        } catch (cartError) {
            console.log('⚠️ ORDER - Cart clear failed (not critical):', cartError.message);
        }

        // Populate order để trả về đầy đủ thông tin
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name price image')
            .populate('user', 'name email');

        res.status(201).json({
            message: 'Order created successfully',
            order: populatedOrder,
            success: true
        });
    });

    // Get user's orders
    getUserOrders = asyncHandler(async (req, res) => {
        const userId = req.user._id;
        const orders = await Order.find({ user: userId })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.status(200).json({
            orders,
            count: orders.length
        });
    });

    // Cancel an order
    cancelOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Only allow cancellation of pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({
                message: 'Cannot cancel order that is not in pending status'
            });
        }

        // Restore product stocks
        await Promise.all(order.items.map(async (item) => {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                product.soldCount -= item.quantity;
                await product.save();
            }
        }));

        // Cancel the order
        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            message: 'Order cancelled successfully',
            order
        });
    });
}

export default new OrderController();
