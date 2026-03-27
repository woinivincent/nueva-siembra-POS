"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectProductImage = selectProductImage;
exports.saveProductImage = saveProductImage;
exports.deleteProductImage = deleteProductImage;
exports.getImageAsBase64 = getImageAsBase64;
// electron/services/image.service.ts
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const IMAGES_DIR = 'product-images';
function getImagesPath() {
    const userDataPath = electron_1.app.getPath('userData');
    const imagesPath = path_1.default.join(userDataPath, IMAGES_DIR);
    // Crear directorio si no existe
    if (!fs_1.default.existsSync(imagesPath)) {
        fs_1.default.mkdirSync(imagesPath, { recursive: true });
    }
    return imagesPath;
}
async function selectProductImage() {
    const { filePaths, canceled } = await electron_1.dialog.showOpenDialog({
        title: 'Seleccionar imagen del producto',
        filters: [
            { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
        ],
        properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) {
        return null;
    }
    return filePaths[0];
}
function saveProductImage(sourcePath) {
    const imagesPath = getImagesPath();
    const ext = path_1.default.extname(sourcePath);
    const hash = crypto_1.default.randomBytes(8).toString('hex');
    const fileName = `product_${hash}${ext}`;
    const destPath = path_1.default.join(imagesPath, fileName);
    // Copiar imagen
    fs_1.default.copyFileSync(sourcePath, destPath);
    return destPath;
}
function deleteProductImage(imagePath) {
    try {
        if (imagePath && fs_1.default.existsSync(imagePath)) {
            fs_1.default.unlinkSync(imagePath);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Error deleting image:', error);
        return false;
    }
}
function getImageAsBase64(imagePath) {
    try {
        if (!imagePath || !fs_1.default.existsSync(imagePath)) {
            return null;
        }
        const ext = path_1.default.extname(imagePath).toLowerCase().replace('.', '');
        const mimeType = ext === 'jpg' ? 'jpeg' : ext;
        const imageBuffer = fs_1.default.readFileSync(imagePath);
        const base64 = imageBuffer.toString('base64');
        return `data:image/${mimeType};base64,${base64}`;
    }
    catch (error) {
        console.error('Error reading image:', error);
        return null;
    }
}
