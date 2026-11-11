import type { Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from './config';
import type { JwtPayload, SafeUser, StoredUser } from './types';

/** Quita pwd_hash y created_at antes de enviar al cliente. */
export function toSafe(u: StoredUser): SafeUser {
  const { id, nombre, empresa, email, rol, giro, proyecto_id } = u;
  return { id, nombre, empresa, email, rol, giro, proyecto_id };
}

/** Firma el JWT de la cuenta y lo guarda en una cookie httpOnly. */
export function issueToken(res: Response, user: StoredUser): void {
  const payload: JwtPayload = { sub: user.id, rol: user.rol, proyecto_id: user.proyecto_id };
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  });
  res.cookie(config.cookieName, token, {
    httpOnly:  true,
    secure:    config.isProd,      // solo HTTPS en producción
    sameSite:  'strict',
    maxAge:    config.cookieMaxAgeMs,
    path:      '/',
  });
}

export function clearToken(res: Response): void {
  res.clearCookie(config.cookieName, { path: '/' });
}
