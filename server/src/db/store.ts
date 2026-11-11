/**
 * JSON-file user store (una cuenta propietaria por empresa).
 * This is the bridge implementation until MySQL is connected.
 * To migrate: implement the same functions against mysql2 / drizzle-orm
 * and swap this import everywhere (or inject via a repository pattern).
 */
import fs   from 'fs';
import path from 'path';
import { config } from '../config';
import type { StoredUser, UserStore } from '../types';
import { uid } from '../utils';

// ── Helpers ────────────────────────────────────────────────────────────────

function fp(): string {
  return path.resolve(config.dataFile);
}

function ensureDir(p: string): void {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeRaw(store: UserStore): void {
  const p = fp();
  ensureDir(p);
  fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf8');
}

/**
 * Migra datos del modelo anterior (agencia con admin/consultor/cliente):
 *  - descarta cuentas 'admin' y 'consultor' (ya no existen),
 *  - convierte 'cliente' en 'propietario',
 *  - garantiza que cada cuenta tenga su proyecto_id.
 * Devuelve true si hubo cambios que guardar.
 */
function normalize(store: UserStore): boolean {
  let changed = false;
  const kept: StoredUser[] = [];
  for (const raw of store.users as unknown as Array<Omit<StoredUser, 'rol'> & { rol: string }>) {
    if (raw.rol === 'admin' || raw.rol === 'consultor') { changed = true; continue; }
    if (raw.rol !== 'propietario') { raw.rol = 'propietario'; changed = true; }
    if (!raw.proyecto_id) { raw.proyecto_id = uid(); changed = true; }
    kept.push(raw as StoredUser);
  }
  store.users = kept;
  return changed;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function readStore(): Promise<UserStore> {
  const p = fp();
  try {
    if (!fs.existsSync(p)) {
      const empty: UserStore = { users: [] };
      writeRaw(empty);
      return empty;
    }
    const store = JSON.parse(fs.readFileSync(p, 'utf8')) as UserStore;
    if (!Array.isArray(store.users)) store.users = [];
    if (normalize(store)) writeRaw(store);
    return store;
  } catch (err) {
    // No sobrescribimos un archivo ilegible: podría tener datos recuperables.
    console.error('[store] No se pudo leer', p, err);
    throw err;
  }
}

export async function findByEmail(email: string): Promise<StoredUser | undefined> {
  const { users } = await readStore();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function findById(id: string): Promise<StoredUser | undefined> {
  const { users } = await readStore();
  return users.find(u => u.id === id);
}

export async function insertUser(
  data: Omit<StoredUser, 'id' | 'created_at'>,
): Promise<StoredUser> {
  const store = await readStore();
  const user: StoredUser = { ...data, id: uid(), created_at: new Date().toISOString() };
  store.users.push(user);
  writeRaw(store);
  return user;
}

export async function updateUser(
  id: string,
  partial: Partial<Omit<StoredUser, 'id' | 'created_at'>>,
): Promise<StoredUser | undefined> {
  const store = await readStore();
  const idx   = store.users.findIndex(u => u.id === id);
  if (idx === -1) return undefined;
  store.users[idx] = { ...store.users[idx], ...partial };
  writeRaw(store);
  return store.users[idx];
}

export async function removeUser(id: string): Promise<void> {
  const store  = await readStore();
  store.users  = store.users.filter(u => u.id !== id);
  writeRaw(store);
}
