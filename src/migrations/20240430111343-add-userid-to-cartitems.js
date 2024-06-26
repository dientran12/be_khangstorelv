module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('cartItems', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('cartItems', 'userId');
  }
};