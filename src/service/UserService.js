const bcrypt = require('bcryptjs');
const db = require('../models/index')
// const JwtService = require('../service/JwtService.js')
import JwtService from '../service/JwtService.js';
import ImageService from '../service/ImageService.js';

const salt = bcrypt.genSaltSync(10);
const createNewUser = async (data) => {
    try {
        const { email, role = 'user', password, name: incomingName } = data;

        const checkUser = await db.User.findOne({ where: { email } });
        if (checkUser) {
            return {
                status: 'error',
                message: 'User has existed',
            };
        }

        let name = incomingName || email.split('@')[0];
        if (!incomingName) {
            let checkUsername = await db.User.findOne({ where: { name } });
            while (checkUsername) {
                const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                name = `${name}${randomDigits}`;
                checkUsername = await db.User.findOne({ where: { name } });
            }
        }

        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await db.User.create({
            name,
            password: hashedPassword,
            email,
            role,
        });

        return {
            status: 'OK',
            message: newUser ? 'Account created successfully.' : 'Something went wrong.',
            data: newUser,
        };
    } catch (e) {
        throw e; // hoặc xử lý lỗi theo cách bạn muốn
    }
};

const loginUser = async (data) => {
    try {
        const { email, password } = data;
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            return { status: 'error', message: 'User not found' };
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return { status: 'error', message: 'Incorrect password' };
        }

        // Lấy ảnh đại diện của người dùng (giả sử mỗi user chỉ có một ảnh)
        const userProfileImage = await db.Image.findOne({
            where: {
                objectId: user.id,
                objectType: 'User'
            },
            attributes: ['imageUrl']
        });

        // Lấy URL của ảnh đại diện, nếu ảnh không tồn tại, sẽ trả về null
        const imageUrl = userProfileImage ? userProfileImage.imageUrl : null;

        const accessToken = await JwtService.generateAccessToken({ id: user.id, role: user.role });
        const refreshToken = await JwtService.generateRefreshToken({ id: user.id, role: user.role });

        // Loại bỏ password trước khi gửi dữ liệu người dùng
        const { password: pw, role, ...userData } = user.get({ plain: true });
        return {
            status: 'OK',
            message: 'Successfully logged in',
            user: {
                ...userData,
                image: imageUrl // Trường image chứa URL của ảnh đại diện
            },
            accessToken,
            refreshToken
        };
    } catch (e) {
        console.error(e);
        throw new Error('Error logging in the user');
    }
};

const updateUser = async (id, data) => {
    const transaction = await db.sequelize.transaction();
    try {
        const user = await db.User.findByPk(id, { transaction });
        if (!user) {
            await transaction.rollback();
            return {
                status: 'error',
                message: 'User not found',
            };
        }

        // Kiểm tra và xóa hình ảnh cũ của người dùng nếu có
        if (data.image) {
            await ImageService.deleteImagesByObjectId(user.id, 'User', transaction);

            // Lưu hình ảnh mới và cập nhật URL trong CSDL
            const imageUrl = await ImageService.saveImage(data.image, 'User', user.id, transaction);
            data.image = imageUrl; // Cập nhật đường dẫn ảnh mới vào dữ liệu cập nhật
        }

        // Cập nhật thông tin người dùng và chỉ commit sau khi mọi thứ đã thành công
        const updatedUser = await user.update(data, { transaction });

        // Xác nhận mọi thứ đều ổn, sau đó commit
        await transaction.commit();

        // Lấy thông tin người dùng cùng với hình ảnh
        const userWithImage = await db.User.findByPk(updatedUser.id, {
            include: [{
                model: db.Image,
                as: 'Image',
                attributes: ['imageUrl']
            }]
        });

        // Chuẩn bị đối tượng kết quả mà không có mật khẩu và không có đối tượng Image
        const { password, Image, ...userRes } = userWithImage.toJSON();

        // Gán 'imageUrl' vào 'userRes'
        userRes.image = Image ? Image.imageUrl : null;

        return {
            status: 'OK',
            message: 'Update user successfully',
            data: userRes,
        };

    } catch (e) {
        // Rollback chỉ khi chưa commit
        if (transaction.finished !== 'commit') {
            await transaction.rollback();
        }

        console.error(e);
        throw new Error('Failed to update user.');
    }
};


