/**
 * LocalStorageService — browser localStorage implementation of IStorageService.
 *
 * This layer stores PROJECT data (tramites, cuestionario, alertas, etc.) and
 * user DISPLAY data (name, company, role).  Passwords are NOT stored here —
 * authentication is handled server-side (see src/services/auth.service.ts).
 *
 * To migrate to MySQL: implement IStorageService against your REST API and
 * swap the import in src/store/useAppStore.ts.
 */
import type { AppData, Proyecto, User } from '@/types';
import type { IStorageService } from './storage.interface';
import { uid } from '@/lib/utils';

const STORAGE_KEY = 'envirogest_v2';
const ADMIN_ID    = 'bioimpact_admin_v1';

function buildEmptyData(): AppData {
  return {
    usuarios: [
      {
        id:      ADMIN_ID,
        nombre:  'Raúl',
        empresa: 'BIOIMPACT',
        email:   'admin@bioimpact.com.mx',
        // pwd_hash intentionally omitted — bcrypt hash lives on the server
        rol:     'admin',
      },
    ],
    proyectos: [],
  };
}

function ensureAdmin(d: AppData): AppData {
  if (!d.usuarios)  d.usuarios  = [];
  if (!d.proyectos) d.proyectos = [];
  if (!d.usuarios.find(u => u.id === ADMIN_ID)) {
    d.usuarios.unshift({
      id:      ADMIN_ID,
      nombre:  'Raúl',
      empresa: 'BIOIMPACT',
      email:   'admin@bioimpact.com.mx',
      rol:     'admin',
    });
  }
  return d;
}

class LocalStorageService implements IStorageService {
  getData(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildEmptyData();
      return ensureAdmin(JSON.parse(raw) as AppData);
    } catch {
      return buildEmptyData();
    }
  }

  saveData(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* storage quota exceeded — ignore */ }
  }

  getUserByEmail(email: string): User | undefined {
    return this.getData().usuarios.find(u => u.email === email);
  }

  getUserById(id: string): User | undefined {
    return this.getData().usuarios.find(u => u.id === id);
  }

  getProjectByClientId(clientId: string): Proyecto | undefined {
    return this.getData().proyectos.find(p => p.cliente_id === clientId);
  }
}

export const storageService: IStorageService = new LocalStorageService();
