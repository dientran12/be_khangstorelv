const ProductVersionSizeService = require("../service/ProductVersionSizeService");

const ProductVersionSizeController = {
    createProductVersionSize: async (req, res) => {
        console.log('vwvew', req.query)
        const { versionId } = req.query;
        const { size } = req.body;
        if (!size) {
            return res.status(400).json({ status: 'error', message: 'Size is not empty' });
        }
        const newProductVersionSize = await ProductVersionSizeService.createProductVersionSize(versionId, req.body);
        res.status(201).json(newProductVersionSize);
    },
    getSizesOfVerion: async (req, res) => {
        console.log(' req.query', req.query)
        const { versionId } = req.query;
        const productVersionSize = await ProductVersionSizeService.getVersionSizesOfVerion(versionId);
        if (!productVersionSize) {
            return res.status(404).json({ status: 'error', message: 'Product version size not found' });
        }
        res.status(200).json(productVersionSize);
    },




}

module.exports = ProductVersionSizeController;