import {
  createAdminReviewPhotos,
  deleteAdminReviewPhoto,
  listAdminReviewPhotos,
  publishAdminReviewPhoto,
  reorderAdminReviewPhotos,
  unpublishAdminReviewPhoto,
  updateAdminReviewPhoto,
} from '../services/reviewPhotoService.js';

export async function listAdminReviewPhotosHandler(req, res) {
  const result = await listAdminReviewPhotos(req.query);
  res.json(result);
}

export async function createAdminReviewPhotosHandler(req, res) {
  const result = await createAdminReviewPhotos(req);
  res.status(201).json(result);
}

export async function updateAdminReviewPhotoHandler(req, res) {
  const result = await updateAdminReviewPhoto(req.params.id, req.body || {});
  res.json(result);
}

export async function publishAdminReviewPhotoHandler(req, res) {
  const result = await publishAdminReviewPhoto(req.params.id);
  res.json(result);
}

export async function unpublishAdminReviewPhotoHandler(req, res) {
  const result = await unpublishAdminReviewPhoto(req.params.id);
  res.json(result);
}

export async function reorderAdminReviewPhotosHandler(req, res) {
  const result = await reorderAdminReviewPhotos(req.body || {});
  res.json(result);
}

export async function deleteAdminReviewPhotoHandler(req, res) {
  const result = await deleteAdminReviewPhoto(req.params.id);
  res.json(result);
}
