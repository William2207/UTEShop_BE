import { asyncHandler } from "../utils/asyncHandler.js";
import momoService from "../services/momoServices.js";
import Order from "../models/order.js";

class PaymentController {
    // Tạo payment request cho MoMo
    createPaymentRequest = asyncHandler(async (req, res) => {
        const { amount, orderInfo, orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid payment amount",
                code: "INVALID_AMOUNT",
            });
        }

        if (!orderInfo) {
            return res.status(400).json({
                message: "Order information is required",
                code: "MISSING_ORDER_INFO",
            });
        }

        // Tạo orderId nếu chưa có
        const finalOrderId = orderId || momoService.generateOrderId();

        const paymentData = {
            orderId: finalOrderId,
            amount: amount,
            orderInfo: orderInfo,
            extraData: JSON.stringify({
                userId: req.user._id.toString(),
                orderId: finalOrderId
            })
        };

        const result = await momoService.createPaymentRequest(paymentData);

        if (!result.success) {
            return res.status(400).json({
                message: "Failed to create payment request",
                error: result.error,
            });
        }

        // Cập nhật order với thông tin MoMo (nếu có orderId)
        if (orderId) {
            try {
                await Order.findByIdAndUpdate(orderId, {
                    'onlinePaymentInfo.transactionId': result.requestId,
                    'onlinePaymentInfo.gateway': 'MOMO',
                    paymentStatus: 'processing',
                });
            } catch (error) {
                console.error('Error updating order with MoMo info:', error);
            }
        }

        res.status(200).json({
            success: true,
            payUrl: result.payUrl,
            orderId: result.orderId,
            requestId: result.requestId,
            qrCodeUrl: result.qrCodeUrl,
        });
    });

    // Xác nhận thanh toán thành công (từ callback)
    confirmPayment = asyncHandler(async (req, res) => {
        const { orderId, requestId } = req.body;

        if (!orderId || !requestId) {
            return res.status(400).json({
                message: "Order ID and Request ID are required",
                code: "MISSING_PARAMETERS",
            });
        }

        const result = await momoService.queryTransaction(orderId, requestId);

        if (!result.success) {
            return res.status(400).json({
                message: "Failed to query payment status",
                error: result.error,
            });
        }

        const { data } = result;
        const isSuccess = data.resultCode === '0';

        // Cập nhật trạng thái order
        if (isSuccess && orderId) {
            try {
                await Order.findByIdAndUpdate(orderId, {
                    paymentStatus: 'paid',
                    'onlinePaymentInfo.transactionId': data.transId,
                    'onlinePaymentInfo.gateway': 'MOMO',
                    'onlinePaymentInfo.paidAt': new Date(),
                    'onlinePaymentInfo.amount': data.amount,
                });
            } catch (error) {
                console.error('Error updating order payment status:', error);
            }
        }

        res.status(200).json({
            success: true,
            isPaid: isSuccess,
            message: data.message,
            transactionId: data.transId,
        });
    });

    // Hủy thanh toán
    cancelPayment = asyncHandler(async (req, res) => {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                message: "Order ID is required",
                code: "MISSING_ORDER_ID",
            });
        }

        // Cập nhật trạng thái order
        try {
            await Order.findByIdAndUpdate(orderId, {
                paymentStatus: 'unpaid',
                status: 'cancelled',
            });

            res.status(200).json({
                success: true,
                message: "Payment cancelled successfully",
            });
        } catch (error) {
            console.error('Error cancelling payment:', error);
            res.status(400).json({
                message: "Failed to cancel payment",
                error: error.message,
            });
        }
    });

    // Webhook để xử lý callback từ MoMo
    handleMoMoWebhook = asyncHandler(async (req, res) => {
        try {
            const callbackData = req.body;

            // Xác minh callback
            const verification = momoService.verifyCallback(callbackData);

            if (!verification.isValid) {
                return res.status(400).json({
                    message: "Invalid callback signature",
                });
            }

            // Xử lý kết quả thanh toán
            if (verification.isSuccess) {
                await this.handleMoMoPaymentSuccess(verification);
            } else {
                await this.handleMoMoPaymentFailed(verification);
            }

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('MoMo Webhook Error:', error);
            res.status(400).json({
                message: "Webhook processing failed",
                error: error.message,
            });
        }
    });

    // Xử lý thanh toán MoMo thành công
    async handleMoMoPaymentSuccess(verification) {
        try {
            const { orderId, transId, amount } = verification;

            if (orderId) {
                await Order.findByIdAndUpdate(orderId, {
                    paymentStatus: 'paid',
                    'onlinePaymentInfo.transactionId': transId,
                    'onlinePaymentInfo.gateway': 'MOMO',
                    'onlinePaymentInfo.paidAt': new Date(),
                    'onlinePaymentInfo.amount': amount,
                });

                console.log(`MoMo payment succeeded for order ${orderId}, transaction ${transId}`);
            }
        } catch (error) {
            console.error('Error handling MoMo payment success:', error);
        }
    }

    // Xử lý thanh toán MoMo thất bại
    async handleMoMoPaymentFailed(verification) {
        try {
            const { orderId } = verification;

            if (orderId) {
                await Order.findByIdAndUpdate(orderId, {
                    paymentStatus: 'unpaid',
                    status: 'cancelled',
                });

                console.log(`MoMo payment failed for order ${orderId}`);
            }
        } catch (error) {
            console.error('Error handling MoMo payment failure:', error);
        }
    }
}

export default new PaymentController();
