const db = require("../models");

const ProductVersionSizeService = {
    createProductVersionSize: async (id, size, quantity, transaction) => {
        console.log("size, quantity ", size, quantity);
        try {
            const productVersion = await db.ProductVersion.findByPk(id, { transaction });
            if (!productVersion) {
                throw new Error('Product version not found');
            }
            const newProductVersionSize = await db.ProductVersionSize.create({
                productVersionId: id,
                size,
                quantity
            }, { transaction });
            return newProductVersionSize;
        } catch (error) {
            console.error(error);
            throw error;  // Đẩy lỗi ra ngoài để xử lý rollback ở ngoài cùng
        }
    },

    updateProductVersionSize: async (id, size, quantity, transaction) => {
        try {
            const updatedProductVersionSize = await db.ProductVersionSize.update({
                quantity
            }, {
                where: {
                    productVersionId: id,
                    size
                },
                transaction
            });
            return updatedProductVersionSize;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while updating the product version size');
        }
    },
    getVersionSizesOfVerion: async (id) => {
        const productVersionSize = await db.ProductVersionSize.findAll({
            where: {
                productVersionId: id
            }
        });
        return productVersionSize;
    },

    deleteProductVersionSize: async (id, size, transaction) => {
        try {
            await db.ProductVersionSize.destroy({
                where: {
                    productVersionId: id,
                    size
                },
                transaction
            });
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while deleting the product version size');
        }
    }
}

module.exports = ProductVersionSizeService;