module.exports = (sequelize, DataTypes) => {
    const CartItem = sequelize.define('CartItem', {
        userId: DataTypes.INTEGER,
        productVersionSizeId: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER
    }, {});

    CartItem.associate = function (models) {
        CartItem.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        CartItem.belongsTo(models.ProductVersionSize, {
            foreignKey: 'productVersionSizeId',
            as: 'productVersionSize'
        });
    };

    return CartItem;
};
