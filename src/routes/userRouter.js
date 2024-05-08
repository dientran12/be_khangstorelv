import express from 'express';
import UserController from '../controllers/UserController';
import authUserMiddleware from '../middleware/authUserMiddleware';

const router = express.Router();
const { authenticateToken, checkAdminOrSelf } = authUserMiddleware;

router.post('/sign-up', UserController.createUsers)
router.post('/sign-in', UserController.loginUser)
router.post('/logout', UserController.logoutUser)
router.get('/get-detail/:id', UserController.getOneUser)
router.get('/info', authenticateToken, UserController.getUserInfo)
router.put('/update/:id', [authenticateToken, checkAdminOrSelf], UserController.updateUser)
router.delete('/delete-user/:id', UserController.deleteUser)
router.get('/get-all-users', UserController.getAllUsers)
router.post('/refresh-token', UserController.refreshToken)
router.post('/cart-add/:id', [authenticateToken, checkAdminOrSelf], UserController.addCart)
router.get('/get-cart', authenticateToken, UserController.getCart)
router.delete('/remove-cart-item/:id/:cartItemId', [authenticateToken, checkAdminOrSelf], UserController.removeCartItem)
router.get('/get-total-users', UserController.getTotalUser)

export default router