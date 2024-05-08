'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Xóa cột sizeId
    await queryInterface.removeColumn('ProductVersionSizes', 'sizeId');

    // Thêm cột size mới với kiểu dữ liệu STRING
    await queryInterface.addColumn('ProductVersionSizes', 'size', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Đảo ngược quá trình: thêm lại cột sizeId và xóa cột size
    await queryInterface.addColumn('ProductVersionSizes', 'sizeId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Sizes',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });
    await queryInterface.removeColumn('ProductVersionSizes', 'size');
  }
};
