import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { JwtPayload, UserRole } from '../types';

// ── Augment Express Request so TypeScript knows about req.user ─────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ── Middleware ─────────────────────────────────────────────────────────────

/**
 * Reads the JWT from the httpOnly cookie and attaches the decoded payload
 * to `req.user`. Sends 401 if missing or invalid.
 */
export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = (req.cookies as Record<string, string>)?.[config.cookieName];
  if (!token) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    // Clear the bad/expired cookie so the client doesn't keep sending it
    res.clearCookie(config.cookieName, { path: '/' });
    res.status(401).json({ error: 'Sesión expirada o inválida. Inicia sesión de nuevo.' });
  }
}

/**
 * Must run after verifyJWT.
 * Passes if `req.user.rol` is in the allowed list; sends 403 otherwise.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'Acceso denegado: rol insuficiente.' });
      return;
    }
    next();
  };
}
