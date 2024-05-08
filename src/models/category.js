module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        // Các trường khác
    }, {});
    Category.associate = function (models) {
        Category.belongsToMany(models.Product, {
            through: 'ProductCategories',
            as: 'products',
            foreignKey: 'categoryName',
            otherKey: 'productId',
            onDelete: 'CASCADE'
        });
        Category.hasOne(models.Image, { foreignKey: 'objectId', constraints: false, scope: { objectType: 'Category' }, as: 'image' });
    };
    return Category;
};
