import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminOrders,
  patchAdminOrder,
} from '../controllers/analyticsController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAdmin);

router.get('/dashboard', asyncHandler(getAdminDashboard));
router.get('/orders', asyncHandler(getAdminOrders));
router.patch('/orders/:id', asyncHandler(patchAdminOrder));

export default router;
