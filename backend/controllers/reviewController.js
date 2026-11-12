import {
  listPublicProductReviews,
  submitCustomerReview,
} from '../services/reviewService.js';
import { listPublicReviewPhotos } from '../services/reviewPhotoService.js';

export async function submitReviewHandler(req, res) {
  const result = await submitCustomerReview(req);
  res.status(201).json(result);
}

export async function listProductReviewsHandler(req, res) {
  const result = await listPublicProductReviews(req.params.idOrSlug, req.query);
  res.json(result);
}

export async function listReviewPhotosHandler(req, res) {
  const result = await listPublicReviewPhotos(req.query);
  res.json(result);
}
