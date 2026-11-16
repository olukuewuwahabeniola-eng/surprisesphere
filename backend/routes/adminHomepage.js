import { Router } from 'express';
import {
  getAdminHomepageHandler,
  getHeroImageLibraryHandler,
  putAdminHeroSlidesHandler,
} from '../controllers/adminHomepageController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAdmin);

router.get('/', asyncHandler(getAdminHomepageHandler));
router.get('/image-library', asyncHandler(getHeroImageLibraryHandler));
router.put('/hero-slides', asyncHandler(putAdminHeroSlidesHandler));

export default router;
