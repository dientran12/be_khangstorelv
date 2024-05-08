import express from 'express';
import CategoryController from '../controllers/CategoryController';

const router = express.Router();

router.post('/create', CategoryController.createCategory)
router.get('/get-all', CategoryController.getAllCategories)
router.get('/get-product-of-category', CategoryController.getProductsByCategory)
router.put('/update/:categoryName', CategoryController.updateCategory)
router.delete('/delete/:categoryName', CategoryController.deleteCategory)


export default router