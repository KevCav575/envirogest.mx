/**
 * JSON-file user store.
 * This is the bridge implementation until MySQL is connected.
 * To migrate: implement the same functions against mysql2 / drizzle-orm
 * and swap this import everywhere (or inject via a repository pattern).
 */
import fs   from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { config } from '../config';
import type { StoredUser, UserStore } from '../types';
import { uid } from '../utils';

const ADMIN_ID    = 'bioimpact_admin_v1';
const ADMIN_EMAIL = 'admin@bioimpact.com.mx';

// ── Helpers ────────────────────────────────────────────────────────────────

function fp(): string {
  return path.resolve(config.dataFile);
}

function ensureDir(p: string): void {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function makeDefault(): Promise<UserStore> {
  const pwd_hash = await bcrypt.hash('bioimpact2026', config.bcryptRounds);
  return {
    users: [{
      id: ADMIN_ID, nombre: 'Raúl', empresa: 'BIOIMPACT',
      email: ADMIN_EMAIL, pwd_hash, rol: 'admin',
      created_at: new Date().toISOString(),
    }],
  };
}

function writeRaw(store: UserStore): void {
  const p = fp();
  ensureDir(p);
  fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf8');
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function readStore(): Promise<UserStore> {
  const p = fp();
  try {
    if (!fs.existsSync(p)) {
      const store = await makeDefault();
      writeRaw(store);
      return store;
    }
    const store = JSON.parse(fs.readFileSync(p, 'utf8')) as UserStore;
    if (!Array.isArray(store.users)) store.users = [];
    // Always guarantee the default admin account
    if (!store.users.find(u => u.id === ADMIN_ID)) {
      const pwd_hash = await bcrypt.hash('bioimpact2026', config.bcryptRounds);
      store.users.unshift({
        id: ADMIN_ID, nombre: 'Raúl', empresa: 'BIOIMPACT',
        email: ADMIN_EMAIL, pwd_hash, rol: 'admin',
        created_at: new Date().toISOString(),
      });
      writeRaw(store);
    }
    return store;
  } catch {
    const store = await makeDefault();
    writeRaw(store);
    return store;
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

export async function listUsers(): Promise<StoredUser[]> {
  const { users } = await readStore();
  return users;
}
