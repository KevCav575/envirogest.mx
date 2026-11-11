/**
 * /api/account — el propietario administra su propia cuenta y empresa.
 *
 * Todas las rutas operan sobre la cuenta de la sesión (req.user.sub);
 * no existe forma de leer ni modificar cuentas de otras empresas.
 */
import { Router }              from 'express';
import type { Request, Response } from 'express';
import bcrypt                  from 'bcrypt';
import { findByEmail, findById, removeUser, updateUser } from '../db/store';
import { verifyJWT, requireRole } from '../middleware/auth';
import { clearToken, toSafe }  from '../session';

const router = Router();

router.use(verifyJWT, requireRole('propietario'));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PATCH /api/account
 * Body: { nombre?, empresa?, giro?, email? }
 * Actualiza los datos de la cuenta y de la empresa.
 */
router.patch('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, empresa, giro, email } = req.body as {
      nombre?: string; empresa?: string; giro?: string; email?: string;
    };

    const partial: { nombre?: string; empresa?: string; giro?: string; email?: string } = {};
    if (nombre  !== undefined) partial.nombre  = nombre.trim();
    if (empresa !== undefined) partial.empresa = empresa.trim();
    if (giro    !== undefined) partial.giro    = giro;
    if (email   !== undefined) partial.email   = email.trim();

    if (partial.nombre === '' || partial.empresa === '' || partial.email === '') {
      res.status(400).json({ error: 'Nombre, empresa y correo no pueden quedar vacíos.' });
      return;
    }
    if (partial.email !== undefined) {
      if (!EMAIL_RE.test(partial.email)) {
        res.status(400).json({ error: 'El correo no es válido.' });
        return;
      }
      const other = await findByEmail(partial.email);
      if (other && other.id !== req.user!.sub) {
        res.status(409).json({ error: 'Ese correo ya está en uso por otra cuenta.' });
        return;
      }
    }

    const user = await updateUser(req.user!.sub, partial);
    if (!user) { res.status(404).json({ error: 'Cuenta no encontrada.' }); return; }
    res.json({ user: toSafe(user) });
  } catch (err) {
    console.error('[PATCH /account]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * DELETE /api/account
 * Body: { password }
 * Elimina la cuenta de la empresa. Pide la contraseña como confirmación.
 */
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body as { password?: string };
    if (!password) { res.status(400).json({ error: 'Confirma con tu contraseña.' }); return; }

    const user = await findById(req.user!.sub);
    if (!user) { res.status(404).json({ error: 'Cuenta no encontrada.' }); return; }

    const valid = await bcrypt.compare(password, user.pwd_hash);
    if (!valid) { res.status(401).json({ error: 'Contraseña incorrecta.' }); return; }

    await removeUser(user.id);
    clearToken(res);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /account]', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
