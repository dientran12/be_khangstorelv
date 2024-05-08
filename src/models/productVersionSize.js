module.exports = (sequelize, DataTypes) => {
    const ProductVersionSize = sequelize.define('ProductVersionSize', {
        productVersionId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'ProductVersion',
                key: 'id',
            },
            allowNull: false
        },
        size: {
            type: DataTypes.ENUM('S', 'M', 'L', 'XL', '2XL'),
            allowNull: false
        },
        // Bạn có thể thêm các trường khác ở đây, ví dụ như số lượng tồn kho cho mỗi size
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    }, {
        indexes: [
            {
                unique: true,
                fields: ['productVersionId', 'size']
            }
        ]
    });

    ProductVersionSize.associate = function (models) {
        ProductVersionSize.belongsTo(models.ProductVersion, { foreignKey: 'productVersionId', as: 'productVersion' });
    };

    return ProductVersionSize;
};
