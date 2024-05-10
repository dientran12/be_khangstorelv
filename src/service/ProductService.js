const db = require('../models/index')
const { Op } = require('sequelize'); // Import Sequelize operator
const ImageService = require('./ImageService');
const path = require('path');
const fs = require('fs');

const { Product, Image } = db;

const ProductService = {
    createProduct: async (data) => {
        const transaction = await db.sequelize.transaction();
        const uploadedImages = [];
        try {
            const { name, type, images, price, brand, description, categoryNames } = data;
            // Tạo sản phẩm mới
            const newProduct = await db.Product.create({ name, type, price, brand, description }, { transaction });
            if (categoryNames && categoryNames.length) {
                // Tìm hoặc tạo từng danh mục dựa trên tên và liên kết chúng với sản phẩm mới
                for (const categoryName of categoryNames) {
                    let category = await db.Category.findOne({ where: { name: categoryName }, transaction });
                    if (!category) {
                        category = await db.Category.create({ name: categoryName }, { transaction });
                    }
                    await newProduct.addCategory(category, { transaction });
                }
            }

            if (images && images.length) {
                for (const base64Data of images) {
                    const imageUrl = await ImageService.saveImage(base64Data, 'Product', newProduct.id, transaction);
                    uploadedImages.push(path.join(__dirname, '../public', imageUrl)); // Lưu đường dẫn của hình ảnh đã lưu
                }
            }

            await transaction.commit();
            return { status: 'success', message: 'Product created successfully', product: newProduct };

        } catch (e) {
            if (transaction) await transaction.rollback();

            // Xóa các file hình ảnh đã lưu trên hệ thống file
            uploadedImages.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            console.error(e);
            return { status: 'error', message: 'An error occurred while creating the product.', error: e.message };
        }
    },
    getProductById: async (id) => {
        try {
            const product = await db.Product.findByPk(id, {
                include: [
                    {
                        model: Image,
                        as: 'Images',
                        attributes: ['imageUrl']
                    },
                    {
                        model: db.Category,
                        as: 'categories', // Tên liên kết quan hệ
                        through: { attributes: [] } // Không lấy thông tin trung gian
                    },
                    {
                        model: db.ProductVersion,
                        as: 'versions',
                        attributes: ['id', 'style'],  // Bỏ 'stock' khỏi attributes
                        include: [
                            {
                                model: db.Image,
                                as: 'Images',
                                attributes: ['imageUrl'],
                                required: false
                            },
                            {
                                model: db.ProductVersionSize,
                                as: 'sizes',
                                attributes: ['id', 'size', 'quantity'],  // Thêm mô hình này để tính toán stock
                            }
                        ],
                    }
                ]
            });

            if (!product) {
                return { status: 'error', message: 'Product not found' };
            }

            const productJson = product.toJSON();
            productJson.images = productJson.Images.map(image => image.imageUrl);
            productJson.category = productJson.categories.map(category => category.name);
            delete productJson.Images;
            delete productJson.categories;
            let totalProductStock = 0; // Tổng số lượng cho toàn bộ sản phẩm
            productJson.versions = productJson.versions.map(version => {
                const versionStock = version.sizes.reduce((sum, size) => sum + size.quantity, 0);
                totalProductStock += versionStock; // Cộng dồn stock của từng version vào tổng stock của sản phẩm
                return {
                    id: version.id,
                    style: version.style,
                    stock: versionStock, // Stock của phiên bản cụ thể
                    sizes: version.sizes.map(size => ({
                        id: size.id,
                        size: size.size,
                        quantity: size.quantity
                    })),
                    images: version.Images.map(image => image.imageUrl)
                };
            });
            productJson.stock = totalProductStock;


            return { status: 'OK', data: productJson }
        } catch (e) {
            console.error(e);
            return { status: 'error', message: e.message };
        }
    },
    getAllProducts: async ({ page = 1, limit = 10, search = '', sort = 'createdAt_DESC', categoryName }) => {
        console.log('category', categoryName);
        console.log('Sorting criteria:', sort);
        limit = parseInt(limit); // Đảm bảo limit là một số
        page = parseInt(page); // Đảm bảo page là một số
        const offset = (page - 1) * limit; // Tính offset cho phân trang

        // Phân tách trường sắp xếp và thứ tự sắp xếp
        const [sortField, sortOrder] = sort.split('_');
        const orderQuery = [];

        if (sortField === 'sold') {
            orderQuery.push(['sold', sortOrder]);  // Sắp xếp trực tiếp theo thuộc tính 'sold' của Product
        } else {
            orderQuery.push(['createdAt', 'DESC']); // Sử dụng giá trị mặc định nếu không có thông tin sắp xếp cụ thể
        }

        // Tạo điều kiện tìm kiếm ban đầu dựa trên từ khóa tìm kiếm
        let searchCondition = {};
        if (search) {
            searchCondition = {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        try {
            const totalProductsCount = await Product.count({
                where: searchCondition,
                distinct: true,  // Đảm bảo rằng mỗi sản phẩm chỉ được tính một lần
                col: 'id',  // Chỉ định cột để áp dụng tính riêng biệt
                include: [
                    {
                        model: db.Category,
                        as: 'categories',
                        where: categoryName ? { name: categoryName } : undefined,
                        attributes: [],
                        required: !!categoryName  // Chỉ yêu cầu nếu categoryName được cung cấp
                    },

                ]
            });

            const products = await Product.findAndCountAll({
                where: searchCondition,
                include: [
                    {
                        model: Image,
                        as: 'Images',
                        attributes: ['imageUrl']
                    },
                    {
                        model: db.Category,
                        as: 'categories',
                        where: categoryName ? { name: categoryName } : undefined,
                        attributes: ['name'],
                        through: { attributes: [] },
                        required: !!categoryName
                    },
                    {
                        model: db.ProductVersion,
                        as: 'versions',
                        attributes: ['id', 'style'],  // Bỏ 'stock' khỏi attributes
                        include: [
                            {
                                model: db.Image,
                                as: 'Images',
                                attributes: ['imageUrl'],
                                required: false
                            },
                            {
                                model: db.ProductVersionSize,
                                as: 'sizes',
                                attributes: ['quantity'],  // Thêm mô hình này để tính toán stock
                            }
                        ],
                    }
                ],
                limit,
                offset,
                order: orderQuery
            });

            // Tính toán tổng số trang
            const totalPages = Math.ceil(totalProductsCount / limit);

            // Chuyển đổi dữ liệu sản phẩm trước khi gửi về client
            const productsTransformed = products.rows.map(product => {
                const productJson = product.toJSON();
                productJson.images = productJson.Images.map(image => image.imageUrl);
                productJson.category = productJson.categories.map(category => category.name);
                delete productJson.Images;
                delete productJson.categories;
                let totalProductStock = 0; // Tổng số lượng cho toàn bộ sản phẩm
                productJson.versions = productJson.versions.map(version => {
                    const versionStock = version.sizes.reduce((sum, size) => sum + size.quantity, 0);
                    totalProductStock += versionStock; // Cộng dồn stock của từng version vào tổng stock của sản phẩm
                    return {
                        id: version.id,
                        style: version.style,
                        stock: versionStock, // Stock của phiên bản cụ thể
                        images: version.Images.map(image => image.imageUrl)
                    };
                });
                productJson.stock = totalProductStock;
                return productJson;
            });

            if (sortField === 'stock') {
                productsTransformed.sort((a, b) => {
                    if (sortOrder === 'desc') {
                        return b.stock - a.stock;  // Sắp xếp giảm dần
                    } else {
                        return a.stock - b.stock;  // Sắp xếp tăng dần
                    }
                });
            }

            return {
                status: 'success',
                totalPages,
                currentPage: page,
                totalProducts: totalProductsCount,
                products: productsTransformed
            };
        } catch (error) {
            console.error('Error querying products:', error);
            throw new Error('Unable to fetch products: ' + error.message);
        }
    },
    // Update a product by ID
    updateProduct: async (id, updateData) => {
        const transaction = await db.sequelize.transaction();
        const newImagePaths = [];
        try {
            const { category: categoryNames, images, imageNews, ...productUpdateData } = updateData;
            console.log('categoryNames ', categoryNames)
            const product = await db.Product.findByPk(id, { transaction });
            console.log('sau product')
            if (!product) {
                throw new Error('Product not found'); // Ném ra lỗi ở đây
            }

            console.log('productUpdateData', productUpdateData)
            if (categoryNames) {
                // Xóa mọi liên kết danh mục hiện tại
                await product.setCategories([], { transaction });

                // Tạo liên kết mới với danh mục
                for (const categoryName of categoryNames) {
                    let category = await db.Category.findOne({ where: { name: categoryName }, transaction });
                    if (!category) {
                        category = await db.Category.create({ name: categoryName }, { transaction });
                    }
                    await product.addCategory(category, { transaction });
                }
            }

            if (images) {
                const productImages = await db.Image.findAll({
                    where: { objectId: id, objectType: 'Product' },
                    attributes: ['imageUrl'],
                    transaction
                });
                const currentImageUrls = productImages.map(image => image.imageUrl);
                await ImageService.deleteImagesNotInList(currentImageUrls, images, transaction);
            }

            if (imageNews && imageNews.length) {
                for (const base64Data of updateData.imageNews) {
                    const imageUrl = await ImageService.saveImage(base64Data, 'Product', id, transaction);
                    newImagePaths.push(path.join(__dirname, '../public', imageUrl)); // Lưu đường dẫn của hình ảnh mới
                }
            }

            await product.update(productUpdateData, { transaction });

            await transaction.commit();
            return { status: 'OK', message: 'Product updated successfully', product: product };

        } catch (e) {
            await transaction.rollback();
            newImagePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            console.error(e);
            throw e;
        }
    },
    // Delete a product by ID
    deleteProductById: async (id) => {
        const transaction = await db.sequelize.transaction();
        try {
            const product = await db.Product.findByPk(id, { transaction });
            if (!product) {
                throw new Error('Product not found');
            }

            // Xóa tất cả hình ảnh của sản phẩm
            await ImageService.deleteImagesByObjectId(id, 'Product', transaction);

            // Xóa tất cả các phiên bản của sản phẩm
            const versions = await db.ProductVersion.findAll({
                where: { productId: id },
                transaction
            });

            for (const version of versions) {
                // Xóa tất cả hình ảnh của phiên bản sản phẩm
                await ImageService.deleteImagesByObjectId(version.id, 'ProductVersion', transaction);

                // Xóa phiên bản sản phẩm
                await version.destroy({ transaction });
            }

            // Xóa sản phẩm
            await product.destroy({ transaction });

            await transaction.commit();
            return { status: 'OK', message: 'Product and all related versions and images deleted successfully' };
        } catch (e) {
            await transaction.rollback();
            console.error(e);
            throw e;
        }
    },
    getTotalProductStock: async () => {
        try {
            // Sử dụng hàm aggregate để tính tổng số lượng từ tất cả ProductVersionSize
            const totalStock = await db.ProductVersionSize.sum('quantity');
            if (totalStock === null) {
                throw new Error('Unable to calculate total stock');
            }
            return { status: 'success', totalStock };
        } catch (error) {
            console.error('Error calculating total product stock:', error);
            return { status: 'error', message: 'Unable to calculate total product stock', error: error.message };
        }
    },

};

export default ProductService;