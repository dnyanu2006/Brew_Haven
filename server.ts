import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './backend/routes/api.ts';
import { connectDB } from './backend/config/db.ts';
import { seedMongoIfEmpty } from './backend/services/dbStore.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isDev = process.env.NODE_ENV !== 'production';

  // Core Express Middleware
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Connect to MongoDB Atlas (or graceful in-memory engine fallback)
  await connectDB();
  await seedMongoIfEmpty();

  // Mount API router
  app.use('/api', apiRouter);

  // Vite integration: Dev middleware or Production static files
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }  else {
  app.use(express.static(path.resolve(__dirname, 'frontend', 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(
      path.resolve(__dirname, 'frontend', 'dist', 'index.html')
    );
  });
}

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ Brew Haven server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
