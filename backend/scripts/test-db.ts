import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { maskMongoUri, fixMongoUri, DB_NAME } from '../config/db.ts';
import { UserModel } from '../models/User.ts';
import { MenuItemModel } from '../models/MenuItem.ts';
import { OrderModel } from '../models/Order.ts';
import { ReservationModel } from '../models/Reservation.ts';
import { CategoryModel } from '../models/Category.ts';
import { TableModel } from '../models/Table.ts';

// Load .env if present, otherwise try .env.example
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.example') });
} else {
  dotenv.config();
}

// Temporary schema for testing persistent write operations
const VerificationSchema = new Schema(
  {
    probeId: { type: String, required: true },
    source: { type: String, default: 'Brew Haven Verification Tool' },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'db_verifications' }
);

const VerificationModel =
  mongoose.models.DbVerification || mongoose.model('DbVerification', VerificationSchema);

async function runDatabaseVerification() {
  console.log('===========================================================');
  console.log('☕ Brew Haven Cafe - MongoDB Atlas Cluster0 Verification');
  console.log('===========================================================\n');

  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    console.warn('⚠️  MONGODB_URI is not set in environment or .env file.');
    console.log('\n📝 How to configure your connection:');
    console.log('1. Open your MongoDB Atlas dashboard (https://cloud.mongodb.com).');
    console.log('2. Navigate to Clusters -> Cluster0 -> Connect -> Drivers.');
    console.log('3. Copy your connection string and add it to your .env file:');
    console.log('   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/brewhaven?retryWrites=true&w=majority"\n');
    process.exit(1);
  }

  if (
    rawUri.includes('<username>') ||
    rawUri.includes('<password>') ||
    rawUri.includes('<db_username>') ||
    rawUri.includes('<your_username>') ||
    rawUri.includes('<atlas_username>')
  ) {
    console.warn('⚠️  MONGODB_URI still contains placeholder values (<username> / <password> / <db_username>).');
    console.log('💡 Please edit your .env file with your actual Atlas Database User credentials from MongoDB Atlas -> Database Access.\n');
    process.exit(1);
  }

  const cleanUri = fixMongoUri(rawUri);
  const clusterHost = cleanUri.match(/@([^/?#]+)/)?.[1] || 'Cluster0';
  console.log(`📡 Cluster Target: ${clusterHost}`);
  console.log(`📦 Configured Database: "${DB_NAME}"`);

  const startTime = Date.now();

  try {
    await mongoose.connect(cleanUri, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 10000,
    });

    const connectLatency = Date.now() - startTime;
    console.log(`✅ Successfully connected in ${connectLatency}ms without exposing credentials!`);

    // 1. Ping test
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      console.log('🟢 Cluster0 Ping Test: SUCCESS (Cluster is active and accepting queries)');
    }

    console.log(`🌐 Host: ${mongoose.connection.host || 'Cluster0'}`);
    console.log(`📁 Active Database: ${mongoose.connection.name || DB_NAME}\n`);

    // 2. Persistent Write & Read Verification
    console.log('🧪 Testing Persistent Write & Read on Atlas...');
    const testProbeId = `probe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const writeStart = Date.now();
    const probeDoc = await VerificationModel.create({
      probeId: testProbeId,
      source: 'Brew Haven Automated Verification',
      timestamp: new Date(),
    });
    const writeLatency = Date.now() - writeStart;
    console.log(`   • Write test doc: OK (${writeLatency}ms) - probeId: ${testProbeId}`);

    // Verify Read
    const readDoc = await VerificationModel.findOne({ probeId: testProbeId });
    if (!readDoc) {
      throw new Error('Verification probe document could not be read back from Atlas.');
    }
    console.log('   • Read verification: OK (Confirmed document persistence in Atlas)');

    // Clean up test probe
    await VerificationModel.deleteOne({ probeId: testProbeId });
    console.log('   • Cleanup probe doc: OK\n');

    // 3. Collection Count Summary
    console.log('📊 Current Collection Record Counts in "brewhaven":');
    const [userCount, menuCount, orderCount, resCount, catCount, tableCount] =
      await Promise.all([
        UserModel.countDocuments().catch(() => 0),
        MenuItemModel.countDocuments().catch(() => 0),
        OrderModel.countDocuments().catch(() => 0),
        ReservationModel.countDocuments().catch(() => 0),
        CategoryModel.countDocuments().catch(() => 0),
        TableModel.countDocuments().catch(() => 0),
      ]);

    console.log(`   • users:         ${userCount} registered accounts (customer, staff, admin)`);
    console.log(`   • menuitems:     ${menuCount} gourmet menu items`);
    console.log(`   • categories:    ${catCount} menu categories`);
    console.log(`   • orders:        ${orderCount} orders`);
    console.log(`   • reservations:  ${resCount} table reservations`);
    console.log(`   • tables:        ${tableCount} cafe tables`);

    console.log('\n===========================================================');
    console.log('🎉 ATLAS DATA EXPLORER VERIFICATION INSTRUCTIONS');
    console.log('===========================================================');
    console.log('To view these live documents in MongoDB Atlas:');
    console.log('1. Log in to https://cloud.mongodb.com');
    console.log('2. Click "Database" in the left navigation sidebar under "Deployments".');
    console.log('3. In Cluster0, click the "Browse Collections" button.');
    console.log(`4. Locate the "${DB_NAME}" database in the collections tree.`);
    console.log('5. Click on any collection (e.g. "users", "orders", "reservations", "menuitems")');
    console.log('   to inspect real-time documents, JSON structures, and indices.');
    console.log('===========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    const sanitized = maskMongoUri(err?.message || String(err));
    console.error('❌ Connection or verification failed:', sanitized);
    console.log('\nTroubleshooting Checklist:');
    console.log('• Verify your Network Access IP Whitelist allows your current IP or 0.0.0.0/0.');
    console.log('• Check that the database user exists in Database Access and has readWrite permissions.');
    console.log('• Verify password special characters are URL-encoded if applicable.');
    process.exit(1);
  }
}

runDatabaseVerification();
