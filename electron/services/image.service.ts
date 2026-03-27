// electron/services/image.service.ts
import { app, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IMAGES_DIR = 'product-images';

function getImagesPath(): string {
  const userDataPath = app.getPath('userData');
  const imagesPath = path.join(userDataPath, IMAGES_DIR);
  
  // Crear directorio si no existe
  if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
  }
  
  return imagesPath;
}

export async function selectProductImage(): Promise<string | null> {
  const { filePaths, canceled } = await dialog.showOpenDialog({
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

export function saveProductImage(sourcePath: string): string {
  const imagesPath = getImagesPath();
  const ext = path.extname(sourcePath);
  const hash = crypto.randomBytes(8).toString('hex');
  const fileName = `product_${hash}${ext}`;
  const destPath = path.join(imagesPath, fileName);

  // Copiar imagen
  fs.copyFileSync(sourcePath, destPath);

  return destPath;
}

export function deleteProductImage(imagePath: string): boolean {
  try {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

export function getImageAsBase64(imagePath: string): string | null {
  try {
    if (!imagePath || !fs.existsSync(imagePath)) {
      return null;
    }
    
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    
    return `data:image/${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error reading image:', error);
    return null;
  }
}