import express from 'express';
import OrderController from '../controllers/OrderController';

import authUserMiddleware from '../middleware/authUserMiddleware';

const router = express.Router();
const { authenticateToken, checkAdminOrSelf } = authUserMiddleware;

router.post('/create-order/:id', [authenticateToken, checkAdminOrSelf], OrderController.createOrder)
router.get('/get-all-order-of-user/:id', [authenticateToken, checkAdminOrSelf], OrderController.getAllOrdersOfUser)
router.get('/get-all-orders', OrderController.getAllOrders)
router.put('/cancel-order/:id/:orderId', [authenticateToken, checkAdminOrSelf], OrderController.cancelOrder)
router.put('/update-status/:orderId', OrderController.updateOrderStatus)
router.get('/get-total-revenue', OrderController.getTotalRevenue)

export default router