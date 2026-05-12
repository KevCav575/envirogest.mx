import express      from 'express';
import cors         from 'cors';
import helmet       from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit    from 'express-rate-limit';
import { config }   from './config';
import { readStore } from './db/store';
import authRouter   from './routes/auth';
import usersRouter  from './routes/users';

const app = express();

// ── Security headers (XSS protection, MIME sniff, etc.) ───────────────────
app.use(helmet());

// ── CORS — only allow the Vite dev/prod origin ────────────────────────────
app.use(cors({
  origin:         config.corsOrigin,
  credentials:    true,              // required for cookies
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '200kb' }));

// ── Cookie parsing (reads req.cookies) ───────────────────────────────────
app.use(cookieParser());

// ── Rate-limit auth endpoints: 10 req / min per IP ───────────────────────
const authLimiter = rateLimit({
  windowMs:       60_000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { error: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' },
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',  authLimiter, authRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── Unmatched routes ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ── Start ─────────────────────────────────────────────────────────────────
async function start() {
  // Warm up the store — ensures data dir + default admin user exist
  await readStore();

  app.listen(config.port, () => {
    console.log(`\n✅  EnviroGest API  →  http://localhost:${config.port}/api`);
    console.log(`    Mode    : ${config.isProd ? 'production' : 'development'}`);
    console.log(`    CORS    : ${config.corsOrigin}`);
    console.log(`    Cookie  : ${config.cookieName}  (httpOnly · SameSite=Strict)\n`);
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
