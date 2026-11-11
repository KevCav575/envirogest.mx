/**
 * LocalStorageService — implementación en localStorage de IStorageService.
 *
 * Guarda los datos de cada empresa (trámites, diagnóstico, alertas, agenda…)
 * y los datos visibles de su cuenta propietaria.
 *
 * Para migrar a MySQL: implementa IStorageService contra tu API REST y
 * cambia el import en src/store/useAppStore.ts.
 */
import type { AppData, Proyecto, User } from '@/types';
import type { IStorageService } from './storage.interface';
import { uid } from '@/lib/utils';

const STORAGE_KEY = 'envirogest_v2';

function emptyData(): AppData {
  return { usuarios: [], proyectos: [] };
}

/* Formas que pudo dejar guardadas el modelo anterior (agencia + consultores). */
type LegacyUser = Omit<User, 'rol' | 'proyecto_id'> & { rol: string; proyecto_id?: string };
type LegacyProyecto = Omit<Proyecto, 'propietario_id'> & {
  propietario_id?: string;
  cliente_id?: string;
  consultor_id?: string | null;
  instrucciones_admin?: unknown;
};

const TIPOS_ALERTA = new Set(['vencimiento', 'estado', 'info']);

/**
 * Migra datos del modelo de agencia al de autogestión:
 *  - descarta cuentas 'admin' y 'consultor',
 *  - convierte 'cliente' en 'propietario',
 *  - renombra cliente_id → propietario_id y quita consultor_id / instrucciones_admin,
 *  - convierte alertas enviadas por consultores en avisos genéricos.
 */
function migrate(raw: { usuarios?: LegacyUser[]; proyectos?: LegacyProyecto[] }): AppData {
  const proyectos: Proyecto[] = (raw.proyectos ?? []).map(p => {
    const { cliente_id, consultor_id: _c, instrucciones_admin: _i, ...rest } = p;
    return {
      ...rest,
      propietario_id: p.propietario_id ?? cliente_id ?? '',
      reuniones: rest.reuniones ?? [],
      alertas: (rest.alertas ?? []).map(a => (TIPOS_ALERTA.has(a.tipo) ? a : { ...a, tipo: 'info' as const })),
    };
  });

  const usuarios: User[] = (raw.usuarios ?? [])
    .filter(u => u.rol !== 'admin' && u.rol !== 'consultor')
    .map(u => ({
      ...u,
      rol: 'propietario' as const,
      proyecto_id: u.proyecto_id ?? proyectos.find(p => p.propietario_id === u.id)?.id ?? uid(),
    }));

  return { usuarios, proyectos };
}

class LocalStorageService implements IStorageService {
  getData(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyData();
      const data = migrate(JSON.parse(raw));
      this.saveData(data);
      return data;
    } catch {
      return emptyData();
    }
  }

  saveData(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* cuota de almacenamiento excedida — se ignora */ }
  }

  getUserByEmail(email: string): User | undefined {
    return this.getData().usuarios.find(u => u.email === email);
  }

  getUserById(id: string): User | undefined {
    return this.getData().usuarios.find(u => u.id === id);
  }

  getProjectByOwnerId(ownerId: string): Proyecto | undefined {
    return this.getData().proyectos.find(p => p.propietario_id === ownerId);
  }
}

export const storageService: IStorageService = new LocalStorageService();
