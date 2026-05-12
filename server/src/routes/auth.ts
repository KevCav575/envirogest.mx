import { Router }              from 'express';
import type { Request, Response } from 'express';
import bcrypt                  from 'bcrypt';
import jwt                     from 'jsonwebtoken';
import { config }              from '../config';
import { findByEmail, findById, insertUser, updateUser } from '../db/store';
import { verifyJWT }           from '../middleware/auth';
import { uid }                 from '../utils';
import type { JwtPayload, SafeUser, StoredUser } from '../types';

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip pwd_hash + created_at before sending to the client. */
function toSafe(u: StoredUser): SafeUser {
  const { id, nombre, empresa, email, rol, giro, proyecto_id } = u;
  return { id, nombre, empresa, email, rol, giro, proyecto_id };
}

/** Sign a JWT and set it as an httpOnly cookie on the response. */
function issueToken(res: Response, payload: JwtPayload): void {
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string,
  });
  res.cookie(config.cookieName, token, {
    httpOnly:  true,
    secure:    config.isProd,      // HTTPS-only in prod; plain HTTP in dev
    sameSite:  'strict',
    maxAge:    config.cookieMaxAgeMs,
    path:      '/',
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { user: SafeUser }  +  sets egx_session cookie
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos.' });
      return;
    }

    const user = await findByEmail(email);

    // Always run bcrypt to avoid timing-based user-enumeration attacks
    const dummy = '$2b$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const valid  = user
      ? await bcrypt.compare(password, user.pwd_hash)
      : (await bcrypt.compare(password, dummy), false);

    if (!user || !valid) {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
      return;
    }

    issueToken(res, { sub: user.id, rol: user.rol });
    res.json({ user: toSafe(user) });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(config.cookieName, { path: '/' });
  res.json({ ok: true });
});

/**
 * GET /api/auth/me
 * Validates the cookie and returns the authenticated user.
 */
router.get('/me', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await findById(req.user!.sub);
    if (!user) {
      res.clearCookie(config.cookieName, { path: '/' });
      res.status(401).json({ error: 'Usuario no encontrado.' });
      return;
    }
    res.json({ user: toSafe(user) });
  } catch (err) {
    console.error('[GET /auth/me]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * POST /api/auth/register
 * Body: { nombre, empresa, giro, email, password }
 * Self-registration — always creates a 'cliente' account.
 * Response: { user: SafeUser, proyecto_id: string }
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, empresa, giro, email, password } = req.body as {
      nombre?: string; empresa?: string; giro?: string;
      email?: string; password?: string;
    };

    if (!nombre || !empresa || !giro || !email || !password) {
      res.status(400).json({ error: 'Todos los campos son requeridos.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const existing = await findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });
      return;
    }

    const pwd_hash   = await bcrypt.hash(password, config.bcryptRounds);
    const proyecto_id = uid();   // let the server own the ID so both sides agree
    const user = await insertUser({
      nombre, empresa, email, pwd_hash,
      rol: 'cliente', giro, proyecto_id,
    });

    issueToken(res, { sub: user.id, rol: user.rol });
    res.status(201).json({ user: toSafe(user), proyecto_id });
  } catch (err) {
    console.error('[POST /auth/register]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * PATCH /api/auth/password
 * Body: { currentPassword, newPassword }
 * Authenticated endpoint — change own password.
 */
router.patch('/password', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string; newPassword?: string;
    };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Contraseñas requeridas.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const user = await findById(req.user!.sub);
    if (!user) { res.status(401).json({ error: 'Usuario no encontrado.' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.pwd_hash);
    if (!valid) { res.status(401).json({ error: 'Contraseña actual incorrecta.' }); return; }

    const pwd_hash = await bcrypt.hash(newPassword, config.bcryptRounds);
    await updateUser(user.id, { pwd_hash });
    res.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /auth/password]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
