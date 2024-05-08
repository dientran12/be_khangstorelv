'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'stock');
    await queryInterface.removeColumn('ProductVersions', 'stock');
    await queryInterface.removeColumn('ProductVersions', 'sold');
  },

  down: async (queryInterface, Sequelize) => {
    // Thêm lại các cột nếu cần rollback
    await queryInterface.addColumn('Products', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    await queryInterface.addColumn('ProductVersions', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    await queryInterface.addColumn('ProductVersions', 'sold', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  }
};
