'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra trước khi xóa cột
    const tableDesc = await queryInterface.describeTable('cartItems');
    if (tableDesc.cartId) {
      await queryInterface.removeColumn('cartItems', 'cartId');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại cột nếu cần rollback
    await queryInterface.addColumn('cartItems', 'cartId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'carts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};
