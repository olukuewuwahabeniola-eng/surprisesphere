import { getCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';

const PRODUCT_FOLDER = 'surprise-fashion-sphere/products';
const REVIEW_PHOTO_FOLDER = 'surprise-fashion-sphere/review-photos';

function uploadBufferToCloudinary(file, folder) {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
}

async function uploadImageFiles(files = [], folder) {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.',
      503,
    );
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError('Choose at least one image file to upload.', 400);
  }

  const uploaded = [];

  for (const file of files) {
    try {
      // Sequential uploads keep Cloudinary rate usage predictable for admin use.
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadBufferToCloudinary(file, folder);
      uploaded.push({
        url: result.secure_url || result.url,
        alt: '',
        publicId: result.public_id || '',
        width: result.width || null,
        height: result.height || null,
        format: result.format || '',
        bytes: result.bytes || file.size || null,
      });
    } catch (error) {
      throw new AppError(
        error?.message
          ? `Cloudinary upload failed: ${error.message}`
          : 'Cloudinary upload failed. Please try again.',
        502,
      );
    }
  }

  return uploaded;
}

export async function uploadProductImages(files = []) {
  return uploadImageFiles(files, PRODUCT_FOLDER);
}

export async function uploadReviewPhotoImages(files = []) {
  return uploadImageFiles(files, REVIEW_PHOTO_FOLDER);
}
