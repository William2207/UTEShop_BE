import crypto from 'crypto-js';
import axios from 'axios';

class MoMoService {
    constructor() {
        // MoMo API endpoints
        this.endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
        this.partnerCode = process.env.MOMO_PARTNER_CODE || '';
        this.accessKey = process.env.MOMO_ACCESS_KEY || '';
        this.secretKey = process.env.MOMO_SECRET_KEY || '';
        this.returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/success';
        this.notifyUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:5000/api/payment/momo-webhook';
    }

    // Tạo chữ ký số cho request
    generateSignature(rawSignature) {
        return crypto.HmacSHA256(rawSignature, this.secretKey).toString();
    }

    // Tạo request ID duy nhất
    generateRequestId() {
        return Date.now().toString();
    }

    // Tạo order ID duy nhất
    generateOrderId() {
        return `UTEShop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Tạo payment request
    async createPaymentRequest(orderInfo) {
        try {
            const {
                orderId,
                amount,
                orderInfo: description,
                extraData = '',
                requestId = this.generateRequestId()
            } = orderInfo;

            // Tạo raw signature
            const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${description}&partnerCode=${this.partnerCode}&redirectUrl=${this.returnUrl}&requestId=${requestId}&requestType=captureWallet`;

            // Tạo chữ ký
            const signature = this.generateSignature(rawSignature);

            // Tạo request body
            const requestBody = {
                partnerCode: this.partnerCode,
                partnerName: "UTEShop",
                storeId: "UTEShop",
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: description,
                redirectUrl: this.returnUrl,
                ipnUrl: this.notifyUrl,
                lang: "vi",
                extraData: extraData,
                requestType: "captureWallet",
                signature: signature
            };

            console.log('MoMo Payment Request:', requestBody);

            // Gửi request đến MoMo
            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.payUrl) {
                return {
                    success: true,
                    payUrl: response.data.payUrl,
                    orderId: orderId,
                    requestId: requestId,
                    qrCodeUrl: response.data.qrCodeUrl || null
                };
            } else {
                console.error('MoMo API Error Response:', response.data);
                return {
                    success: false,
                    error: response.data.message || response.data.errorMessage || 'Failed to create payment request'
                };
            }
        } catch (error) {
            console.error('MoMo Payment Error:', error);
            return {
                success: false,
                error: error.message || 'Payment request failed'
            };
        }
    }

    // Xác minh callback từ MoMo
    verifyCallback(callbackData) {
        try {
            const {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData,
                signature
            } = callbackData;

            // Tạo raw signature để verify
            const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

            // Tạo chữ ký từ dữ liệu callback
            const expectedSignature = this.generateSignature(rawSignature);

            // So sánh chữ ký
            const isValid = signature === expectedSignature;

            return {
                isValid,
                isSuccess: resultCode === '0',
                orderId,
                transId,
                amount,
                message,
                extraData
            };
        } catch (error) {
            console.error('MoMo Callback Verification Error:', error);
            return {
                isValid: false,
                isSuccess: false,
                error: error.message
            };
        }
    }

    // Lấy thông tin giao dịch
    async queryTransaction(orderId, requestId) {
        try {
            const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`;
            const signature = this.generateSignature(rawSignature);

            const requestBody = {
                partnerCode: this.partnerCode,
                orderId: orderId,
                requestId: requestId,
                lang: "vi",
                signature: signature
            };

            const response = await axios.post(
                'https://test-payment.momo.vn/v2/gateway/api/query',
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('MoMo Query Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Hoàn tiền
    async refundTransaction(orderId, transId, amount, description = '') {
        try {
            const requestId = this.generateRequestId();
            const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}&transId=${transId}`;
            const signature = this.generateSignature(rawSignature);

            const requestBody = {
                partnerCode: this.partnerCode,
                orderId: orderId,
                requestId: requestId,
                amount: amount,
                transId: transId,
                lang: "vi",
                description: description,
                signature: signature
            };

            const response = await axios.post(
                'https://test-payment.momo.vn/gw_payment/transactionProcessor',
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('MoMo Refund Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new MoMoService();
