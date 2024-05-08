'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('ProductVersions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            productId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Products', // Tên bảng sản phẩm
                    key: 'id'
                },
                onDelete: 'CASCADE' // Khi sản phẩm bị xóa, các phiên bản sản phẩm liên quan cũng sẽ bị xóa
            },
            style: {
                type: Sequelize.STRING,
                allowNull: false // Giả sử mỗi phiên bản sản phẩm cần có kiểu dáng
            },
            // Định nghĩa các trường khác ở đây
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
        await queryInterface.dropTable('ProductVersions');
    }
};
