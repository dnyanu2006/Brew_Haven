import { Router } from 'express';
import authRoutes from './authRoutes.ts';
import menuRoutes from './menuRoutes.ts';
import orderRoutes from './orderRoutes.ts';
import reservationRoutes from './reservationRoutes.ts';
import reviewRoutes from './reviewRoutes.ts';
import couponRoutes from './couponRoutes.ts';
import inventoryRoutes from './inventoryRoutes.ts';
import adminRoutes from './adminRoutes.ts';
import aiRoutes from './aiRoutes.ts';
import { dbStatus, DB_NAME } from '../config/db.ts';
import mongoose, { Schema } from 'mongoose';
import { UserModel } from '../models/User.ts';
import { MenuItemModel } from '../models/MenuItem.ts';
import { OrderModel } from '../models/Order.ts';
import { ReservationModel } from '../models/Reservation.ts';
import { CategoryModel } from '../models/Category.ts';
import { TableModel } from '../models/Table.ts';

const router = Router();

// Schema for live persistence probe verification
const ApiProbeSchema = new Schema(
  {
    probeId: { type: String, required: true },
    testedAt: { type: Date, default: Date.now },
  },
  { collection: 'db_verifications' }
);
const ApiProbeModel =
  mongoose.models.ApiProbe || mongoose.model('ApiProbe', ApiProbeSchema);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    cafe: 'Brew Haven',
    timestamp: new Date().toISOString(),
    database: {
      connected: mongoose.connection.readyState === 1,
      databaseName: DB_NAME,
      clusterHost: mongoose.connection.host || dbStatus.host || 'Cluster0',
      type: mongoose.connection.readyState === 1 ? 'mongodb_atlas' : 'disconnected',
    },
  });
});

/**
 * Safe test endpoint to verify MongoDB Atlas connection without exposing credentials
 * Accessible via GET /api/test-db
 */
router.get('/test-db', async (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  let pingSuccess = false;
  let collectionCounts: Record<string, number> = {};

  if (isConnected && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping();
      pingSuccess = true;

      const [users, menuItems, orders, reservations, categories, tables] =
        await Promise.all([
          UserModel.countDocuments().catch(() => 0),
          MenuItemModel.countDocuments().catch(() => 0),
          OrderModel.countDocuments().catch(() => 0),
          ReservationModel.countDocuments().catch(() => 0),
          CategoryModel.countDocuments().catch(() => 0),
          TableModel.countDocuments().catch(() => 0),
        ]);

      collectionCounts = {
        users,
        menuItems,
        orders,
        reservations,
        categories,
        tables,
      };
    } catch {
      pingSuccess = false;
    }
  }

  res.json({
    success: true,
    connected: isConnected,
    databaseName: DB_NAME,
    clusterHost: mongoose.connection.host || dbStatus.host || 'Cluster0',
    connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ping: pingSuccess ? 'PONG (Cluster0 Active)' : 'unavailable',
    collections: collectionCounts,
    instructions: {
      atlasDataExplorer: `View in Atlas -> Deployments -> Database -> Cluster0 -> Browse Collections -> ${DB_NAME}`,
    },
  });
});

/**
 * Safe write-and-read persistence probe endpoint
 * Accessible via POST /api/test-db/verify
 */
router.post('/test-db/verify', async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not currently connected. Check MONGODB_URI in .env',
      database: DB_NAME,
    });
    return;
  }

  try {
    const probeId = `probe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startTime = Date.now();

    // 1. Write probe
    await ApiProbeModel.create({ probeId, testedAt: new Date() });

    // 2. Read back
    const found = await ApiProbeModel.findOne({ probeId });
    if (!found) {
      throw new Error('Could not read written test record back from MongoDB Atlas');
    }

    // 3. Clean up probe
    await ApiProbeModel.deleteOne({ probeId });
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      verified: true,
      message: 'Persistent write & read verified on MongoDB Atlas Cluster0!',
      database: DB_NAME,
      collectionTested: 'db_verifications',
      roundtripLatencyMs: latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Verification probe failed',
    });
  }
});

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/reservations', reservationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);

export default router;
