/**
 * ApiService — future MySQL / REST backend implementation.
 *
 * HOW TO ACTIVATE:
 *  1. Stand up a REST API (Express/Fastify/tRPC) connected to MySQL.
 *  2. Fill in the fetch() calls below.
 *  3. In src/store/useAppStore.ts replace:
 *       import { storageService } from '@/services/localStorage.service';
 *     with:
 *       import { storageService } from '@/services/api.service';
 *
 * Suggested MySQL schema (simplified):
 *
 *   CREATE TABLE users (
 *     id          VARCHAR(36) PRIMARY KEY,
 *     nombre      VARCHAR(120) NOT NULL,
 *     empresa     VARCHAR(200),
 *     email       VARCHAR(200) UNIQUE NOT NULL,
 *     pwd_hash    VARCHAR(100) NOT NULL,
 *     rol         ENUM('admin','consultor','cliente') NOT NULL,
 *     giro        VARCHAR(60),
 *     proyecto_id VARCHAR(36),
 *     created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 *
 *   CREATE TABLE proyectos (
 *     id            VARCHAR(36) PRIMARY KEY,
 *     cliente_id    VARCHAR(36) NOT NULL REFERENCES users(id),
 *     consultor_id  VARCHAR(36) REFERENCES users(id),
 *     cuestionario  JSON,
 *     tramites      JSON,
 *     alertas       JSON,
 *     instrucciones JSON,
 *     reuniones     JSON,
 *     iso14001      JSON,
 *     notas         TEXT,
 *     created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 */

import type { AppData, Proyecto, User } from '@/types';
import type { IStorageService } from './storage.interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001/api';

class ApiService implements IStorageService {
  // Sync fallback — remove once API is ready
  getData(): AppData {
    throw new Error('ApiService.getData() is async — use loadData() instead.');
  }

  saveData(_data: AppData): void {
    throw new Error('ApiService.saveData() is async — use individual mutations instead.');
  }

  getUserByEmail(_email: string): User | undefined {
    throw new Error('Not implemented — call GET /users?email=');
  }

  getUserById(_id: string): User | undefined {
    throw new Error('Not implemented — call GET /users/:id');
  }

  getProjectByClientId(_clientId: string): Proyecto | undefined {
    throw new Error('Not implemented — call GET /proyectos?cliente_id=');
  }

  // ── Async API methods (add these when your backend is ready) ──────────

  async fetchData(): Promise<AppData> {
    const res = await fetch(`${BASE_URL}/snapshot`);
    return res.json();
  }

  async login(email: string, pwdHash: string): Promise<User | null> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pwd_hash: pwdHash }),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return res.json();
  }

  async updateProject(id: string, partial: Partial<Proyecto>): Promise<Proyecto> {
    const res = await fetch(`${BASE_URL}/proyectos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    return res.json();
  }
}

// Not exported as storageService yet — swap localStorage.service import to activate.
export const apiService = new ApiService();
