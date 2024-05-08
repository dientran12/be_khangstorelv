'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa bảng Size
    await queryInterface.dropTable('Sizes');
  },
  down: async (queryInterface, Sequelize) => {
    // Tùy thuộc vào cấu trúc cụ thể của bảng Size bạn muốn tái tạo, đây là một ví dụ
    await queryInterface.createTable('Sizes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // Các trường khác nếu cần
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
  }
};
