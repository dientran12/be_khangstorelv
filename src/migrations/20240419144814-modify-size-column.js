'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thay đổi kiểu dữ liệu của cột 'size'
    await queryInterface.changeColumn('productVersionSizes', 'size', {
      type: Sequelize.ENUM('S', 'M', 'L', 'XL', '2XL'),
      allowNull: false
    });

    // Thêm ràng buộc duy nhất cho cặp 'productVersionId' và 'size'
    await queryInterface.addConstraint('productVersionSizes', {
      fields: ['productVersionId', 'size'],
      type: 'unique',
      name: 'unique_size_per_version'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa ràng buộc duy nhất
    await queryInterface.removeConstraint('productVersionSizes', 'unique_size_per_version');

    // Đổi lại kiểu dữ liệu của cột 'size' sang STRING
    await queryInterface.changeColumn('productVersionSizes', 'size', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
