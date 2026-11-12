import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadProductImages } from '../services/uploadService.js';
import { AppError } from '../utils/AppError.js';

export async function uploadAdminImagesHandler(req, res) {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.',
      503,
    );
  }

  const files = Array.isArray(req.files) ? req.files : [];
  const images = await uploadProductImages(files);

  res.status(201).json({
    message: images.length === 1 ? 'Image uploaded.' : `${images.length} images uploaded.`,
    images: images.map((image) => ({
      url: image.url,
      alt: image.alt || '',
    })),
  });
}
