import { Router } from 'express';
import {
  approveReviewHandler,
  blockReviewHandler,
  deleteReviewHandler,
  getAdminReviewHandler,
  listAdminReviewsHandler,
  rejectReviewHandler,
  restoreReviewHandler,
  unpublishReviewHandler,
} from '../controllers/adminReviewController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAdmin);

router.get('/', asyncHandler(listAdminReviewsHandler));
router.get('/:id', asyncHandler(getAdminReviewHandler));
router.patch('/:id/approve', asyncHandler(approveReviewHandler));
router.patch('/:id/reject', asyncHandler(rejectReviewHandler));
router.patch('/:id/block', asyncHandler(blockReviewHandler));
router.patch('/:id/unpublish', asyncHandler(unpublishReviewHandler));
router.patch('/:id/restore', asyncHandler(restoreReviewHandler));
router.delete('/:id', asyncHandler(deleteReviewHandler));

export default router;
