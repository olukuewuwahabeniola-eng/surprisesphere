import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 8;

const storage = multer.memoryStorage();

function fileFilter(_req, file, callback) {
  const mime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_TYPES.has(mime)) {
    callback(new AppError('Only JPG, JPEG, PNG and WebP images are allowed.', 400));
    return;
  }
  callback(null, true);
}

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter,
}).array('images', MAX_FILES);

export function runProductImageUpload(req, res, next) {
  productImageUpload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('Each image must be 5MB or smaller.', 400));
        return;
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new AppError('You can upload up to 8 images at a time.', 400));
        return;
      }
      next(new AppError(error.message || 'Image upload failed.', 400));
      return;
    }

    next(error);
  });
}
