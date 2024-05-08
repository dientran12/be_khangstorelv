const OrderService = require("../service/OrderService");

const createOrder = async (req, res) => {
    try {
        const orderData = {
            userId: req.user.id,
            items: req.body.items,
            shippingAddress: req.body.shippingAddress,
            totalAmount: req.body.totalAmount,
            paymentMethod: req.body.paymentMethod,
            phoneNumber: req.body.phoneNumber,
            note: req.body.orderNote,
        };
        if (!orderData.items || orderData.items.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Order must include at least one item.'
            });
        }

        const response = await OrderService.createOrder(orderData);
        return res.status(200).json(response);
        // return res.status(200).json(response);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred on the server'
        });
    }
};

const getAllOrdersOfUser = async (req, res) => {
    const userId = req.user.id;  // Lấy ID người dùng từ thông tin người dùng đã xác thực
    try {
        const orders = await OrderService.getAllOrdersOfUser(userId);
        if (orders.length > 0) {
            return res.status(200).json({
                status: 'OK',
                message: 'Orders retrieved successfully',
                data: orders
            });
        } else {
            return res.status(404).json({
                status: 'error',
                message: 'No orders found'
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred on the server'
        });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10; // Mặc định limit là 10 nếu không được cung cấp
        const page = parseInt(req.query.page) || 1; // Mặc định page là 1 nếu không được cung cấp

        const orders = await OrderService.getAllOrders(limit, page);
        return res.status(200).json({
            status: 'OK',
            message: 'Orders retrieved successfully',
            data: orders
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred on the server'
        });
    }
}

const cancelOrder = async (req, res) => {
    const orderId = req.params.orderId;
    try {
        const response = await OrderService.cancelOrder(orderId);
        if (response.status === 'error') {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred on the server'
        });
    }
}

const updateOrderStatus = async (req, res) => {
    const orderId = req.params.orderId;
    const status = req.body.status;
    try {
        const response = await OrderService.updateOrderStatus(orderId, status);
        if (response.status === 'error') {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred on the server'
        });
    }
}

const getTotalRevenue = async (req, res) => {
    try {
        const total = await OrderService.getTotalRevenue();
        return res.status(200).json(total);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'An error occurred on the server'
        });
    }
}

module.exports = {
    createOrder, getAllOrders, getAllOrdersOfUser, cancelOrder, updateOrderStatus, getTotalRevenue
};