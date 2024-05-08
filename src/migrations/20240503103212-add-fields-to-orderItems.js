'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OrderItems', 'style', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('OrderItems', 'productName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('OrderItems', 'imageUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('OrderItems', 'style');
    await queryInterface.removeColumn('OrderItems', 'productName');
    await queryInterface.removeColumn('OrderItems', 'imageUrl');
  }
};
