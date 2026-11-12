import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ReviewPhoto from '../models/ReviewPhoto.js';
import { AppError } from '../utils/AppError.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { buildPagination, readPagination } from '../utils/pagination.js';
import { requireDb } from '../utils/requireDb.js';
import {
  mapAdminReviewPhoto,
  mapPublicReviewPhoto,
} from '../utils/reviewMapper.js';
import {
  buildReviewPhotoCreateFields,
  buildReviewPhotoPatch,
  parseCaption,
  parseOptionalProductId,
  parseOrderedIds,
  parsePlacement,
  parsePublishedFlag,
} from '../utils/reviewPhotoPayload.js';
import { uploadReviewPhotoImages } from './uploadService.js';

async function assertOptionalProduct(productId) {
  if (!productId) {
    return null;
  }
  const product = await Product.findById(productId).select('_id name slug active').lean();
  if (!product) {
    throw new AppError('That product was not found.', 404);
  }
  return product;
}

async function findPhotoOrThrow(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Review photo not found.', 404);
  }
  const photo = await ReviewPhoto.findById(id);
  if (!photo) {
    throw new AppError('Review photo not found.', 404);
  }
  return photo;
}

export async function listPublicReviewPhotos(query = {}) {
  requireDb();

  const filters = { published: true };
  if (query.placement) {
    filters.placement = parsePlacement(query.placement, { required: true });
  }

  if (Object.prototype.hasOwnProperty.call(query, 'productId') || Object.prototype.hasOwnProperty.call(query, 'product')) {
    const productId = parseOptionalProductId(query.productId ?? query.product);
    if (productId) {
      filters.product = productId;
    } else if (query.general === 'true' || query.productId === '' || query.product === '') {
      filters.product = null;
    }
  }

  const { page, pageSize, skip } = readPagination(query);
  const [total, docs] = await Promise.all([
    ReviewPhoto.countDocuments(filters),
    ReviewPhoto.find(filters)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ]);

  return {
    photos: docs.map(mapPublicReviewPhoto).filter(Boolean),
    pagination: buildPagination({ page, pageSize, total }),
  };
}

export async function listAdminReviewPhotos(query = {}) {
  requireDb();
  const filters = {};

  if (query.placement) {
    filters.placement = parsePlacement(query.placement, { required: true });
  }
  if (query.published != null && query.published !== '') {
    filters.published = parsePublishedFlag(query.published);
  }
  if (
    Object.prototype.hasOwnProperty.call(query, 'productId') ||
    Object.prototype.hasOwnProperty.call(query, 'product')
  ) {
    filters.product = parseOptionalProductId(query.productId ?? query.product);
  }

  const { page, pageSize, skip } = readPagination(query);
  const [total, docs] = await Promise.all([
    ReviewPhoto.countDocuments(filters),
    ReviewPhoto.find(filters)
      .populate('product', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ]);

  return {
    photos: docs.map(mapAdminReviewPhoto),
    pagination: buildPagination({ page, pageSize, total }),
  };
}

export async function createAdminReviewPhotos(req) {
  requireDb();

  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.',
      503,
    );
  }

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) {
    throw new AppError('Choose at least one review picture to upload.', 400);
  }

  const body = req.body || {};
  const sharedProductId = parseOptionalProductId(body.productId ?? body.product);
  await assertOptionalProduct(sharedProductId);

  const uploaded = await uploadReviewPhotoImages(files);
  const captions = Array.isArray(body.captions)
    ? body.captions
    : typeof body.caption === 'string'
      ? files.map(() => body.caption)
      : [];

  const baseSort = Number.isFinite(Number(body.sortOrder))
    ? Math.trunc(Number(body.sortOrder))
    : (await ReviewPhoto.countDocuments()) + 1;

  const docs = [];
  for (let index = 0; index < uploaded.length; index += 1) {
    const fields = buildReviewPhotoCreateFields(
      {
        ...body,
        productId: sharedProductId,
        caption: parseCaption(captions[index] ?? body.caption ?? ''),
        sortOrder: baseSort + index,
      },
      uploaded[index],
    );
    // eslint-disable-next-line no-await-in-loop
    const created = await ReviewPhoto.create(fields);
    docs.push(created);
  }

  const populated = await ReviewPhoto.find({ _id: { $in: docs.map((doc) => doc._id) } })
    .populate('product', 'name slug')
    .sort({ sortOrder: 1 })
    .lean();

  return {
    message:
      populated.length === 1
        ? 'Review picture uploaded.'
        : `${populated.length} review pictures uploaded.`,
    photos: populated.map(mapAdminReviewPhoto),
  };
}

export async function updateAdminReviewPhoto(id, body = {}) {
  requireDb();
  const photo = await findPhotoOrThrow(id);
  const patch = buildReviewPhotoPatch(body);

  if (Object.prototype.hasOwnProperty.call(patch, 'product')) {
    await assertOptionalProduct(patch.product);
  }

  Object.assign(photo, patch);
  await photo.save();
  await photo.populate('product', 'name slug');

  return {
    message: 'Review picture updated.',
    photo: mapAdminReviewPhoto(photo),
  };
}

export async function publishAdminReviewPhoto(id) {
  return updateAdminReviewPhoto(id, { published: true });
}

export async function unpublishAdminReviewPhoto(id) {
  return updateAdminReviewPhoto(id, { published: false });
}

export async function reorderAdminReviewPhotos(body = {}) {
  requireDb();
  const orderedIds = parseOrderedIds(body);

  const existing = await ReviewPhoto.find({ _id: { $in: orderedIds } }).select('_id').lean();
  if (existing.length !== orderedIds.length) {
    throw new AppError('One or more review photo ids were not found.', 404);
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      ReviewPhoto.updateOne({ _id: id }, { $set: { sortOrder: index + 1 } }),
    ),
  );

  const photos = await ReviewPhoto.find({ _id: { $in: orderedIds } })
    .populate('product', 'name slug')
    .sort({ sortOrder: 1 })
    .lean();

  return {
    message: 'Review pictures reordered.',
    photos: photos.map(mapAdminReviewPhoto),
  };
}

export async function deleteAdminReviewPhoto(id) {
  requireDb();
  const photo = await findPhotoOrThrow(id);
  const mapped = mapAdminReviewPhoto(photo);
  await photo.deleteOne();
  return {
    message: 'Review picture deleted.',
    photo: mapped,
  };
}
