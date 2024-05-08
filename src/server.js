const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
import initWebRouter from './routes/web.js'
import connectDB from './config/connectDB.js'
import cookieParser from 'cookie-parser';
import path from 'path';
require('dotenv').config();

const app = express();

const corsOptions = {
    methods: 'GET,POST,PUT,DELETE',
    credentials: true, // Cho phép gửi cookie qua CORS
    origin: (origin, callback) => {
        const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL]; // Các nguồn được phép
        if (!origin) return callback(null, true); // Cho phép các request không có origin như Postman, curl, etc.
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed for this origin'));
        }
    }
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// Định nghĩa các route ở đây

connectDB()
initWebRouter(app)

const port = process.env.PORT || 8888;
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
