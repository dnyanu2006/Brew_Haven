import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env if present, otherwise try .env.example
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.example') });
} else {
  dotenv.config();
}

export const DB_NAME = 'brewhaven';

export interface IDbStatus {
  connected: boolean;
  type: 'mongodb_atlas' | 'local_mongoose' | 'fallback_store';
  databaseName: string;
  uriConfigured: boolean;
  maskedUri: string;
  host?: string;
  error?: string;
}

export function maskMongoUri(rawUri?: string): string {
  if (!rawUri) return '';
  // Mask password and username from standard MongoDB URI
  return rawUri
    .replace(/(mongodb(?:\+srv)?:\/\/)([^:@]+)(?::([^@]+))?@/gi, '$1***:***@')
    .replace(/(:)([^:@/]+)(@)/g, '$1***$3');
}

/**
 * Automatically fixes connection strings where passwords contain special characters like '@'
 * by properly URL-encoding the password between the first ':' and the last '@' before host.
 */
export function fixMongoUri(rawUri?: string): string {
  if (!rawUri) return '';
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)(.+)$/);
  if (!match) return rawUri;
  const prefix = match[1];
  const rest = match[2];
  const lastAt = rest.lastIndexOf('@');
  if (lastAt === -1) return rawUri;
  const creds = rest.substring(0, lastAt);
  const hostAndRest = rest.substring(lastAt + 1);
  const firstColon = creds.indexOf(':');
  if (firstColon === -1) return rawUri;
  const user = creds.substring(0, firstColon);
  const rawPass = creds.substring(firstColon + 1);
  try {
    const decoded = decodeURIComponent(rawPass);
    const encodedPass = encodeURIComponent(decoded);
    return `${prefix}${user}:${encodedPass}@${hostAndRest}`;
  } catch {
    return rawUri;
  }
}

export const dbStatus: IDbStatus = {
  connected: false,
  type: 'fallback_store',
  databaseName: DB_NAME,
  uriConfigured: Boolean(process.env.MONGODB_URI),
  maskedUri: maskMongoUri(process.env.MONGODB_URI),
};

export async function connectDB(uriOverride?: string): Promise<boolean> {
  const rawUri = uriOverride || process.env.MONGODB_URI;

  if (!rawUri) {
    console.warn('⚠️ MONGODB_URI not found in environment or .env.');
    console.warn(`💡 To connect MongoDB Atlas Cluster0, set MONGODB_URI with database name "${DB_NAME}".`);
    dbStatus.connected = false;
    dbStatus.type = 'fallback_store';
    dbStatus.uriConfigured = false;
    dbStatus.databaseName = DB_NAME;
    return false;
  }

  // Check for unfilled placeholder credentials
  if (
    rawUri.includes('<username>') ||
    rawUri.includes('<password>') ||
    rawUri.includes('<db_username>') ||
    rawUri.includes('<your_username>') ||
    rawUri.includes('<atlas_username>')
  ) {
    console.warn('⚠️ MONGODB_URI contains placeholder values (<username> / <password> / <db_username>).');
    console.warn('💡 Please replace them with your actual MongoDB Atlas database user credentials.');
    dbStatus.connected = false;
    dbStatus.type = 'fallback_store';
    dbStatus.uriConfigured = true;
    dbStatus.maskedUri = maskMongoUri(rawUri);
    dbStatus.error = 'Unconfigured credentials (<username>/<password> placeholders detected)';
    return false;
  }

  const uri = fixMongoUri(rawUri);

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }

    const masked = maskMongoUri(uri);
    console.log(`🔄 Connecting to MongoDB Atlas (${masked}) using database: "${DB_NAME}"...`);

    await mongoose.connect(uri, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    // Verify connection by pinging MongoDB
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }

    const host = mongoose.connection.host || 'Atlas Cluster0';
    dbStatus.connected = true;
    dbStatus.type = uri.includes('mongodb+srv') ? 'mongodb_atlas' : 'local_mongoose';
    dbStatus.uriConfigured = true;
    dbStatus.maskedUri = masked;
    dbStatus.databaseName = mongoose.connection.name || DB_NAME;
    dbStatus.host = host;
    dbStatus.error = undefined;

    console.log(`✅ Successfully verified MongoDB Atlas connection without credentials:`);
    console.log(`   • Database: ${dbStatus.databaseName}`);
    console.log(`   • Cluster Host: ${dbStatus.host}`);
    console.log(`   • Connection ReadyState: ${mongoose.connection.readyState} (Connected)`);
    return true;
  } catch (err: any) {
    const rawError = err?.message || String(err);
    // Sanitize any accidental credentials in error message
    const sanitizedError = maskMongoUri(rawError);
    console.error('❌ MongoDB Atlas connection error:', sanitizedError);

    dbStatus.connected = false;
    dbStatus.error = sanitizedError;
    dbStatus.type = 'fallback_store';
    dbStatus.databaseName = DB_NAME;
    return false;
  }
}
