const db = require('../models/index'); // Đường dẫn tới models của bạn
const { copyImage } = require('./ImageService');

const OrderService = {
    // Tạo một đơn hàng mới
    createOrder: async (orderData) => {
        const transaction = await db.sequelize.transaction();

        try {
            // Tạo đơn hàng
            const order = await db.Order.create({
                userId: orderData.userId,
                shippingAddress: orderData.shippingAddress,
                totalAmount: orderData.totalAmount,
                paymentMethod: orderData.paymentMethod,
                status: 'pending',  // Hoặc sử dụng orderData.status nếu bạn muốn có tính linh hoạt hơn
                phoneNumber: orderData.phoneNumber,
                note: orderData.note
            }, { transaction })

            // Thêm các mục vào đơn hàng (OrderItems)
            for (const item of orderData.items) {
                const images = await db.Image.findAll({
                    where: { objectId: item.productVersionId, objectType: 'ProductVersion' },
                    limit: 1,  // Chỉ lấy ảnh đầu tiên
                    transaction
                });

                let imageUrl = null;
                if (images.length > 0) {
                    imageUrl = await copyImage(images[0].dataValues.imageUrl, 'OrderItem', item.productVersionId, transaction);
                }

                await db.OrderItem.create({
                    orderId: order.id,
                    style: item.style,
                    productVersionSizeId: item.productVersionSizeId,
                    quantity: item.quantity,
                    price: item.price,
                    productName: item.productName,
                    imageUrl: imageUrl
                }, { transaction });
            }

            await transaction.commit();
            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    getAllOrdersOfUser: async (userId) => {
        try {
            const orders = await db.Order.findAll({
                where: { userId: userId },
                include: [
                    {
                        model: db.OrderItem,
                        as: 'items',
                        include: [
                            {
                                model: db.ProductVersionSize,
                                as: 'productVersionSize', // Giả định đây là alias đã được thiết lập trong model associations của bạn
                                attributes: ['size'] // Lấy chỉ trường size
                            }
                        ]
                    }
                ],
                order: [
                    ['createdAt', 'DESC'], // Sắp xếp đơn hàng theo ngày tạo giảm dần
                    [{ model: db.OrderItem, as: 'items' }, 'id', 'ASC'] // Sắp xếp các mục trong mỗi đơn hàng
                ]
            });

            // Biến đổi đơn hàng để bổ sung thông tin size vào các items
            const transformedOrders = orders.map(order => ({
                ...order.get({ plain: true }), // Chuyển order thành plain object
                items: order.items.map(item => ({
                    ...item.get({ plain: true }), // Chuyển item thành plain object
                    size: item.productVersionSize ? item.productVersionSize.size : null // Thêm thông tin size từ mối quan hệ với ProductVersionSize
                }))
            }));

            return transformedOrders;
        } catch (error) {
            throw error;
        }
    },


    updateOrderStatus: async (orderId, status) => {
        const order = await db.Order.findByPk(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        order.status = status;
        await order.save();
        return order;
    },

    getOrderAmountById: async (orderId) => {
        const order = await db.Order.findByPk(orderId, {
            include: [{
                model: db.OrderItem,
                as: 'items',
                attributes: ['price', 'quantity']
            }]
        });
        if (!order) {
            console.log('Order not found');
            return;
        }

        return { totalAmount: order.totalAmount };
    },

    getAllOrders: async (limit, page) => {
        try {
            const offset = (page - 1) * limit;

            const totalCount = await db.Order.count(); // Số lượng tổng đơn hàng

            const orders = await db.Order.findAll({
                include: [
                    {
                        model: db.OrderItem,
                        as: 'items',
                        include: [
                            {
                                model: db.ProductVersionSize,
                                as: 'productVersionSize', // Giả định đây là alias đã được thiết lập trong model associations
                                attributes: ['size'] // Chỉ lấy trường size
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['name'],
                        include: [{
                            model: db.Image,
                            as: 'Image',
                            attributes: ['imageUrl']
                        }]
                    }
                ],
                order: [
                    ['createdAt', 'DESC'],
                    [{ model: db.OrderItem, as: 'items' }, 'id', 'ASC']
                ],
                limit,
                offset
            });

            const totalPages = Math.ceil(totalCount / limit); // Tính tổng số trang
            const currentPage = page; // Trang hiện tại

            // Biến đổi dữ liệu để thêm các trường mới vào mỗi đơn hàng
            const transformedOrders = orders.map(order => ({
                id: order.id,
                userName: order.user ? order.user.name : '', // Lấy tên người dùng từ mối quan hệ
                userImage: order.user && order.user.Image ? order.user.Image.imageUrl : '', // Lấy đường dẫn ảnh từ mối quan hệ
                userId: order.userId,
                status: order.status,
                createdAt: order.createdAt,
                phoneNumber: order.phoneNumber,
                paymentMethod: order.paymentMethod,
                note: order.note,
                shippingAddress: order.shippingAddress,
                totalAmount: order.totalAmount,
                items: order.items.map(item => ({
                    id: item.id,
                    orderId: item.orderId,
                    productVersionSizeId: item.productVersionSizeId,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.imageUrl,
                    style: item.style,
                    productName: item.productName,
                    size: item.productVersionSize ? item.productVersionSize.size : null
                }))
            }));

            return {
                currentPage,
                totalOrders: totalCount,
                totalPage: totalPages,
                orders: transformedOrders
            };
        } catch (error) {
            throw error;
        }
    },

    cancelOrder: async (orderId) => {
        try {
            const order = await db.Order.findByPk(orderId);
            if (!order) {
                return { status: "error", message: 'Order not found' }

            }
            if (order.status !== 'pending') {
                return { status: "error", message: 'Order cannot be canceled' }
            }
            order.status = 'cancelled';
            await order.save();
            return order;
        }
        catch (error) {
            return { status: "error", message: error.message }
        }
    },

    updateOrderStatus: async (orderId, status) => {
        try {
            const order = await db.Order.findByPk(orderId, {
                include: [{
                    model: db.OrderItem,
                    as: 'items'  // Đảm bảo rằng 'as' ứng với tên đã được khai báo trong model quan hệ.
                }]
            });
            if (!order) {
                throw new Error('Order not found');
            }
            console.log('Order status', order.status); // Ghi log trạng thái hiện tại của đơn hàng

            // Kiểm tra trạng thái hiện tại, nếu đơn đã được hoàn thành hoặc đã hủy thì không cho phép cập nhật
            if (order.status === 'fulfilled' || order.status === 'cancelled') {
                return { status: "error", message: 'Order cannot be updated' };
            }

            // Kiểm tra trạng thái mới có giống với trạng thái hiện tại không
            if (status === order.status) {
                return {
                    status: "error", message: 'Order status is the same'
                };
            }

            // Cập nhật trạng thái mới cho đơn hàng
            if (status === 'paid' && order.paymentMethod === 'Direct') {
                order.paymentMethod = 'Card'; // Thay đổi phương thức thanh toán từ 'Direct' sang 'Cart'
            }

            console.log('order', order)

            if (status === 'fulfilled') {
                for (const item of order.items) {
                    // Tìm ProductVersionSize bằng ID từ OrderItem
                    const productVersionSize = await db.ProductVersionSize.findByPk(item.productVersionSizeId);
                    if (!productVersionSize) {
                        throw new Error('Product version size not found');
                    }

                    // Trừ số lượng tồn kho
                    productVersionSize.quantity -= item.quantity;
                    await productVersionSize.save();

                    // Tìm Product thông qua ProductVersion
                    const productVersion = await db.ProductVersion.findByPk(productVersionSize.productVersionId);
                    if (!productVersion) {
                        throw new Error('Product version not found');
                    }

                    const product = await db.Product.findByPk(productVersion.productId);
                    if (!product) {
                        throw new Error('Product not found');
                    }

                    // Tăng số lượng đã bán
                    product.sold += item.quantity;
                    await product.save();
                }
            }


            order.status = status;
            await order.save(); // Lưu thay đổi vào cơ sở dữ liệu
            // Trả về kết quả thành công
            return {
                status: "Ok",
                message: 'Order status updated successfully'
            };
        } catch (error) {
            console.error('Error updating order status:', error);
            return {
                status: "error",
                message: error.message
            };
        }
    },
    getTotalRevenue: async () => {
        try {
            // Truy vấn tổng số tiền của tất cả các đơn hàng với trạng thái 'fulfilled'
            const totalRevenue = await db.Order.sum('totalAmount', {
                where: { status: 'fulfilled' }
            });
            if (totalRevenue === null) {
                throw new Error('Unable to calculate total revenue');
            }
            return { status: 'success', totalRevenue: totalRevenue || 0 }; // Trả về 0 nếu không có doanh thu
        } catch (error) {
            console.error('Error calculating total revenue:', error);
            return { status: 'error', message: 'Unable to calculate total revenue', error: error.message };
        }
    },
}

module.exports = OrderService;
