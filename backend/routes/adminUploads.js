import { Router } from 'express';
import { uploadAdminImagesHandler } from '../controllers/adminUploadController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { runProductImageUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(requireAdmin);

router.post('/images', runProductImageUpload, asyncHandler(uploadAdminImagesHandler));

export default router;
