import express from 'express';
import VersionController from '../controllers/VersionController';
import authUserMiddleware from '../middleware/authUserMiddleware';

const router = express.Router();

router.post('/create', VersionController.createVersion)
router.put('/update/:id', VersionController.updateProductVersion)
router.delete('/delete/:id', VersionController.deleteVersion)
router.get('/get/:id', VersionController.getVersion)
router.get('/get-all-version-of-product', VersionController.getAllVersionsOfProduct)


export default router