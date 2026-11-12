import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitReviewHandler } from '../controllers/reviewController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const reviewSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many review submissions. Please wait and try again.' },
});

router.post('/', reviewSubmitLimiter, asyncHandler(submitReviewHandler));

export default router;
