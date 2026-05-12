/**
 * authService — thin client for the EnviroGest Express auth API.
 *
 * All calls use `credentials: 'include'` so the browser automatically
 * sends / stores the httpOnly `egx_session` JWT cookie.
 * Passwords travel to the server and are hashed with bcrypt there —
 * they are NEVER stored or logged in the browser.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)
  ?? 'http://localhost:3001/api';

export interface AuthUser {
  id:          string;
  nombre:      string;
  empresa:     string;
  email:       string;
  rol:         'admin' | 'consultor' | 'cliente';
  giro?:       string;
  proyecto_id?: string;
}

// ── Low-level fetch helper ─────────────────────────────────────────────────

async function call<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path:   string,
  body?:  unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',          // httpOnly cookie in/out
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body:    body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

// ── Public API ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Verify email + password.
   * On success the server sets the httpOnly JWT cookie and returns the user.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const { user } = await call<{ user: AuthUser }>('POST', '/auth/login', { email, password });
    return user;
  },

  /**
   * Clear the session cookie server-side.
   */
  async logout(): Promise<void> {
    await call('POST', '/auth/logout');
  },

  /**
   * Validate the current cookie and return the authenticated user, or null.
   * Safe to call on every app load — returns null when not logged in.
   */
  async me(): Promise<AuthUser | null> {
    try {
      const { user } = await call<{ user: AuthUser }>('GET', '/auth/me');
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Self-registration (always creates a 'cliente' account).
   * Returns the new user and the server-generated proyecto_id.
   */
  async register(fields: {
    nombre: string; empresa: string; giro: string;
    email: string; password: string;
  }): Promise<{ user: AuthUser; proyecto_id: string }> {
    return call('POST', '/auth/register', fields);
  },

  /**
   * Admin-only: create any user type.
   */
  async createUser(fields: {
    nombre: string; empresa: string; email: string; password: string;
    rol: string; giro?: string; proyecto_id?: string;
  }): Promise<AuthUser> {
    return call<AuthUser>('POST', '/users', fields);
  },

  /**
   * Admin-only: remove a user from the auth store.
   */
  async deleteUser(id: string): Promise<void> {
    await call('DELETE', `/users/${id}`);
  },

  /**
   * Change the authenticated user's own password.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await call('PATCH', '/auth/password', { currentPassword, newPassword });
  },
};
