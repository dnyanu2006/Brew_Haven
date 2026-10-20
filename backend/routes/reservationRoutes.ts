import { Router } from 'express';
import {
  getTables,
  checkAvailability,
  createReservation,
  getUserReservations,
  cancelReservation,
} from '../controllers/reservationController.ts';
import { optionalAuth, requireAuth } from '../middleware/auth.ts';

const router = Router();

router.get('/tables', getTables);
router.get('/check-availability', checkAvailability);
router.post('/', optionalAuth, createReservation);
router.get('/my-reservations', requireAuth, getUserReservations);
router.put('/:idOrCode/cancel', optionalAuth, cancelReservation);

export default router;
