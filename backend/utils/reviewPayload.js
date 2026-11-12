import mongoose from 'mongoose';
import { REVIEW_STATUS, REVIEW_STATUS_VALUES } from '../models/Review.js';
import { AppError } from './AppError.js';

export function normalizeDisplayName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

export function normalizeReviewBody(value) {
  if (value == null || value === '') {
    return '';
  }
  return String(value).trim().replace(/\s+/g, ' ').slice(0, 2000);
}

export function parseRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }
  return rating;
}

export function parseProductId(value) {
  const id = String(value || '').trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return id;
}

export function parseReviewStatus(value) {
  const status = String(value || '')
    .trim()
    .toLowerCase();
  if (!status) {
    return null;
  }
  if (!REVIEW_STATUS_VALUES.includes(status)) {
    return null;
  }
  return status;
}

/**
 * Customer submission payload. Status is always forced to pending.
 * Any client-supplied status/moderation fields are ignored.
 */
export function buildCustomerReviewInput(body = {}) {
  const productId = parseProductId(body.productId ?? body.product);
  const displayName = normalizeDisplayName(body.displayName ?? body.name);
  const rating = parseRating(body.rating);
  const reviewBody = normalizeReviewBody(body.body ?? body.review ?? body.writtenReview);

  if (!productId) {
    throw new AppError('Choose a valid product to review.', 400);
  }
  if (!displayName || displayName.length < 2) {
    throw new AppError('Enter a display name of at least 2 characters.', 400);
  }
  if (rating == null) {
    throw new AppError('Choose a star rating from 1 to 5.', 400);
  }

  return {
    product: productId,
    displayName,
    rating,
    body: reviewBody,
    status: REVIEW_STATUS.PENDING,
    submittedAt: new Date(),
  };
}

export function buildAdminReviewFilters(query = {}) {
  const filters = {};

  const productId = parseProductId(query.productId ?? query.product);
  if (query.productId || query.product) {
    if (!productId) {
      throw new AppError('Filter product must be a valid product id.', 400);
    }
    filters.product = productId;
  }

  const rating = query.rating == null || query.rating === '' ? null : parseRating(query.rating);
  if (query.rating != null && query.rating !== '') {
    if (rating == null) {
      throw new AppError('Filter rating must be a whole number from 1 to 5.', 400);
    }
    filters.rating = rating;
  }

  const status = parseReviewStatus(query.status);
  if (query.status) {
    if (!status) {
      throw new AppError(
        `Filter status must be one of: ${REVIEW_STATUS_VALUES.join(', ')}.`,
        400,
      );
    }
    filters.status = status;
  }

  return filters;
}
