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
import { getStore, putStore } from '../controllers/storeController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import adminAnalyticsRoutes from './adminAnalytics.js';
import adminCategoryRoutes from './adminCategories.js';
import adminProductRoutes from './adminProducts.js';
import adminReviewPhotoRoutes from './adminReviewPhotos.js';
import adminReviewRoutes from './adminReviews.js';
import adminUploadRoutes from './adminUploads.js';
import analyticsRoutes from './analytics.js';
import categoryRoutes from './categories.js';
import productRoutes from './products.js';
import reviewPhotoRoutes from './reviewPhotos.js';
import reviewRoutes from './reviews.js';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait and try again.' },
});

const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin attempts. Please wait and try again.' },
});

const adminCatalogLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin catalogue requests. Please wait and try again.' },
});

router.get('/health', getHealth);
router.get('/store', asyncHandler(getStore));
router.put('/admin/store', adminLimiter, requireAdmin, asyncHandler(putStore));
router.use('/admin/products', adminCatalogLimiter, adminProductRoutes);
router.use('/admin/categories', adminCatalogLimiter, adminCategoryRoutes);
router.use('/admin/uploads', adminCatalogLimiter, adminUploadRoutes);
router.use('/admin/reviews', adminCatalogLimiter, adminReviewRoutes);
router.use('/admin/review-photos', adminCatalogLimiter, adminReviewPhotoRoutes);
router.use('/admin/analytics', adminCatalogLimiter, adminAnalyticsRoutes);

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
router.use('/reviews', reviewRoutes);
router.use('/review-photos', reviewPhotoRoutes);
router.use('/analytics', analyticsRoutes);

router.post('/newsletter', writeLimiter, asyncHandler(subscribe));
router.post('/enquiries', writeLimiter, asyncHandler(createEnquiry));

export default router;
