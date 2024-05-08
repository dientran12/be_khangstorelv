module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
        orderId: DataTypes.INTEGER,
        productVersionSizeId: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER,
        price: DataTypes.DECIMAL(10, 2),
        style: DataTypes.STRING,             // Thêm trường style
        productName: DataTypes.STRING,       // Thêm trường productName
        imageUrl: DataTypes.STRING           // Thêm trường imageUrl
    }, {});

    OrderItem.associate = function (models) {
        OrderItem.belongsTo(models.Order, {
            foreignKey: 'orderId',
            as: 'order'
        });
        OrderItem.belongsTo(models.ProductVersionSize, {
            foreignKey: 'productVersionSizeId',
            as: 'productVersionSize'
        });
    };

    return OrderItem;
};
