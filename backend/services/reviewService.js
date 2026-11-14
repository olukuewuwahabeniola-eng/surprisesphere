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

function emptyDistribution() {
  return {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };
}

export async function getApprovedRatingSummary(productId) {
  const objectId = new mongoose.Types.ObjectId(productId);
  const [row] = await Review.aggregate([
    {
      $match: {
        product: objectId,
        status: REVIEW_STATUS.APPROVED,
      },
    },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
        one: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        two: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        four: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        five: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  const summary = mapRatingSummary({
    average: row?.average || 0,
    count: row?.count || 0,
  });

  return {
    ...summary,
    distribution: {
      5: row?.five || 0,
      4: row?.four || 0,
      3: row?.three || 0,
      2: row?.two || 0,
      1: row?.one || 0,
    },
  };
}

export async function getApprovedRatingsByProductIds(productIds = []) {
  const ids = [...new Set(productIds.map((id) => String(id || '').trim()).filter(Boolean))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (ids.length === 0) {
    return new Map();
  }

  const rows = await Review.aggregate([
    {
      $match: {
        product: { $in: ids },
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

  const map = new Map();
  rows.forEach((row) => {
    map.set(String(row._id), mapRatingSummary({ average: row.average, count: row.count }));
  });
  return map;
}

export async function attachRatingsToProducts(products = []) {
  const list = Array.isArray(products) ? products.filter(Boolean) : [];
  if (list.length === 0) {
    return list;
  }

  const ratings = await getApprovedRatingsByProductIds(list.map((product) => product.id));
  return list.map((product) => {
    const summary = ratings.get(String(product.id)) || mapRatingSummary({ average: 0, count: 0 });
    return {
      ...product,
      ratingAverage: summary.count > 0 ? summary.average : 0,
      ratingCount: summary.count,
      rating: summary.count > 0 ? summary : { average: 0, count: 0 },
    };
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
    summary: {
      ...summary,
      distribution: summary.distribution || emptyDistribution(),
    },
    reviews: docs.map(mapPublicReview).filter(Boolean),
    pagination: buildPagination({ page, pageSize, total }),
  };
}

export async function listAdminReviews(query = {}) {
  requireDb();
  const filters = buildAdminReviewFilters(query);
  const { page, pageSize, skip } = readPagination(query);

  const search = String(query.q || query.search || '').trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingProducts = await Product.find({ name: { $regex: escaped, $options: 'i' } })
      .select('_id')
      .limit(50)
      .lean();
    const productIds = matchingProducts.map((product) => product._id);
    if (productIds.length) {
      const nameOrBody = filters.$or || [];
      filters.$or = [...nameOrBody, { product: { $in: productIds } }];
    }
  }

  const [total, docs, statusCounts] = await Promise.all([
    Review.countDocuments(filters),
    Review.find(filters)
      .populate('product', 'name slug images image')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Review.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const counts = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    blocked: 0,
    unpublished: 0,
  };
  statusCounts.forEach((row) => {
    const key = row._id;
    const value = row.count || 0;
    counts.total += value;
    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] = value;
    }
  });

  return {
    reviews: docs.map(mapAdminReview),
    pagination: buildPagination({ page, pageSize, total }),
    counts,
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
  const result = await transitionReview(id, {
    from: REVIEW_STATUS.PENDING,
    to: REVIEW_STATUS.APPROVED,
    errorMessage: 'Only pending reviews can be approved.',
  });

  try {
    const { recordStoreActivity } = await import('./analyticsService.js');
    await recordStoreActivity({
      type: 'review_approved',
      productId: result.review?.productId || result.review?.product?.id,
      productName: result.review?.displayName || 'Customer review',
      path: '/admin/reviews',
      meta: { reviewId: result.review?.id },
    });
  } catch {
    // Activity logging must not block moderation.
  }

  return result;
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
