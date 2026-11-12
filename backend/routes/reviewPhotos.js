import { Router } from 'express';
import { listReviewPhotosHandler } from '../controllers/reviewController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(listReviewPhotosHandler));

export default router;
