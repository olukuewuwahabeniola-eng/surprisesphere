import { Router } from 'express';
import {
  createAdminReviewPhotosHandler,
  deleteAdminReviewPhotoHandler,
  listAdminReviewPhotosHandler,
  publishAdminReviewPhotoHandler,
  reorderAdminReviewPhotosHandler,
  unpublishAdminReviewPhotoHandler,
  updateAdminReviewPhotoHandler,
} from '../controllers/adminReviewPhotoController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { runProductImageUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(requireAdmin);

router.get('/', asyncHandler(listAdminReviewPhotosHandler));
router.post('/', runProductImageUpload, asyncHandler(createAdminReviewPhotosHandler));
router.patch('/reorder', asyncHandler(reorderAdminReviewPhotosHandler));
router.patch('/:id/publish', asyncHandler(publishAdminReviewPhotoHandler));
router.patch('/:id/unpublish', asyncHandler(unpublishAdminReviewPhotoHandler));
router.patch('/:id', asyncHandler(updateAdminReviewPhotoHandler));
router.delete('/:id', asyncHandler(deleteAdminReviewPhotoHandler));

export default router;
