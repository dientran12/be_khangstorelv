'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Orders', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Users', // Tên bảng được tham chiếu
                    key: 'id',
                },
                onDelete: 'CASCADE'
            },
            shippingAddress: {
                type: Sequelize.STRING,
                allowNull: false, // Thiết lập này tùy thuộc vào yêu cầu cụ thể của ứng dụng của bạn
            },
            totalAmount: {
                type: Sequelize.INTEGER,
                allowNull: false, // Giả định rằng mỗi order phải có tổng số tiền
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Orders');
    }
};
