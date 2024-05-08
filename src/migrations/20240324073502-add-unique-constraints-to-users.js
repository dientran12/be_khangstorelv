module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm ràng buộc duy nhất cho cột name
    await queryInterface.changeColumn('Users', 'name', {
      type: Sequelize.STRING,
      unique: true
    });

    // Thêm ràng buộc duy nhất cho cột email
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Loại bỏ ràng buộc duy nhất cho cột name
    await queryInterface.changeColumn('Users', 'name', {
      type: Sequelize.STRING
    });

    // Loại bỏ ràng buộc duy nhất cho cột email
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING
    });
  }
};
