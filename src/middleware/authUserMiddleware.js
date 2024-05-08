import jwt from "jsonwebtoken"
require('dotenv').config()


// Middleware để xác thực token và thêm thông tin người dùng vào req.user
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: 'No token provided',
            status: 'error'
        });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({
                message: 'Invalid or expired token',
                status: 'error'
            });
        }
        req.user = user;
        next();
    });
};

// Middleware để kiểm tra quyền truy cập
const checkAdminOrSelf = (req, res, next) => {
    const userId = req.params.id;

    if (req.user.role === "admin" || req.user.id == userId) {
        next();
    } else {
        return res.status(403).json({
            message: 'Unauthorized access',
            status: 'error'
        });

    }
};

const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next(); // Tiếp tục xử lý nếu người dùng là admin
    } else {
        return res.status(403).json({
            message: 'Access denied. Admin rights required.',
            status: 'error'
        });
    }
};

export default {
    authenticateToken,
    checkAdminOrSelf,
    checkAdmin
}

