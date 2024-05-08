import express from 'express';
import user from './userRouter.js';
import category from './categoryRouter.js';
import product from './productRouter.js';
import version from './versionRouter.js';
import size from './sizeRouter.js';
import order from './orderRouter.js';
import payment from './payment.js';

const router = express.Router(); // Khai báo và gán giá trị cho router

let initWebRouter = (app) => {
    // API của User
    router.use('/api/user', user);
    router.use('/api/product', product);
    router.use('/api/order', order);
    router.use('/api/category', category);
    router.use('/api/version', version);
    router.use('/api/size', size);
    router.use('/api/payment', payment);

    return app.use('/', router); // Sử dụng router đã được khai báo và gán giá trị
}

export default initWebRouter;
