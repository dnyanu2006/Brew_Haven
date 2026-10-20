import { Router } from 'express';
import {
  getCategories,
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/categories', getCategories);
router.get('/items', getMenuItems);
router.get('/items/:idOrSlug', getMenuItem);

// Admin / staff endpoints
router.post('/items', requireAuth, requireRole(['admin', 'staff']), createMenuItem);
router.put('/items/:id', requireAuth, requireRole(['admin', 'staff']), updateMenuItem);
router.delete('/items/:id', requireAuth, requireRole(['admin']), deleteMenuItem);

export default router;
