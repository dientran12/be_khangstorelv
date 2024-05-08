import jwt from "jsonwebtoken"
require('dotenv').config()

const generateAccessToken = async (payload) => {
    const accessToken = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET, // Sử dụng ACCESS_TOKEN_SECRET thay cho ACCESS_TOKEN
        { expiresIn: '3d' }
    );
    return accessToken;
}

const generateRefreshToken = async (payload) => {
    const refreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET, // Sử dụng REFRESH_TOKEN_SECRET thay cho REFRESH_TOKEN
        { expiresIn: '365d' }
    );
    return refreshToken;
}

const refreshTokenService = async (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET, // Sử dụng REFRESH_TOKEN_SECRET
            async (err, user) => {
                if (err) {
                    reject({
                        status: 'error',
                        message: 'Invalid refresh token'
                    });
                } else {
                    const accessToken = await generateAccessToken({
                        id: user.id,
                        role: user.role
                    });
                    resolve({
                        status: 'OK',
                        message: 'SUCCESS',
                        accessToken
                    });
                }
            }
        );
    });
}

export default {
    generateAccessToken, generateRefreshToken, refreshTokenService
}
