import OrderService from './OrderService';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// Hàm tạo Payment Intent được khai báo trước
const createPaymentIntent = async (req, res) => {
    const { orderId } = req.body;

    // Kiểm tra orderId có được cung cấp hay không
    if (!orderId) {
        return res.status(400).json({ error: 'OrderId is required' });
    }

    try {
        console.log(`Creating payment intent for order ${orderId}`);
        const { totalAmount } = await OrderService.getOrderAmountById(orderId);
        console.log(`Total amount for order ${orderId} is ${totalAmount}`);
        // Kiểm tra totalAmount có hợp lệ
        if (!totalAmount) {
            throw new Error('Total amount is invalid or not found');
        }
        console.log('process.env.STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,  // Đơn vị là cent
            currency: 'vnd',
            metadata: { orderId }, // Lưu orderId để sử dụng sau này
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error(`Error creating payment intent for order ${orderId}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

const notifyPayment = async (req, res) => {
    const orderId = req.query.orderId;
    const { status } = req.body;
    if (!orderId) {
        return res.status(400).json({ error: 'OrderId is required' });
    }
    try {
        console.log(`Updating order ${orderId} status to ${status}`);
        if (status !== 'success') {
            return res.status(400).json({ error: 'Payment failed' });
        }
        await OrderService.updateOrderStatus(orderId, 'paid');
        res.status(200).json({ message: `Order ${orderId} updated successfully` });
    } catch (error) {
        console.error(`Error updating order ${orderId} status: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

export default {
    createPaymentIntent,
    notifyPayment
}