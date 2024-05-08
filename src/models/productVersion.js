module.exports = (sequelize, DataTypes) => {
    const ProductVersion = sequelize.define('ProductVersion', {
        productId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Product',
                key: 'id',
            },
            allowNull: false
        },
        style: DataTypes.STRING,
    }, {
        indexes: [
            {
                unique: true,
                fields: ['productId', 'style']
            }
        ]
    });
    ProductVersion.associate = function (models) {
        ProductVersion.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
        ProductVersion.hasMany(models.ProductVersionSize, { as: 'sizes', foreignKey: 'productVersionId', onDelete: 'CASCADE' });
        ProductVersion.hasMany(models.Image, { foreignKey: 'objectId', constraints: false, scope: { objectType: 'ProductVersion' } });
    };
    return ProductVersion;
};
