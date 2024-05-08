const VersionService = require("../service/VersionService");

const createVersion = async (req, res) => {
    try {
        const { productId } = req.query;
        const { style } = req.body;
        if (!style) {
            return res.status(400).json({ error: 'Style is required' });
        }
        const response = await VersionService.createVersion(productId, req.body);
        return res.status(200).json(response);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: 'An error occurred on the server'
        });
    }
};
const getAllVersionsOfProduct = async (req, res) => {
    const { page, limit } = req.query; // Nhận tham số từ query string
    const { productId } = req.query;

    try {
        const result = await VersionService.getAllVersionsOfProduct(productId, page, limit);
        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Function to update an existing product version
const updateProductVersion = async (req, res) => {

    try {
        const { id } = req.params;
        const { style } = req.body;
        if (style !== undefined && !style) {
            return res.status(400).json({ status: 'error', message: 'Product style is not empty' });
        }
        const updatedProductVersion = await VersionService.updateProductVersion(id, req.body);

        if (!updatedProductVersion) {
            return res.status(404).json({ error: 'Product version not found' });
        }

        // Trả về dữ liệu của phiên bản sản phẩm đã cập nhật
        res.status(200).json(updatedProductVersion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
};

const getVersion = (req, res) => {
    const { id } = req.params;
    VersionService.getVersion(id)
        .then((version) => {
            if (version) {
                return res.status(200).json(version);
            } else {
                return res.status(404).json({ error: 'Product version not found' });
            }
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json({ error: 'Internal server error' });
        });

}
const deleteVersion = (req, res) => {
    const { id } = req.params;
    VersionService.deleteVersion(id)
        .then(() => {
            return res.status(200).json({ message: 'Product version deleted successfully' });
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json({ error: 'Internal server error' });
        });
}


module.exports = {
    createVersion,
    updateProductVersion,
    getAllVersionsOfProduct,
    deleteVersion,
    getVersion,
};