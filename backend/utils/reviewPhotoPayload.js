import mongoose from 'mongoose';
import {
  REVIEW_PHOTO_PLACEMENT,
  REVIEW_PHOTO_PLACEMENT_VALUES,
} from '../models/ReviewPhoto.js';
import { AppError } from './AppError.js';

export function parseOptionalProductId(value) {
  if (value == null || value === '' || value === 'null' || value === 'general') {
    return null;
  }
  const id = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Associate the photo with a valid product, or leave it general.', 400);
  }
  return id;
}

export function parsePlacement(value, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new AppError(
        `Placement must be one of: ${REVIEW_PHOTO_PLACEMENT_VALUES.join(', ')}.`,
        400,
      );
    }
    return REVIEW_PHOTO_PLACEMENT.HOMEPAGE;
  }

  const placement = String(value).trim().toLowerCase();
  if (!REVIEW_PHOTO_PLACEMENT_VALUES.includes(placement)) {
    throw new AppError(
      `Placement must be one of: ${REVIEW_PHOTO_PLACEMENT_VALUES.join(', ')}.`,
      400,
    );
  }
  return placement;
}

export function parseCaption(value) {
  if (value == null) {
    return '';
  }
  return String(value).trim().slice(0, 280);
}

export function parsePublishedFlag(value, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'publish', 'published'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'unpublish', 'unpublished'].includes(normalized)) {
    return false;
  }
  throw new AppError('Published must be true or false.', 400);
}

export function parseSortOrder(value, fallback = 0) {
  if (value == null || value === '') {
    return fallback;
  }
  const order = Number(value);
  if (!Number.isFinite(order)) {
    throw new AppError('Sort order must be a number.', 400);
  }
  return Math.trunc(order);
}

export function buildReviewPhotoCreateFields(body = {}, uploadedImage) {
  if (!uploadedImage?.url) {
    throw new AppError('Each review photo needs an uploaded image URL.', 400);
  }

  const published = parsePublishedFlag(body.published, false);
  return {
    image: {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId || '',
      width: uploadedImage.width ?? null,
      height: uploadedImage.height ?? null,
      format: uploadedImage.format || '',
    },
    caption: parseCaption(body.caption),
    product: parseOptionalProductId(body.productId ?? body.product),
    placement: parsePlacement(body.placement),
    sortOrder: parseSortOrder(body.sortOrder, 0),
    published,
    publishedAt: published ? new Date() : null,
  };
}

export function buildReviewPhotoPatch(body = {}) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(body, 'caption')) {
    patch.caption = parseCaption(body.caption);
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'productId') ||
    Object.prototype.hasOwnProperty.call(body, 'product')
  ) {
    patch.product = parseOptionalProductId(body.productId ?? body.product);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'placement')) {
    patch.placement = parsePlacement(body.placement, { required: true });
  }
  if (Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
    patch.sortOrder = parseSortOrder(body.sortOrder);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'published')) {
    const published = parsePublishedFlag(body.published);
    patch.published = published;
    patch.publishedAt = published ? new Date() : null;
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError('No review photo fields to update.', 400);
  }

  return patch;
}

export function parseOrderedIds(value) {
  const list = Array.isArray(value) ? value : value?.orderedIds;
  if (!Array.isArray(list) || list.length === 0) {
    throw new AppError('Provide an ordered list of review photo ids.', 400);
  }

  const ids = list.map((entry) => String(entry || '').trim());
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new AppError('Every reorder id must be a valid review photo id.', 400);
  }
  if (new Set(ids).size !== ids.length) {
    throw new AppError('Reorder ids must be unique.', 400);
  }
  return ids;
}
