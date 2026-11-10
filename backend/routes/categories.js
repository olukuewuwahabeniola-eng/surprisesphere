import { Router } from 'express';
import {
  getCategories,
  getCategory,
  getCategoryProducts,
  validateCategory,
} from '../controllers/categoryController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getCategories));
router.post('/validate', asyncHandler(validateCategory));
router.get('/:slugOrId', asyncHandler(getCategory));
router.get('/:slugOrId/products', asyncHandler(getCategoryProducts));

export default router;
