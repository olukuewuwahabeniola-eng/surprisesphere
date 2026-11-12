import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/AppError.js';

let configured = false;

export function isCloudinaryConfigured() {
  return Boolean(
    String(process.env.CLOUDINARY_CLOUD_NAME || '').trim() &&
      String(process.env.CLOUDINARY_API_KEY || '').trim() &&
      String(process.env.CLOUDINARY_API_SECRET || '').trim(),
  );
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.',
      503,
    );
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME).trim(),
      api_key: String(process.env.CLOUDINARY_API_KEY).trim(),
      api_secret: String(process.env.CLOUDINARY_API_SECRET).trim(),
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}
