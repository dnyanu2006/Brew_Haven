import { Router } from 'express';
import {
  getInventory,
  restockItem,
  addInventoryItem,
} from '../controllers/inventoryController.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', requireAuth, requireRole(['admin', 'staff', 'kitchen']), getInventory);
router.post('/restock/:id', requireAuth, requireRole(['admin', 'staff', 'kitchen']), restockItem);
router.post('/', requireAuth, requireRole(['admin']), addInventoryItem);

export default router;
