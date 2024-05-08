const CategoryService = require('../service/CategoryService');

const CategoryController = {
    createCategory: async (req, res) => {
        try {
            const { name, image: base64Image } = req.body;
            if (!name) {
                return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống.' });
            }
            // Gọi service sau khi đã xác nhận dữ liệu đầu vào là hợp lệ
            const result = await CategoryService.createCategory({ name, base64Image });

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                category: result.category
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },
    updateCategory: async (req, res) => {
        const { categoryId } = req.params; // Giả sử ID của danh mục được truyền qua đường dẫn URL
        const updateData = req.body; // Dữ liệu cập nhật được truyền qua body của yêu cầu

        try {
            // Kiểm tra dữ liệu đầu vào (tùy chọn)
            if (!updateData.name || !updateData.description) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and description are required for updating category.'
                });
            }

            const updatedCategory = await CategoryService.updateCategory(categoryId, updateData);

            res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                category: updatedCategory
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },
    getAllCategories: async (req, res) => {
        try {
            const categories = await CategoryService.getAllCategories();
            res.status(200).json(categories);
        } catch (error) {
            console.error('Error in getCategory controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    getProductsByCategory: async (req, res) => {
        try {
            const { categoryName } = req.query;
            const products = await CategoryService.getProductsByCategory(categoryName);
            res.status(200).json(products);
        } catch (error) {
            console.error('Error in getProductsByCategory controller:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },
    deleteCategory: async (req, res) => {
        const { categoryName } = req.params; // Giả sử ID của danh mục được truyền qua đường dẫn URL
        try {
            await CategoryService.deleteCategory(categoryName);
            res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteCategory controller:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
};

module.exports = CategoryController;
