import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import connectionRoutes from './routes/connections.js';
import { SKILL_CATEGORIES } from './utils/skills.js';

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) =>
  res.json({ ok: true, service: 'connstellation', time: new Date().toISOString() })
);

/** The client colours stars from this, so the palette lives in one place. */
app.get('/api/meta/categories', (req, res) => res.json({ categories: SKILL_CATEGORIES }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/connections', connectionRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('[fatal] MONGODB_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('[fatal] JWT_SECRET is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);

  const server = http.createServer(app);
  initSocket(server, CLIENT_ORIGIN.split(',').map((s) => s.trim()));

  server.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});

export default app;
