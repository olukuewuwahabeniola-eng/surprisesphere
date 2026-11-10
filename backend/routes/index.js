import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createEnquiry } from '../controllers/enquiryController.js';
import {
  getBanners,
  getFeaturedHomepageCategories,
  getFeaturedHomepageProducts,
  getHealth,
  getHomepage,
} from '../controllers/homepageController.js';
import { subscribe } from '../controllers/newsletterController.js';
import {
  getBestSellers,
  getNewArrivals,
  getProducts,
  getProductsByCategory,
} from '../controllers/productController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import categoryRoutes from './categories.js';
import productRoutes from './products.js';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait and try again.' },
});

router.get('/health', getHealth);

router.get('/homepage', asyncHandler(getHomepage));
router.get('/homepage/banners', asyncHandler(getBanners));
router.get('/homepage/featured-products', asyncHandler(getFeaturedHomepageProducts));
router.get('/homepage/featured-categories', asyncHandler(getFeaturedHomepageCategories));

// Prefer /api/products/* going forward. Keep aliases used by the current frontend.
router.get('/collections/best-sellers', asyncHandler(getBestSellers));
router.get('/collections/new-arrivals', asyncHandler(getNewArrivals));
router.get('/shop', asyncHandler(getProducts));
router.get('/shop/:slug', asyncHandler(getProductsByCategory));

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);

router.post('/newsletter', writeLimiter, asyncHandler(subscribe));
router.post('/enquiries', writeLimiter, asyncHandler(createEnquiry));

export default router;
