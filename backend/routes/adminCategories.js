import { Router } from 'express';
import {
  createAdminCategoryHandler,
  deleteAdminCategoryHandler,
  getAdminCategoryHandler,
  listAdminCategoriesHandler,
  reorderAdminCategoriesHandler,
  updateAdminCategoryHandler,
} from '../controllers/adminCategoryController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAdmin);

router.get('/', asyncHandler(listAdminCategoriesHandler));
router.post('/', asyncHandler(createAdminCategoryHandler));
router.put('/reorder', asyncHandler(reorderAdminCategoriesHandler));
router.patch('/reorder', asyncHandler(reorderAdminCategoriesHandler));
router.get('/:idOrSlug', asyncHandler(getAdminCategoryHandler));
router.put('/:idOrSlug', asyncHandler(updateAdminCategoryHandler));
router.patch('/:idOrSlug', asyncHandler(updateAdminCategoryHandler));
router.delete('/:idOrSlug', asyncHandler(deleteAdminCategoryHandler));

export default router;
