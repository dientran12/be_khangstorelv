'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Products', 'price', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0 // Hoặc bất kỳ giá trị mặc định nào bạn chọn
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'price');
  }
};
