import express from 'express';
import ProductController from '../controllers/ProductController';
import authUserMiddleware from '../middleware/authUserMiddleware';

const router = express.Router();

router.post('/create', ProductController.createProduct)
router.put('/update/:id', ProductController.updateProduct)
router.delete('/delete/:id', ProductController.deleteProduct)
router.get('/get-detail/:id', ProductController.getProduct)
router.get('/get-total-stock', ProductController.getTotalProductStock)
router.get('/get', ProductController.getAllProducts)


export default router