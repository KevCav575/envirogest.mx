import { create } from 'zustand';
import type { AppData, Proyecto, User } from '@/types';
import { storageService } from '@/services/localStorage.service';
import { authService } from '@/services/auth.service';
import type { AuthUser } from '@/services/auth.service';
import { uid, today } from '@/lib/utils';

/**
 * Modo de autenticación.
 *  - false (por defecto): cuentas simuladas en localStorage, sin servidor.
 *  - true: usa la API Express (cookie JWT). Actívalo con VITE_USE_API=true.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const USE_API = (import.meta as any).env?.VITE_USE_API === 'true';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface AccountFields {
  nombre: string;
  empresa: string;
  giro: string;
  email: string;
}

interface AppStore {
  data: AppData;
  currentUser: User | null;
  activeProjectId: string | null;
  /** true mientras se restaura la sesión al arrancar; lo usa AuthGuard */
  sessionLoading: boolean;

  // ── Sesión ──
  login: (email: string, pwd: string) => Promise<User | null>;
  logout: () => Promise<void>;
  /** Alta de una empresa: crea la cuenta propietaria y su espacio de trabajo. */
  register: (fields: {
    nombre: string; empresa: string; giro: string; email: string; pwd: string;
  }) => Promise<User | null>;
  initSession: () => Promise<void>;

  // ── Espacio de trabajo ──
  setActiveProject: (id: string | null) => void;
  updateProject: (partial: Partial<Proyecto>) => void;

  // ── Configuración (control total del propietario) ──
  /** Devuelve un mensaje de error o null si todo salió bien. */
  updateAccount: (fields: AccountFields) => Promise<string | null>;
  changePassword: (current: string, next: string) => Promise<string | null>;
  /** Borra diagnóstico, trámites, alertas, agenda e ISO; conserva la cuenta. */
  resetWorkspace: () => void;
  deleteAccount: (password: string) => Promise<string | null>;
}

/** En modo local la contraseña vive junto al usuario (solo para la simulación). */
type LocalUser = User & { _pwd?: string };

// ── Helpers ────────────────────────────────────────────────────────────────

function persist(data: AppData): void {
  storageService.saveData(data);
}

function toUser(a: AuthUser): User {
  return {
    id: a.id, nombre: a.nombre, empresa: a.empresa ?? '', email: a.email,
    rol: 'propietario', giro: a.giro, proyecto_id: a.proyecto_id,
  };
}

function stripPwd(u: LocalUser): User {
  const { _pwd: _omit, ...user } = u;
  return user;
}

function newWorkspace(id: string, ownerId: string, giro: string): Proyecto {
  return {
    id, propietario_id: ownerId,
    cuestionario: {
      respondido: false,
      respuestas: { giro, emisiones: null, agua: null, residuos_peligrosos: false, residuos_especiales: false, obras: null },
      fecha: null,
    },
    tramites: [], alertas: [], reuniones: [],
    iso14001: { secciones: {} },
    creado: today(), notas: '',
  };
}

/** Inserta o actualiza la cuenta y garantiza que exista su espacio de trabajo. */
function upsertAccount(data: AppData, user: User): AppData {
  const exists = data.usuarios.some(u => u.id === user.id);
  const usuarios = exists
    ? data.usuarios.map(u => (u.id === user.id ? { ...u, ...user } : u))
    : [...data.usuarios, user];
  const proyectos = data.proyectos.some(p => p.id === user.proyecto_id)
    ? data.proyectos
    : [...data.proyectos, newWorkspace(user.proyecto_id, user.id, user.giro ?? '')];
  return { usuarios, proyectos };
}

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