const getOneUser = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await db.User.findByPk(id, {
                include: [
                    {
                        model: db.Image,
                        as: 'Image', // Tên liên kết quan hệ
                        attributes: ['imageUrl']
                    }
                ]
            })
            if (!user) {
                resolve({
                    status: 'error',
                    message: 'The user is not defined',
                })
            }

            const image = user.Image ? user.Image.imageUrl : null;
            const { password, Image, ...userRes } = user.toJSON(); // Xóa password và mảng Image không cần thiết
            userRes.image = image;
            // Thêm imageUrl vào userRes
            resolve({
                status: 'OK',
                message: 'Get details user SUCCESSFULLY',
                data: userRes
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getAllUsers = async (limit = 10, page = 1) => {
    try {
        const offset = (page - 1) * limit;
        const { count: totalUsers, rows: userRes } = await db.User.findAndCountAll({
            include: [{
                model: db.Image,
                as: 'Image',
                attributes: ['imageUrl']
            }],
            limit,
            offset
        });

        const totalPages = Math.ceil(totalUsers / limit);
        const currentPage = page;

        // Chuyển đổi dữ liệu trả về
        const users = userRes.map(user => ({
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            phone: user.phone,
            address: user.address,
            image: user.Image ? user.Image.imageUrl : null
        }));

        return {
            status: 'OK',
            message: 'Get All Users Successfully',
            data: {
                users,
                totalPages,
                currentPage,
                totalUsers
            },
        };
    } catch (error) {
        throw new Error('Failed to get users.');
    }
}


const deleteUser = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {

            const user = await db.User.findByPk(id)

            if (!user) {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined',
                })
            }
            const deletedUser = await user.destroy();

            resolve({
                status: 'OK',
                message: `Delete user SUCCESSFULLY`
            })
        } catch (e) {
            reject(e)
        }
    })
}

const addToCart = async (userId, productVersionSizeId, quantity) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user) {
            return {
                status: 'error',
                message: 'User not found'
            };
        }
        const productVersionSize = await db.ProductVersionSize.findByPk(productVersionSizeId);
        if (!productVersionSize) {
            return {
                status: 'error',
                message: 'Product version size not found'
            };
        }
        const existingCartItem = await db.CartItem.findOne({
            where: {
                userId: userId,
                productVersionSizeId: productVersionSizeId
            }
        });
        if (existingCartItem) {
            // Item exists in cart, so update the quantity
            existingCartItem.quantity += quantity;
            await existingCartItem.save();
        } else {
            // Item does not exist, so add a new entry
            await db.CartItem.create({
                userId: userId,
                productVersionSizeId: productVersionSizeId,
                quantity: quantity
            });
        }
        return {
            status: 'OK',
            message: 'Item added to cart successfully'
        };
    } catch (e) {
        console.error(e);
        return {
            status: 'error',
            message: 'Failed to add to cart'
        };
    }
}

const getCart = async (userId) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user) {
            return {
                status: 'error',
                message: 'User not found'
            };
        }
        const cartItems = await db.CartItem.findAll({
            where: { userId: userId },
            attributes: ['userId', 'quantity', 'id'], // Chỉ lấy userId và quantity của CartItem
            include: [{
                model: db.ProductVersionSize,
                as: 'productVersionSize',
                attributes: ['size', 'quantity', 'id'], // Chỉ lấy size và quantity của ProductVersionSize
                include: [{
                    model: db.ProductVersion,
                    as: 'productVersion',
                    attributes: ['id', 'style'], // Chỉ lấy id và style của ProductVersion
                    include: [{
                        model: db.Product,
                        as: 'product',
                        attributes: ['id', 'name', 'price'] // Chỉ lấy id và name của Product
                    }, {
                        model: db.Image,
                        as: 'Images',
                        attributes: ['imageUrl'] // Chỉ lấy imageUrl của Image
                    }]
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        return {
            status: 'OK',
            message: 'Get cart items successfully',
            data: cartItems.map(item => ({
                userId: item.userId,
                cartItemId: item.id,
                price: item.productVersionSize.productVersion.product.price,
                quantity: item.quantity,
                productVersionSizeId: item.productVersionSize.id,
                size: item.productVersionSize.size,
                sizeQuantity: item.productVersionSize.quantity,
                productVersionId: item.productVersionSize.productVersion.id,
                style: item.productVersionSize.productVersion.style,
                productId: item.productVersionSize.productVersion.product.id,
                productName: item.productVersionSize.productVersion.product.name,
                images: item.productVersionSize.productVersion.Images.map(image => image.imageUrl)
            }))
        };
    } catch (e) {
        console.error(e);
        return {
            status: 'error',
            message: 'Failed to get cart items'
        };
    }
};

const removeCartItem = async (cartItemId) => {
    try {
        // Xóa mục giỏ hàng trực tiếp dựa trên cartItemId
        const result = await db.CartItem.destroy({
            where: {
                id: cartItemId  // Sử dụng ID mục giỏ hàng làm điều kiện để xóa
            }
        });

        // Kiểm tra kết quả để xác nhận việc xóa
        if (result === 0) {
            return {
                status: 'error',
                message: 'Cart item not found or already deleted'
            };
        }

        return {
            status: 'OK',
            message: 'Cart item removed successfully'
        };
    } catch (e) {
        console.error(e);
        return {
            status: 'error',
            message: 'Failed to remove cart item'
        };
    }
};

const getTotalUser = async () => {
    try {
        const totalUsers = await db.User.count();
        return {
            status: 'OK',
            message: 'Get total user successfully',
            totalUsers: totalUsers
        };
    } catch (e) {
        console.error(e);
        return {
            status: 'error',
            message: 'Failed to get total user'
        };
    }
};



export default {
    createNewUser, loginUser, getOneUser, getAllUsers, deleteUser, updateUser, addToCart, getCart, removeCartItem, getTotalUser
};
