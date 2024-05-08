const db = require('../models/index.js'); // Đường dẫn đúng đến models của bạn
const ImageService = require('./ImageService.js'); // Giả định rằng bạn đã có service này
const { Image, Category } = db;

const CategoryService = {
    createCategory: async (data) => {
        const { name, description, base64Image } = data;
        const transaction = await db.sequelize.transaction();

        try {
            let imageUrl = '';
            if (base64Image) {
                imageUrl = await ImageService.saveImage(base64Image, 'Category', name); // Giả định rằng saveImage trả về URL của ảnh đã lưu
            }

            const newCategory = await db.Category.create({
                name,
                description,
                imageUrl
            }, { transaction });

            await transaction.commit();
            return { success: true, category: newCategory };
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            throw new Error('Failed to create category');
        }
    },
    updateCategory: async (categoryId, updateData) => {
        const category = await db.Category.findByPk(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        // Kiểm tra xem có dữ liệu ảnh mới được cung cấp không và có imageId không
        if (updateData.base64Image && updateData.imageId) {
            try {
                // Cập nhật ảnh mới sử dụng ImageService
                const newImageUrl = await ImageService.updateImage(updateData.base64Image, categoryId, 'Category', updateData.imageId);
                // Cập nhật đường dẫn ảnh mới vào dữ liệu cập nhật
                updateData.imageUrl = newImageUrl;
            } catch (error) {
                console.error(error);
                throw new Error('Failed to update image');
            }
            // Loại bỏ trường base64Image và imageId khỏi updateData vì nó không phải là trường của model Category
            delete updateData.base64Image;
            delete updateData.imageId;
        }

        // Cập nhật thông tin danh mục với dữ liệu mới
        const updatedCategory = await category.update(updateData);
        return updatedCategory;
    },
    getAllCategories: async () => {
        try {
            const categories = await db.Category.findAll({
                include: [{
                    model: db.Image,
                    as: 'image', // Giả sử bạn đã đặt alias 'image' trong mô hình quan hệ
                    attributes: ['imageUrl'],
                    required: false
                }]
            });

            // Biến đổi dữ liệu để trường `image` là chuỗi URL của hình ảnh
            const transformedCategories = categories.map(category => {
                const categoryData = category.get({ plain: true });
                return {
                    ...categoryData,
                    // Chuyển trường `image` thành chuỗi URL, nếu hình ảnh tồn tại
                    image: categoryData.image ? categoryData.image.imageUrl : null
                };
            });

            return {
                success: true,
                message: 'Categories retrieved successfully',
                data: transformedCategories
            };
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    },
    getProductsByCategory: async (categoryName, page = 1, limit = 10) => {
        limit = parseInt(limit);
        page = parseInt(page);
        const offset = (page - 1) * limit;

        try {
            // Truy vấn tất cả sản phẩm thuộc về danh mục với tên được cung cấp
            const { count, rows } = await db.Product.findAndCountAll({
                include: [
                    {
                        model: db.Category,
                        as: 'categories',
                        where: { name: categoryName },
                        attributes: []
                    },
                    {
                        model: db.Image,
                        as: 'Images', // Alias cho mối quan hệ giữa Product và Image
                        attributes: ['imageUrl'], // Giả sử bạn muốn lấy trường imageUrl từ bảng Image
                        required: false // Cho phép sản phẩm không có ảnh
                    }
                ],
                limit,
                offset,
                distinct: true
            });

            const products = rows.map(product => {
                const productJson = product.toJSON(); // Chuyển đổi thành POJO (Plain Old JavaScript Object)
                productJson.images = productJson.Images.map(image => image.imageUrl); // Tạo mảng mới chỉ chứa imageUrl
                delete productJson.Images; // Xóa thuộc tính Images cũ nếu không cần thiết
                return productJson;
            });

            return {
                status: 'success',
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                products: products
            };
        } catch (error) {
            console.error('Error getting products by category:', error);
            throw error;
        }
    },

    deleteCategory: async (categoryName) => {
        let transaction;

        try {
            // Bắt đầu một transaction
            transaction = await db.sequelize.transaction();

            const category = await db.Category.findByPk(categoryName, { transaction });
            if (!category) {
                throw new Error('Category not found');
            }

            // Tìm tất cả ảnh liên kết với category này
            const images = await db.Image.findAll({
                where: { objectId: categoryName, objectType: 'Category' },
                transaction
            });

            // Xóa tất cả ảnh bằng hàm deleteImage từ ImageService
            for (const image of images) {
                // Gọi hàm deleteImage, truyền vào ID của ảnh
                await ImageService.deleteImage(image.id, transaction); // Đảm bảo hàm deleteImage hỗ trợ transactions nếu cần
            }

            // Xóa category từ CSDL
            await category.destroy({ transaction });

            // Hoàn thành transaction
            await transaction.commit();

            return { success: true, message: 'Category and its images deleted successfully.' };
        } catch (error) {
            // Nếu có lỗi, rollback transaction
            if (transaction) await transaction.rollback();

            console.error(error);
            return { success: false, message: 'Failed to delete category and its images.', error: error.message };
        }
    }

};

module.exports = CategoryService;
