import {
  approveReview,
  blockReview,
  deleteReview,
  getAdminReview,
  listAdminReviews,
  rejectReview,
  restoreReview,
  unpublishReview,
} from '../services/reviewService.js';

export async function listAdminReviewsHandler(req, res) {
  const result = await listAdminReviews(req.query);
  res.json(result);
}

export async function getAdminReviewHandler(req, res) {
  const result = await getAdminReview(req.params.id);
  res.json(result);
}

export async function approveReviewHandler(req, res) {
  const result = await approveReview(req.params.id);
  res.json(result);
}

export async function rejectReviewHandler(req, res) {
  const result = await rejectReview(req.params.id);
  res.json(result);
}

export async function blockReviewHandler(req, res) {
  const result = await blockReview(req.params.id);
  res.json(result);
}

export async function unpublishReviewHandler(req, res) {
  const result = await unpublishReview(req.params.id);
  res.json(result);
}

export async function restoreReviewHandler(req, res) {
  const result = await restoreReview(req.params.id);
  res.json(result);
}

export async function deleteReviewHandler(req, res) {
  const result = await deleteReview(req.params.id);
  res.json(result);
}