// ── Store ──────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  data: storageService.getData(),
  currentUser: null,
  activeProjectId: null,
  sessionLoading: true,

  // ── Sesión ────────────────────────────────────────────────────────────────

  async login(email, pwd) {
    try {
      if (USE_API) {
        const user = toUser(await authService.login(email, pwd));
        const updated = upsertAccount(get().data, user);
        persist(updated);
        set({ data: updated, currentUser: user });
        return user;
      }
      const found = (get().data.usuarios as LocalUser[]).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found || found._pwd !== pwd) return null;
      const user = stripPwd(found);
      set({ currentUser: user });
      return user;
    } catch {
      return null;
    }
  },

  async logout() {
    if (USE_API) {
      try { await authService.logout(); } catch { /* errores de red: igual se limpia el estado */ }
    }
    set({ currentUser: null, activeProjectId: null });
  },

  async register({ nombre, empresa, giro, email, pwd }) {
    try {
      const { data } = get();
      if (USE_API) {
        const { user: authUser } = await authService.register({ nombre, empresa, giro, email, password: pwd });
        const user = toUser(authUser);
        const updated = upsertAccount(data, user);
        persist(updated);
        set({ data: updated, currentUser: user, activeProjectId: user.proyecto_id });
        return user;
      }

      if (data.usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) return null;
      const user: User = { id: uid(), nombre, empresa, email, rol: 'propietario', giro, proyecto_id: uid() };
      const updated: AppData = {
        usuarios: [...data.usuarios, { ...user, _pwd: pwd } as LocalUser],
        proyectos: [...data.proyectos, newWorkspace(user.proyecto_id, user.id, giro)],
      };
      persist(updated);
      set({ data: updated, currentUser: user, activeProjectId: user.proyecto_id });
      return user;
    } catch (err) {
      console.error('[register]', err);
      return null;
    }
  },

  async initSession() {
    if (!USE_API) {
      // Sin servidor no hay sesión persistente entre recargas
      set({ currentUser: null, sessionLoading: false });
      return;
    }
    set({ sessionLoading: true });
    try {
      const authUser = await authService.me();
      if (authUser) {
        const user = toUser(authUser);
        const updated = upsertAccount(get().data, user);
        persist(updated);
        set({ data: updated, currentUser: user });
      } else {
        set({ currentUser: null });
      }
    } catch {
      set({ currentUser: null });
    } finally {
      set({ sessionLoading: false });
    }
  },

  // ── Espacio de trabajo ──────────────────────────────────────────────────────

  setActiveProject(id) {
    set({ activeProjectId: id });
  },

  updateProject(partial) {
    const { data, activeProjectId, currentUser } = get();
    // Solo se escribe sobre el espacio de la empresa de la sesión
    if (!activeProjectId || !currentUser || activeProjectId !== currentUser.proyecto_id) return;
    const updated: AppData = {
      ...data,
      proyectos: data.proyectos.map(p =>
        p.id === activeProjectId ? { ...p, ...partial } : p,
      ),
    };
    persist(updated);
    set({ data: updated });
  },

  // ── Configuración ────────────────────────────────────────────────────────────

  async updateAccount(fields) {
    const { data, currentUser } = get();
    if (!currentUser) return 'Inicia sesión de nuevo.';
    const email = fields.email.trim();
    if (!fields.nombre.trim() || !fields.empresa.trim() || !email) return 'Nombre, empresa y correo son obligatorios.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Revisa el formato del correo.';

    let next: User = { ...currentUser, nombre: fields.nombre.trim(), empresa: fields.empresa.trim(), giro: fields.giro, email };
    if (USE_API) {
      try {
        next = toUser(await authService.updateAccount({ nombre: next.nombre, empresa: next.empresa, giro: next.giro, email }));
      } catch (e) {
        return errMsg(e, 'No se pudieron guardar los cambios.');
      }
    } else if (data.usuarios.some(u => u.id !== currentUser.id && u.email.toLowerCase() === email.toLowerCase())) {
      return 'Ese correo ya está en uso por otra cuenta.';
    }

    const updated: AppData = {
      ...data,
      usuarios: data.usuarios.map(u => (u.id === currentUser.id ? { ...u, ...next } : u)),
    };
    persist(updated);
    set({ data: updated, currentUser: next });
    return null;
  },

  async changePassword(current, nextPwd) {
    const { data, currentUser } = get();
    if (!currentUser) return 'Inicia sesión de nuevo.';
    if (nextPwd.length < 6) return 'La nueva contraseña necesita al menos 6 caracteres.';
    if (USE_API) {
      try { await authService.changePassword(current, nextPwd); return null; }
      catch (e) { return errMsg(e, 'No se pudo cambiar la contraseña.'); }
    }
    const me = (data.usuarios as LocalUser[]).find(u => u.id === currentUser.id);
    if (!me || me._pwd !== current) return 'La contraseña actual no coincide.';
    const updated: AppData = {
      ...data,
      usuarios: (data.usuarios as LocalUser[]).map(u => (u.id === me.id ? { ...u, _pwd: nextPwd } : u)),
    };
    persist(updated);
    set({ data: updated });
    return null;
  },

  resetWorkspace() {
    const { data, currentUser } = get();
    if (!currentUser) return;
    const updated: AppData = {
      ...data,
      proyectos: data.proyectos.map(p => {
        if (p.id !== currentUser.proyecto_id) return p;
        const fresh = newWorkspace(p.id, currentUser.id, currentUser.giro ?? '');
        return { ...fresh, creado: p.creado };
      }),
    };
    persist(updated);
    set({ data: updated });
  },

  async deleteAccount(password) {
    const { data, currentUser } = get();
    if (!currentUser) return 'Inicia sesión de nuevo.';
    if (USE_API) {
      try { await authService.deleteAccount(password); }
      catch (e) { return errMsg(e, 'No se pudo eliminar la cuenta.'); }
    } else {
      const me = (data.usuarios as LocalUser[]).find(u => u.id === currentUser.id);
      if (!me || me._pwd !== password) return 'Contraseña incorrecta.';
    }
    const updated: AppData = {
      usuarios: data.usuarios.filter(u => u.id !== currentUser.id),
      proyectos: data.proyectos.filter(p => p.id !== currentUser.proyecto_id),
    };
    persist(updated);
    set({ data: updated, currentUser: null, activeProjectId: null });
    return null;
  },
}));
