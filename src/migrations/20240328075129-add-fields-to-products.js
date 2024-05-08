'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Products', 'type', Sequelize.STRING);
    await queryInterface.addColumn('Products', 'sold', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Products', 'brand', Sequelize.STRING);
    await queryInterface.addColumn('Products', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'type');
    await queryInterface.removeColumn('Products', 'sold');
    await queryInterface.removeColumn('Products', 'brand');
    await queryInterface.removeColumn('Products', 'stock');
  }
};
