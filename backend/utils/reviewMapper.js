import { REVIEW_STATUS } from '../models/Review.js';

function asObject(doc) {
  if (!doc) {
    return null;
  }
  return typeof doc.toObject === 'function' ? doc.toObject({ virtuals: false }) : doc;
}

export function mapPublicReview(doc) {
  const review = asObject(doc);
  if (!review || review.status !== REVIEW_STATUS.APPROVED) {
    return null;
  }

  return {
    id: String(review._id || review.id),
    productId: String(review.product?._id || review.product || ''),
    displayName: review.displayName,
    rating: review.rating,
    body: review.body || '',
    submittedAt: review.submittedAt || review.createdAt || null,
  };
}

export function mapAdminReview(doc) {
  const review = asObject(doc);
  if (!review) {
    return null;
  }

  const product =
    review.product && typeof review.product === 'object'
      ? {
          id: String(review.product._id || review.product.id || ''),
          name: review.product.name || '',
          slug: review.product.slug || '',
        }
      : {
          id: String(review.product || ''),
          name: '',
          slug: '',
        };

  return {
    id: String(review._id || review.id),
    productId: product.id,
    product,
    displayName: review.displayName,
    rating: review.rating,
    body: review.body || '',
    status: review.status,
    submittedAt: review.submittedAt || review.createdAt || null,
    moderatedAt: review.moderatedAt || null,
    createdAt: review.createdAt || null,
    updatedAt: review.updatedAt || null,
  };
}

export function mapPublicReviewPhoto(doc) {
  const photo = asObject(doc);
  if (!photo || photo.published !== true) {
    return null;
  }

  return {
    id: String(photo._id || photo.id),
    url: photo.image?.url || '',
    caption: photo.caption || '',
    productId: photo.product ? String(photo.product._id || photo.product) : null,
    placement: photo.placement,
    sortOrder: photo.sortOrder ?? 0,
  };
}

export function mapAdminReviewPhoto(doc) {
  const photo = asObject(doc);
  if (!photo) {
    return null;
  }

  const product =
    photo.product && typeof photo.product === 'object'
      ? {
          id: String(photo.product._id || photo.product.id || ''),
          name: photo.product.name || '',
          slug: photo.product.slug || '',
        }
      : photo.product
        ? { id: String(photo.product), name: '', slug: '' }
        : null;

  return {
    id: String(photo._id || photo.id),
    url: photo.image?.url || '',
    publicId: photo.image?.publicId || '',
    caption: photo.caption || '',
    productId: product?.id || null,
    product,
    placement: photo.placement,
    sortOrder: photo.sortOrder ?? 0,
    published: Boolean(photo.published),
    publishedAt: photo.publishedAt || null,
    createdAt: photo.createdAt || null,
    updatedAt: photo.updatedAt || null,
  };
}

export function mapRatingSummary({ average = 0, count = 0 } = {}) {
  const safeCount = Number(count) || 0;
  const safeAverage = safeCount > 0 ? Number(average) || 0 : 0;
  return {
    average: Math.round(safeAverage * 10) / 10,
    count: safeCount,
  };
}
