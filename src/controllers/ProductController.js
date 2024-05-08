import ProductService from '../service/ProductService.js';

const createProduct = async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name) {
            return res.status(400).json({ success: "error", message: 'Product name is required' });
        }
        if (!price) {
            return res.status(400).json({ success: "error", message: 'Product price is required' });
        }

        const response = await ProductService.createProduct(req.body);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred on the server'
        });
    }
};

const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductService.getProductById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: 'An error occurred on the server' });
    }
};

// Get all products
const getAllProducts = async (req, res, next) => {
    // Giả sử hàm getAllProducts có thể chấp nhận tham số để phân trang
    try {
        const result = await ProductService.getAllProducts({ ...req.query });

        return res.status(200).json(result);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: 'An error occurred on the server' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await ProductService.deleteProductById(id);
        if (success) {
            return res.status(200).json({ success: true, message: 'Product successfully deleted' });
        } else {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: 'An error occurred on the server' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, ...updateData } = req.body;

        // console.log("res.body", req.body)

        if (name !== undefined && !name) {
            return res.status(400).json({ status: 'error', message: 'Product name cannot be empty' });
        }
        if (price !== undefined && price === null) { // Sử dụng price === null để cho phép giá trị 0
            return res.status(400).json({ status: 'error', message: 'Product price is required' });
        }

        const updatedProduct = await ProductService.updateProduct(id, { name, price, ...updateData });
        if (updatedProduct?.status === 'error') {
            if (updatedProduct?.message === 'Product not found') {
                return res.status(404).json(updatedProduct?.message);
            } else {
                return res.status(500).json(updatedProduct?.message);
            }
        }
        return res.status(200).json(updatedProduct);
    } catch (error) {
        const statusCode = error.message === 'Product not found' ? 404 : 500;
        return res.status(statusCode).json({
            status: 'error',
            message: error.message
        });
    }
};

const getTotalProductStock = async (req, res) => {
    try {
        const totalStock = await ProductService.getTotalProductStock();
        return res.status(200).json(totalStock);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'An error occurred on the server' });
    }
}

export default {
    createProduct,
    updateProduct,
    getProduct,
    getAllProducts,
    getTotalProductStock,
    deleteProduct
};
