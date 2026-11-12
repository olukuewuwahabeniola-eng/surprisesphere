import { Router } from 'express';
import {
  createAdminProductHandler,
  deleteAdminProductHandler,
  getAdminProductHandler,
  listAdminProductsHandler,
  updateAdminProductHandler,
} from '../controllers/adminProductController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAdmin);

router.get('/', asyncHandler(listAdminProductsHandler));
router.post('/', asyncHandler(createAdminProductHandler));
router.get('/:idOrSlug', asyncHandler(getAdminProductHandler));
router.put('/:idOrSlug', asyncHandler(updateAdminProductHandler));
router.patch('/:idOrSlug', asyncHandler(updateAdminProductHandler));
router.delete('/:idOrSlug', asyncHandler(deleteAdminProductHandler));

export default router;
