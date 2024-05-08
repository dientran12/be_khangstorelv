'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'note', {
      type: Sequelize.STRING,
      allowNull: true,  // Cho phép giá trị NULL nếu note không bắt buộc
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'note');
  }
};
