import { Router } from 'express';
import {
  getBestSellers,
  getFeaturedProducts,
  getNewArrivals,
  getProduct,
  getProducts,
  validateProduct,
} from '../controllers/productController.js';
import { listProductReviewsHandler } from '../controllers/reviewController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getProducts));
router.get('/best-sellers', asyncHandler(getBestSellers));
router.get('/new-arrivals', asyncHandler(getNewArrivals));
router.get('/featured', asyncHandler(getFeaturedProducts));
router.post('/validate', asyncHandler(validateProduct));
router.get('/:idOrSlug/reviews', asyncHandler(listProductReviewsHandler));
router.get('/:idOrSlug', asyncHandler(getProduct));

export default router;
