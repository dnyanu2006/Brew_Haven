import { Router } from 'express';
import {
  getItemReviews,
  getAllReviews,
  createReview,
  moderateReview,
} from '../controllers/reviewController.ts';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/item/:menuItemId', getItemReviews);
router.get('/all', requireAuth, requireRole(['admin', 'staff']), getAllReviews);
router.post('/', optionalAuth, createReview);
router.put('/:id/moderate', requireAuth, requireRole(['admin']), moderateReview);

export default router;
