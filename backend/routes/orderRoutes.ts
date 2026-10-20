import { Router } from 'express';
import {
  createOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus,
} from '../controllers/orderController.ts';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

router.post('/', requireAuth, createOrder);
router.get('/my-orders', requireAuth, getUserOrders);
router.get('/:idOrNumber', optionalAuth, getOrder);
router.put('/:id/status', requireAuth, requireRole(['admin', 'staff', 'kitchen']), updateOrderStatus);

export default router;
