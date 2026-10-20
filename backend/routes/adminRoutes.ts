import { Router } from 'express';
import {
  getDashboardStats,
  getAllOrders,
  getAllReservations,
  updateReservationStatus,
  getDbStatus,
  connectMongoAtlas,
} from '../controllers/adminController.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

// Stats and orders
router.get('/stats', requireAuth, requireRole(['admin', 'staff', 'kitchen']), getDashboardStats);
router.get('/orders', requireAuth, requireRole(['admin', 'staff', 'kitchen']), getAllOrders);
router.get('/reservations', requireAuth, requireRole(['admin', 'staff']), getAllReservations);
router.put('/reservations/:id/status', requireAuth, requireRole(['admin', 'staff']), updateReservationStatus);

// Database management
router.get('/db-status', requireAuth, requireRole(['admin']), getDbStatus);
router.post('/connect-db', requireAuth, requireRole(['admin']), connectMongoAtlas);

export default router;
