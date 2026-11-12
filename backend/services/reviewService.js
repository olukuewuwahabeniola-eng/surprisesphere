import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review, {
  REVIEW_RESTORABLE_STATUSES,
  REVIEW_STATUS,
} from '../models/Review.js';
import { AppError } from '../utils/AppError.js';
import { buildPagination, readPagination } from '../utils/pagination.js';
import { requireDb } from '../utils/requireDb.js';
import {
  mapAdminReview,
  mapPublicReview,
  mapRatingSummary,
} from '../utils/reviewMapper.js';
import {
  buildAdminReviewFilters,
  buildCustomerReviewInput,
  normalizeDisplayName,
} from '../utils/reviewPayload.js';

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function buildSubmitterKey(req) {
  const ip = String(
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.ip ||
      req.socket?.remoteAddress ||
      '',
  ).trim();
  const agent = String(req.headers['user-agent'] || '').trim();
  return crypto.createHash('sha256').update(`${ip}|${agent}`).digest('hex');
}

async function requireExistingProduct(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Choose a valid product to review.', 400);
  }

  const product = await Product.findById(productId).select('_id name slug active').lean();
  if (!product) {
    throw new AppError('That product was not found.', 404);
  }
  if (product.active === false) {
    throw new AppError('That product is not available for reviews.', 404);
  }
  return product;
}

async function findReviewOrThrow(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Review not found.', 404);
  }
  const review = await Review.findById(id);
  if (!review) {
    throw new AppError('Review not found.', 404);
  }
  return review;
}

export async function getApprovedRatingSummary(productId) {
  const [row] = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: REVIEW_STATUS.APPROVED,
      },
    },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  return mapRatingSummary({
    average: row?.average || 0,
    count: row?.count || 0,
  });
}

export async function submitCustomerReview(req) {
  requireDb();
  const input = buildCustomerReviewInput(req.body || {});
  await requireExistingProduct(input.product);

  const submitterKey = buildSubmitterKey(req);
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const normalizedName = normalizeDisplayName(input.displayName).toLowerCase();

  const duplicate = await Review.findOne({
    product: input.product,
    submittedAt: { $gte: since },
    $or: [
      { submitterKey },
      {
        displayName: new RegExp(
          `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i',
        ),
      },
    ],
  })
    .select('_id')
    .lean();

  if (duplicate) {
    throw new AppError(
      'A review for this product was already submitted recently. Please wait before trying again.',
      429,
    );
  }

  const review = await Review.create({
    ...input,
    submitterKey,
  });

  return {
    message: 'Thank you. Your review was submitted and is pending approval.',
    review: {
      id: String(review._id),
      productId: String(review.product),
      displayName: review.displayName,
      rating: review.rating,
      body: review.body || '',
      status: review.status,
      submittedAt: review.submittedAt,
    },
  };
}

export async function listPublicProductReviews(productIdOrSlug, query = {}) {
  requireDb();

  const product = await Product.findOne(
    mongoose.Types.ObjectId.isValid(productIdOrSlug)
      ? { $or: [{ _id: productIdOrSlug }, { slug: String(productIdOrSlug).toLowerCase() }] }
      : { slug: String(productIdOrSlug).toLowerCase() },
  )
    .select('_id name slug active')
    .lean();

  if (!product || product.active === false) {
    throw new AppError('That product was not found.', 404);
  }

  const { page, pageSize, skip } = readPagination(query);
  const filter = {
    product: product._id,
    status: REVIEW_STATUS.APPROVED,
  };

  const [total, docs, summary] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(pageSize).lean(),
    getApprovedRatingSummary(product._id),
  ]);

  return {
    product: {
      id: String(product._id),
      name: product.name,
      slug: product.slug,
    },
    summary,
    reviews: docs.map(mapPublicReview).filter(Boolean),
    pagination: buildPagination({ page, pageSize, total }),
  };
}

export async function listAdminReviews(query = {}) {
  requireDb();
  const filters = buildAdminReviewFilters(query);
  const { page, pageSize, skip } = readPagination(query);

  const [total, docs] = await Promise.all([
    Review.countDocuments(filters),
    Review.find(filters)
      .populate('product', 'name slug')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ]);

  return {
    reviews: docs.map(mapAdminReview),
    pagination: buildPagination({ page, pageSize, total }),
  };
}

export async function getAdminReview(id) {
  requireDb();
  const review = await Review.findById(id).populate('product', 'name slug').lean();
  if (!review) {
    throw new AppError('Review not found.', 404);
  }
  return { review: mapAdminReview(review) };
}

async function transitionReview(id, { from, to, errorMessage }) {
  requireDb();
  const review = await findReviewOrThrow(id);

  const allowedFrom = Array.isArray(from) ? from : [from];
  if (!allowedFrom.includes(review.status)) {
    throw new AppError(errorMessage, 409);
  }

  review.status = to;
  review.moderatedAt = new Date();
  await review.save();
  await review.populate('product', 'name slug');

  return {
    message: `Review marked as ${to}.`,
    review: mapAdminReview(review),
  };
}

export async function approveReview(id) {
  return transitionReview(id, {
    from: REVIEW_STATUS.PENDING,
    to: REVIEW_STATUS.APPROVED,
    errorMessage: 'Only pending reviews can be approved.',
  });
}

export async function rejectReview(id) {
  return transitionReview(id, {
    from: REVIEW_STATUS.PENDING,
    to: REVIEW_STATUS.REJECTED,
    errorMessage: 'Only pending reviews can be rejected.',
  });
}

export async function blockReview(id) {
  return transitionReview(id, {
    from: [REVIEW_STATUS.PENDING, REVIEW_STATUS.APPROVED, REVIEW_STATUS.UNPUBLISHED],
    to: REVIEW_STATUS.BLOCKED,
    errorMessage: 'That review cannot be blocked from its current status.',
  });
}

export async function unpublishReview(id) {
  return transitionReview(id, {
    from: REVIEW_STATUS.APPROVED,
    to: REVIEW_STATUS.UNPUBLISHED,
    errorMessage: 'Only approved reviews can be unpublished.',
  });
}

export async function restoreReview(id) {
  return transitionReview(id, {
    from: REVIEW_RESTORABLE_STATUSES,
    to: REVIEW_STATUS.PENDING,
    errorMessage: 'Only rejected, blocked or unpublished reviews can be restored to pending.',
  });
}

export async function deleteReview(id) {
  requireDb();
  const review = await findReviewOrThrow(id);
  const mapped = mapAdminReview(review);
  await review.deleteOne();
  return {
    message: 'Review permanently deleted.',
    review: mapped,
  };
}
