'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'paymentMethod', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.addColumn('orders', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending'
    });
    await queryInterface.addColumn('orders', 'phoneNumber', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'paymentMethod');
    await queryInterface.removeColumn('orders', 'status');
    await queryInterface.removeColumn('orders', 'phoneNumber');
  }
};
