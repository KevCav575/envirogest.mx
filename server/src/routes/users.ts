import { Router }              from 'express';
import type { Request, Response } from 'express';
import bcrypt                  from 'bcrypt';
import { config }              from '../config';
import { listUsers, findById, insertUser, removeUser } from '../db/store';
import { verifyJWT, requireRole } from '../middleware/auth';
import { uid }                 from '../utils';
import type { StoredUser, UserRole } from '../types';

const router = Router();

function toSafe(u: StoredUser) {
  const { id, nombre, empresa, email, rol, giro, proyecto_id } = u;
  return { id, nombre, empresa, email, rol, giro, proyecto_id };
}

/**
 * GET /api/users
 * List all users — admin only.
 */
router.get(
  '/',
  verifyJWT, requireRole('admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json((await listUsers()).map(toSafe));
    } catch {
      res.status(500).json({ error: 'Error interno.' });
    }
  },
);

/**
 * GET /api/users/:id
 * Admin can read any user; other roles can only read themselves.
 */
router.get(
  '/:id',
  verifyJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (req.user!.rol !== 'admin' && req.user!.sub !== id) {
        res.status(403).json({ error: 'Acceso denegado.' });
        return;
      }
      const user = await findById(id);
      if (!user) { res.status(404).json({ error: 'Usuario no encontrado.' }); return; }
      res.json(toSafe(user));
    } catch {
      res.status(500).json({ error: 'Error interno.' });
    }
  },
);

/**
 * POST /api/users
 * Create a user (admin only).
 * Body: { nombre, empresa?, email, password, rol, giro?, proyecto_id? }
 * Response: SafeUser
 *
 * Note: proyecto_id may be supplied by the caller so the client can create
 * the corresponding project in localStorage before this endpoint returns.
 */
router.post(
  '/',
  verifyJWT, requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        nombre, empresa = '', email, password, rol, giro, proyecto_id,
      } = req.body as {
        nombre?: string; empresa?: string; email?: string; password?: string;
        rol?: string; giro?: string; proyecto_id?: string;
      };

      if (!nombre || !email || !password || !rol) {
        res.status(400).json({ error: 'nombre, email, password y rol son requeridos.' });
        return;
      }
      if ((password as string).length < 6) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
      }

      const pwd_hash = await bcrypt.hash(password!, config.bcryptRounds);
      const user = await insertUser({
        nombre: nombre!, empresa, email: email!, pwd_hash,
        rol: rol as UserRole, giro,
        proyecto_id: proyecto_id ?? (rol === 'cliente' ? uid() : undefined),
      });

      res.status(201).json(toSafe(user));
    } catch {
      res.status(500).json({ error: 'Error interno.' });
    }
  },
);

/**
 * DELETE /api/users/:id
 * Remove a user from the auth store — admin only.
 */
router.delete(
  '/:id',
  verifyJWT, requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await removeUser(req.params.id);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Error interno.' });
    }
  },
);

export default router;
