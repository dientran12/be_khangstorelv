module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define('Image', {
        objectId: DataTypes.STRING,
        objectType: DataTypes.STRING,
        imageUrl: DataTypes.STRING,
    }, {});
    return Image;
};
