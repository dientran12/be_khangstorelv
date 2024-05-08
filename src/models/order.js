module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        userId: DataTypes.INTEGER,
        shippingAddress: {
            type: DataTypes.STRING,
        },
        totalAmount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        paymentMethod: DataTypes.STRING,
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 'pending'
        },
        phoneNumber: DataTypes.STRING,
        note: DataTypes.STRING // Thêm trường note
    }, {});

    Order.associate = function (models) {
        Order.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Order.hasMany(models.OrderItem, {
            foreignKey: 'orderId',
            as: 'items'
        });
    };

    return Order;
};
