import express from 'express';
import SizeController from '../controllers/SizeController';

const router = express.Router();

router.post('/create', SizeController.createProductVersionSize)
router.get('/get-sizes-of-version', SizeController.getSizesOfVerion)


export default router