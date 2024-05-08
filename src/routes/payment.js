import express from 'express';
import PaymentService from '../service/PaymentService';
const router = express.Router();

// Đăng ký route sau khi hàm đã được khai báo
router.post('/create-payment-intent', PaymentService.createPaymentIntent);
router.post('/notify-payment', PaymentService.notifyPayment)


export default router;
