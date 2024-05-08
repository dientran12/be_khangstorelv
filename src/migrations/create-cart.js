// migrations/[timestamp]-create-cart.js
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Carts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            // Định nghĩa các trường khác cho Cart
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Users', // Tên bảng được tham chiếu
                    key: 'id',
                },
                onDelete: 'CASCADE'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Carts');
    }
};
