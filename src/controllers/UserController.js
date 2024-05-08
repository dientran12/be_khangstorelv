import JwtService from '../service/JwtService.js';
import UserService from '../service/UserService.js';

const createUsers = async (req, res) => {
    try {
        const { password, email } = req.body;
        if (!password || !email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, password, and confirmPassword are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        const response = await UserService.createNewUser(req.body);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred on the server'
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("email, password", email, password);
        const reg = /^[^\s@]+@(?:[^\s@]+\.)+[a-zA-Z]{2,}$/;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'The input is required'
            });
        } else if (!reg.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        const response = await UserService.loginUser(req.body);
        const { refreshToken, ...newResponse } = response;

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Only send the cookie over HTTPS in production
            sameSite: 'strict'
        });

        return res.status(200).json(newResponse);
    } catch (e) {
        console.error(e); // Use console.error to log the error for better visibility
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};


const getOneUser = async (req, res) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "The userId is required"
            })
        }
        const response = await UserService.getOneUser(userId)
        return res.status(200).json(response)
    } catch (e) {
        console.log('hdhd', e)
        return res.status(404).json({
            message: e
        })
    }
}

const updateUser = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy ID từ thông tin người dùng trong token
        const { phone, address, image } = req.body;
        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "User ID is required."
            });
        }
        let updateData = { ...req.body };
        if (phone !== undefined) {
            if (!phone.trim()) {
                return res.status(400).json({
                    status: "error",
                    message: "Phone number cannot be empty."
                });
            }
            updateData.phone = phone;
        }

        if (address !== undefined) {
            if (!address.trim()) {
                return res.status(400).json({
                    status: "error",
                    message: "Address cannot be empty."
                });
            }
            updateData.address = address;
        }
        const response = await UserService.updateUser(userId, updateData);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: "error",
            message: "An error occurred during the update process."
        });
    }
}


const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        console.log(`refresh token: ${token}`)
        if (!token) {
            return res.status(400).json({
                status: "error",
                message: "Refresh token is required."
            });
        }
        const response = await JwtService.refreshTokenService(token);
        if (response.status === "OK") {
            return res.status(200).json(response);
        } else {
            return res.status(400).json({
                status: "error",
                message: "Failed to refresh token."
            });
        }
    } catch (e) {
        return res.status(500).json({
            status: "error",
            message: "An error occurred while refreshing the token."
        });
    }
};



const getAllUsers = async (req, res) => {
    try {
        const { limit, page } = req.query;
        const response = await UserService.getAllUsers(parseInt(limit), parseInt(page));
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: "Failed to retrieve users."
        });
    }
}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(404).json({
                status: "error",
                message: "The userId is required"
            })
        }
        const response = await UserService.deleteUser(userId)
        return res.status(200).json(response)
    } catch (e) {
        console.log(e)
        return res.status(404).json({
            message: "con cac"
        })
    }
}

const getUserInfo = async (req, res) => {
    try {
        const userId = req.user.id; // ID được lấy từ token đã xác thực
        if (!userId) {
            // Kiểm tra xem userId có tồn tại trong request không
            return res.status(400).json({
                status: "error",
                message: "User ID is missing from the token."
            });
        }

        const user = await UserService.getOneUser(userId);
        if (!user) {
            // Kiểm tra xem có tìm thấy người dùng trong cơ sở dữ liệu hay không
            return res.status(404).json({
                status: "error",
                message: "User not found."
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Error retrieving user info:', error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred while fetching user information."
        });
    }
};

const logoutUser = (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        next();
    }
    // Xử lý thêm để đánh dấu refreshToken là không hợp lệ trong cơ sở dữ liệu ở đây (nếu cần)

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,  // Sử dụng nếu trang của bạn chạy trên HTTPS
        sameSite: 'strict'  // Sử dụng để giúp bảo vệ chống lại CSRF
    });

    return res.status(200).json({
        status: 'OK',
        message: 'Logout successfully'
    });
}

const addCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productVersionSizeId, quantity } = req.body; // Đổi từ productId sang productVersionSizeId

        if (!userId || !productVersionSizeId || !quantity) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID, product version size ID, and quantity are required'
            });
        }

        const response = await UserService.addToCart(userId, productVersionSizeId, quantity);
        if (response.status === 'error') {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred on the server'
        });
    }
}
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }
        const response = await UserService.getCart(userId);
        if (response.status === 'error') {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred on the server'
        });
    }

}

const removeCartItem = async (req, res) => {
    try {
        const cartItemId = req.params.cartItemId;
        if (!cartItemId) {
            return res.status(400).json({
                status: 'error',
                message: 'Product version size ID are required'
            });
        }
        const response = await UserService.removeCartItem(cartItemId);
        if (response.status === 'error') {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred on the server'
        });
    }
}

const getTotalUser = async (req, res) => {
    try {
        const response = await UserService.getTotalUser();
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: "Failed to retrieve users."
        });
    }
}

export default {
    createUsers, loginUser, getOneUser, refreshToken, getAllUsers, deleteUser, updateUser, getUserInfo, logoutUser, addCart, getCart, removeCartItem, getTotalUser
};
