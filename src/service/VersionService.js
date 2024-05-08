const db = require('../models/index.js'); // Đường dẫn đúng đến models của bạn
const ImageService = require('./ImageService');
const path = require('path');
const ProductVersionSizeService = require('./ProductVersionSizeService.js');

const VersionService = {
    createVersion: async (productId, data) => {
        const transaction = await db.sequelize.transaction();
        const uploadedImages = [];
        try {
            const { style, images } = data;

            // Kiểm tra xem sản phẩm có tồn tại không
            const product = await db.Product.findByPk(productId, { transaction });
            if (!product) {
                throw new Error('Product not found'); // Nếu không tìm thấy sản phẩm, ném lỗi
            }

            // Tạo phiên bản sản phẩm mới
            const newProductVersion = await db.ProductVersion.create({
                productId,
                style
            }, { transaction });

            // Lưu hình ảnh (nếu có)
            if (images && images.length) {
                for (const base64Data of images) {
                    const imageUrl = await ImageService.saveImage(base64Data, 'ProductVersion', newProductVersion.id, transaction);

                    uploadedImages.push(path.join(__dirname, '../public', imageUrl)); // Lưu đường dẫn của hình ảnh đã lưu
                }
            }

            await transaction.commit();
            return { status: 'success', message: 'Product version created successfully', productVersion: newProductVersion };

        } catch (e) {
            if (transaction) await transaction.rollback();

            // Xóa các file hình ảnh đã lưu trên hệ thống file
            uploadedImages.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            console.error(e);
            return { status: 'error', message: 'An error occurred while creating the product version.', error: e.message };
        }
    },
    getAllVersionsOfProduct: async (productId, page = 1, limit = 8) => {
        try {
            console.log("Checking for productId:", productId);
            const product = await db.Product.findByPk(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            limit = parseInt(limit);
            page = parseInt(page);
            const offset = (page - 1) * limit;

            const { count, rows } = await db.ProductVersion.findAndCountAll({
                where: { productId },
                limit,
                offset,
                attributes: { exclude: ['productId'] },
                include: [
                    {
                        model: db.Image,
                        as: 'Images',
                        attributes: ['imageUrl'],
                    },
                    {
                        model: db.ProductVersionSize,
                        as: 'sizes',
                        attributes: ['size', 'quantity']
                    }
                ],
                order: [['createdAt', 'DESC']] // Sắp xếp theo ngày tạo
            });

            const totalPages = Math.ceil(count / limit);

            const versionsTransformed = rows.map(version => {
                const versionJson = version.toJSON();
                // Sử dụng đúng tên alias 'Images' như được định nghĩa trong 'include'
                versionJson.images = versionJson.Images ? versionJson.Images.map(image => image.imageUrl) : [];
                delete versionJson.Images; // Xóa thuộc tính Images không cần thiết
                versionJson.sizes = versionJson.sizes ? versionJson.sizes.map(size => ({
                    size: size.size,
                    quantity: size.quantity
                })) : [];
                return versionJson;
            });


            return { status: 'success', totalPages, currentPage: page, versions: versionsTransformed };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    },

    updateProductVersion: async (versionId, data) => {
        console.log("data ", data?.sizes?.updated.length > 0 && data?.sizes?.updated[0])
        const transaction = await db.sequelize.transaction();
        const newImagePaths = [];  // Khai báo biến để lưu đường dẫn ảnh mới

        try {
            const { style, images, imageNews, sizes } = data;
            const productVersion = await db.ProductVersion.findByPk(versionId, { transaction });
            if (!productVersion) {
                throw new Error('Product version not found');
            }

            if (images) {
                const versionImages = await db.Image.findAll({
                    where: { objectId: versionId, objectType: 'ProductVersion' },
                    attributes: ['imageUrl'],
                    transaction
                });
                const currentImageUrls = versionImages.map(image => image.imageUrl);
                await ImageService.deleteImagesNotInList(currentImageUrls, images, transaction);
            }

            if (imageNews && imageNews.length) {
                for (const base64Data of imageNews) {  // Sửa đổi ở đây
                    const imageUrl = await ImageService.saveImage(base64Data, 'ProductVersion', versionId, transaction);
                    newImagePaths.push(path.join(__dirname, '../public', imageUrl));
                }
            }

            if (sizes) {
                // Xử lý thêm kích thước mới
                for (const newSize of sizes.added) {
                    await ProductVersionSizeService.createProductVersionSize(versionId, newSize.size, newSize.quantity, transaction);
                }

                // Xử lý cập nhật kích thước
                for (const updatedSize of sizes.updated) {
                    await ProductVersionSizeService.updateProductVersionSize(versionId, updatedSize.size, updatedSize.quantity, transaction);
                }

                // Xử lý xóa kích thước
                for (const removedSize of sizes.removed) {
                    await ProductVersionSizeService.deleteProductVersionSize(versionId, removedSize.size, transaction);
                }
            }

            productVersion.style = style;
            await productVersion.save({ transaction });

            await transaction.commit();  // Commit transaction
            return productVersion.toJSON();
        } catch (error) {
            await transaction.rollback();  // Rollback in case of error
            console.error(error);
            newImagePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            throw new Error('An error occurred while updating the product version');

        }
    },
    getVersion: async (versionId) => {
        try {
            const productVersion = await db.ProductVersion.findByPk(versionId, {
                attributes: { exclude: ['productId'] },
                include: [
                    {
                        model: db.Image,
                        as: 'Images',
                        attributes: ['imageUrl'],
                    },
                    {
                        model: db.ProductVersionSize,
                        as: 'sizes',
                        attributes: ['size', 'quantity']
                    }
                ]
            });

            if (!productVersion) {
                throw new Error('Product version not found');
            }

            const versionJson = productVersion.toJSON();
            versionJson.images = versionJson.Images ? versionJson.Images.map(image => image.imageUrl) : [];
            delete versionJson.Images;
            versionJson.sizes = versionJson.sizes ? versionJson.sizes.map(size => ({
                size: size.size,
                quantity: size.quantity
            })) : [];

            return versionJson;
        } catch (error) {
            console.error(error);
            throw new Error('An error occurred while getting the product version');
        }
    },
    deleteVersion: async (versionId) => {
        const transaction = await db.sequelize.transaction();
        try {
            const productVersion = await db.ProductVersion.findByPk(versionId, { transaction });
            if (!productVersion) {
                throw new Error('Product version not found');
            }

            // Xóa hình ảnh của phiên bản sản phẩm
            await ImageService.deleteImagesByObjectId(versionId, 'ProductVersion', transaction);

            // Xóa các kích thước của phiên bản sản phẩm
            await db.ProductVersionSize.destroy({
                where: {
                    productVersionId: versionId
                },
                transaction
            });

            await productVersion.destroy({ transaction });
            await transaction.commit();
            return { status: 'success', message: 'Product version deleted successfully' };
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return { status: 'error', message: 'An error occurred while deleting the product version' };
        }
    }


}

module.exports = VersionService;