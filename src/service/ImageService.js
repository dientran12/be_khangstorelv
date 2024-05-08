const fs = require('fs');
const path = require('path');
const db = require('../models/index'); // Đảm bảo đường dẫn này đúng với cấu trúc project của bạn

const uploadDir = path.join(__dirname, '../public/uploads'); // Thư mục để lưu ảnh

// Hàm kiểm tra và tạo thư mục nếu chưa tồn tại
const ensureUploadDirExists = () => {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
};

// Hàm lưu ảnh
const saveImage = async (base64Data, objectType, objectId, transaction) => {
    ensureUploadDirExists();

    // Loại bỏ phần header của chuỗi base64
    const base64WithoutHeader = base64Data.split(';base64,').pop();

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
    const filePath = path.join(uploadDir, filename);

    // Giải mã Base64 và lưu file
    fs.writeFileSync(filePath, Buffer.from(base64WithoutHeader, 'base64'));

    // Lưu thông tin ảnh vào CSDL
    const imageUrl = `/uploads/${filename}`;
    await db.Image.create({
        objectId,
        objectType,
        imageUrl,
    }, { transaction }); // Sử dụng transaction ở đây

    return imageUrl;
};

const addNewImages = async (base64Images, objectId, objectType, transaction) => {
    for (const base64Data of base64Images) {
        await saveImage(base64Data, objectType, objectId, transaction);
    }
};


const updateImage = async (base64Data, objectId, objectType, imageId) => {
    ensureUploadDirExists();

    const image = await db.Image.findByPk(imageId);
    if (!image || image.objectId !== objectId || image.objectType !== objectType) {
        throw new Error('Image not found or mismatched ownership.');
    }

    // Xóa file ảnh cũ nếu tồn tại
    const oldFilePath = path.join(__dirname, '../public', image.imageUrl);
    if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
    }

    // Lưu ảnh mới và cập nhật bản ghi
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
    const newFilePath = path.join(uploadDir, filename);
    fs.writeFileSync(newFilePath, Buffer.from(base64Data, 'base64'));

    const newImageUrl = `/uploads/${filename}`;
    await image.update({ imageUrl: newImageUrl });

    return newImageUrl;
};

const getImage = async (imageId) => {
    const image = await db.Image.findByPk(imageId);
    if (!image) {
        throw new Error('Image not found.');
    }
    return path.join(__dirname, '../public', image.imageUrl);
};

const getAllImages = async (objectId, objectType) => {
    const images = await db.Image.findAll({
        where: { objectId, objectType },
        attributes: ['id', 'imageUrl'], // Lấy ID và URL của ảnh, bạn có thể điều chỉnh các trường cần lấy
    });

    // Trả về một mảng các đường dẫn ảnh
    return images.map(image => path.join(__dirname, '../public', image.imageUrl));
};

const deleteImage = async (imageId) => {
    let transaction;

    try {
        // Bắt đầu một transaction
        transaction = await db.sequelize.transaction();

        const image = await db.Image.findByPk(imageId, { transaction });
        if (!image) {
            throw new Error('Image not found.');
        }

        const filePath = path.join(__dirname, '../public', image.imageUrl);

        // Xóa file ảnh từ hệ thống file nếu nó tồn tại
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Xóa bản ghi ảnh từ CSDL
        await image.destroy({ transaction });

        // Hoàn thành transaction
        await transaction.commit();

        return { success: true, message: 'Image deleted successfully.' };
    } catch (error) {
        // Nếu có lỗi, rollback transaction
        if (transaction) await transaction.rollback();

        console.error(error);
        return { success: false, message: 'Failed to delete image.', error: error.message };
    }
};

const deleteImagesByObjectId = async (objectId, objectType, transaction) => {
    const images = await db.Image.findAll({
        where: { objectId, objectType },
        transaction
    });

    // Sử dụng một mảng để lưu trữ các đường dẫn của file trước khi xóa
    const filesToDelete = [];

    for (const image of images) {
        const filePath = path.join(__dirname, '../public', image.imageUrl);
        filesToDelete.push(filePath); // Thêm filePath vào mảng
        await image.destroy({ transaction }); // Xóa bản ghi hình ảnh trong CSDL
    }

    // Nếu không có lỗi khi xóa bản ghi, xóa file trên hệ thống file
    for (const filePath of filesToDelete) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

// Hàm xóa tất cả hình ảnh của một đối tượng
const deleteImagesNotInList = async (currentImageUrls, newImageUrls, transaction) => {
    // Tìm các imageUrl không còn trong mảng mới
    const imagesToDelete = currentImageUrls.filter(url => !newImageUrls.includes(url));

    for (const imageUrl of imagesToDelete) {
        // Lấy id từ imageUrl
        const image = await db.Image.findOne({
            where: { imageUrl },
            transaction
        });

        if (image) {
            // Xóa hình ảnh khỏi file system
            const filePath = path.join(__dirname, '../public', image.imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Xóa bản ghi hình ảnh khỏi CSDL
            await image.destroy({ transaction });
        }
    }
};

// Hàm sao chép và lưu ảnh mới
const copyImage = async (existingImagePath, objectType, objectId, transaction) => {
    ensureUploadDirExists();

    try {
        const originalPath = path.join(__dirname, '../public', existingImagePath);
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
        const newFilePath = path.join(uploadDir, filename);

        // Sao chép file ảnh từ vị trí cũ sang vị trí mới
        fs.copyFileSync(originalPath, newFilePath);

        // Lưu thông tin ảnh vào CSDL
        const imageUrl = `/uploads/${filename}`;
        await db.Image.create({
            objectId,
            objectType,
            imageUrl,
        }, { transaction });

        return imageUrl;
    } catch (error) {
        console.error('Error copying image:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
};




module.exports = {
    saveImage,
    copyImage,
    updateImage,
    getImage,
    getAllImages,
    deleteImage,
    deleteImagesNotInList,
    deleteImagesByObjectId,
    addNewImages,
};