module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('carts');
  },
  down: async (queryInterface, Sequelize) => {
    // code để tái tạo bảng carts nếu cần
  }
};
