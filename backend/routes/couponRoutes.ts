import { Router } from 'express';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  toggleCoupon,
} from '../controllers/couponController.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

router.post('/validate', validateCoupon);
router.get('/', requireAuth, requireRole(['admin', 'staff']), getCoupons);
router.post('/', requireAuth, requireRole(['admin']), createCoupon);
router.put('/:id/toggle', requireAuth, requireRole(['admin']), toggleCoupon);

export default router;
