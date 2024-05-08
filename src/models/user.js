// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // Định nghĩa các trường cần thiết
    name: DataTypes.STRING,
    role: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,  // Số điện thoại của người dùng, có thể để NULL
    address: DataTypes.STRING,
    // các trường khác
  }, {});

  User.associate = function (models) {
    // associations can be defined here
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders',
      onDelete: 'SET NULL', // hoặc 'CASCADE' tùy thuộc vào yêu cầu kinh doanh
    });

    User.hasOne(models.Image, {
      foreignKey: 'objectId',
      constraints: false,
      scope: {
        objectType: 'User'
      },
      as: 'Image' // Sử dụng số ít vì mỗi người dùng chỉ có một hình ảnh
    });
  };

  return User;
};
