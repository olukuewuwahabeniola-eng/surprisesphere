import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { postAnalyticsEvent, postWhatsAppOrderEnquiry } from '../controllers/analyticsController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many analytics requests. Please wait and try again.' },
  validate: { xForwardedForHeader: false },
});

router.post('/events', analyticsLimiter, asyncHandler(postAnalyticsEvent));
router.post('/whatsapp-orders', analyticsLimiter, asyncHandler(postWhatsAppOrderEnquiry));

export default router;
