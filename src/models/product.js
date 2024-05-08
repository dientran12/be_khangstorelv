module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        name: {
            type: DataTypes.STRING,
            set(value) {
                // Cắt bỏ khoảng trắng thừa ở đầu và cuối của chuỗi
                this.setDataValue('name', value.trim());
            }
        },
        type: DataTypes.STRING,
        description: DataTypes.STRING,
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        sold: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        brand: DataTypes.STRING,
        // Các trường khác
    }, {});
    Product.associate = function (models) {
        Product.hasMany(models.ProductVersion, { as: 'versions' });
        Product.hasMany(models.Image, { foreignKey: 'objectId', constraints: false, scope: { objectType: 'Product' } });
        Product.belongsToMany(models.Category, {
            through: 'ProductCategories',
            as: 'categories',
            foreignKey: 'productId',
            otherKey: 'categoryName',
            onDelete: 'CASCADE'
        });
    };
    return Product;
};
