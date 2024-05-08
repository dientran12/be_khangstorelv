'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thay đổi kiểu dữ liệu của cột objectId sang STRING
    await queryInterface.changeColumn('Images', 'objectId', {
      type: Sequelize.STRING,
      allowNull: true // Hoặc false, tùy thuộc vào yêu cầu của bạn
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Đảo ngược lại thay đổi nếu cần rollback
    await queryInterface.changeColumn('Images', 'objectId', {
      type: Sequelize.INTEGER,
      allowNull: true // Giữ cho phù hợp với cài đặt ban đầu
    });
  }
};