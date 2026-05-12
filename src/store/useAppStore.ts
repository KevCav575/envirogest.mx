import { create } from 'zustand';
import type { AppData, Proyecto, User } from '@/types';
import { storageService } from '@/services/localStorage.service';
import { authService } from '@/services/auth.service';
import type { AuthUser } from '@/services/auth.service';
import { uid, today } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface AppStore {
  data: AppData;
  currentUser: User | null;
  activeProjectId: string | null;
  /** true while the initial GET /auth/me is in flight; used by AuthGuard */
  sessionLoading: boolean;

  // ── Auth (async — proxied through the Express server) ──
  /** Verify credentials; on success sets currentUser and returns it. */
  login: (email: string, pwd: string) => Promise<User | null>;
  /** Clear the JWT cookie and reset state. */
  logout: () => Promise<void>;
  /** Self-registration (cliente role). Creates project in localStorage. */
  register: (fields: {
    nombre: string; empresa: string; giro: string; email: string; pwd: string;
  }) => Promise<User | null>;
  /**
   * Called once on app boot (App.tsx useEffect).
   * Hits GET /auth/me to restore an existing JWT session.
   */
  initSession: () => Promise<void>;

  // ── Workspace ──
  setActiveProject: (id: string | null) => void;
  updateProject: (partial: Partial<Proyecto>) => void;

  // ── Admin / Consultant ──
  createClientWithProject: (fields: {
    nombre: string; empresa: string; giro: string; email: string; pwd: string;
    consultor_id: string; notas: string;
  }) => Promise<{ user: User; pwd: string } | null>;
  createConsultor: (fields: { nombre: string; email: string; pwd: string }) => Promise<User | null>;
  deleteUser: (userId: string) => Promise<void>;
  deleteProject: (projectId: string) => void;
  assignConsultor: (projectId: string, consultorId: string | null) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function persist(data: AppData): void {
  storageService.saveData(data);
}

/** Map the server's SafeUser shape to the frontend User type. */
function toUser(a: AuthUser): User {
  return {
    id: a.id,
    nombre: a.nombre,
    empresa: a.empresa ?? '',
    email: a.email,
    rol: a.rol,
    giro: a.giro,
    proyecto_id: a.proyecto_id,
    // pwd_hash intentionally omitted — server only
  };
}

/**
 * Upsert a user into the localStorage AppData without touching pwd_hash.
 * Returns the updated AppData.
 */
function upsertUser(data: AppData, user: User): AppData {
  const exists = data.usuarios.find(u => u.id === user.id);
  return {
    ...data,
    usuarios: exists
      ? data.usuarios.map(u => u.id === user.id ? { ...u, ...user } : u)
      : [...data.usuarios, user],
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  data: storageService.getData(),
  currentUser: null,
  activeProjectId: null,
  sessionLoading: true,   // stays true until initSession() resolves

  // ── Auth ──────────────────────────────────────────────────────────────────

  // async login(email, pwd) {
  //   try {
  //     const authUser = await authService.login(email, pwd);
  //     const user     = toUser(authUser);
  //     const updated  = upsertUser(get().data, user);
  //     persist(updated);
  //     set({ data: updated, currentUser: user });
  //     return user;
  //   } catch {
  //     return null;
  //   }
  // },

  async login(email, pwd) {
    try {
      const { data } = get();
      const found = data.usuarios.find(u => u.email === email);
      if (!found || (found as any)._pwd !== pwd) return null;
      set({ currentUser: found });
      return found;
    } catch {
      return null;
    }
  },

  // async logout() {
  //   try { await authService.logout(); } catch { /* network errors — still clear state */ }
  //   set({ currentUser: null, activeProjectId: null });
  // },
  async logout() {
    set({ currentUser: null, activeProjectId: null });
  },

  // async register({ nombre, empresa, giro, email, pwd }) {
  //   try {
  //     const { user: authUser, proyecto_id } = await authService.register({
  //       nombre, empresa, giro, email, password: pwd,
  //     });
  //     const user = toUser(authUser);
  //     const { data } = get();
  //     if (data.usuarios.find(u => u.email === email)) return null; // duplicate guard
  //     const newProj: Proyecto = {
  //       id: proyecto_id, cliente_id: user.id, consultor_id: null,
  //       cuestionario: {
  //         respondido: false,
  //         respuestas: { giro, emisiones: null, agua: null, residuos_peligrosos: false, residuos_especiales: false, obras: null },
  //         fecha: null,
  //       },
  //       tramites: [], alertas: [], instrucciones_admin: [], reuniones: [],
  //       iso14001: { secciones: {} },
  //       creado: today(), notas: '',
  //     };
  //     const updated: AppData = {
  //       usuarios:  [...data.usuarios, user],
  //       proyectos: [...data.proyectos, newProj],
  //     };
  //     persist(updated);
  //     set({ data: updated, currentUser: user, activeProjectId: proyecto_id });
  //     return user;
  //   } catch {
  //     return null;
  //   }
  // },
  async register({ nombre, empresa, giro, email, pwd }) {
    try {
      const { data } = get();

      // Duplicado
      if (data.usuarios.find(u => u.email === email)) return null;

      const proyecto_id = uid();
      const user: User = {
        id: uid(),
        nombre,
        empresa,
        email,
        rol: 'cliente',
        giro,
        proyecto_id,
      };

      const newProj: Proyecto = {
        id: proyecto_id, cliente_id: user.id, consultor_id: null,
        cuestionario: {
          respondido: false,
          respuestas: { giro, emisiones: null, agua: null, residuos_peligrosos: false, residuos_especiales: false, obras: null },
          fecha: null,
        },
        tramites: [], alertas: [], instrucciones_admin: [], reuniones: [],
        iso14001: { secciones: {} },
        creado: today(), notas: '',
      };

      const updated: AppData = {
        usuarios: [...data.usuarios, { ...user, _pwd: pwd } as any], // guarda pwd solo para mock
        proyectos: [...data.proyectos, newProj],
      };
      persist(updated);
      set({ data: updated, currentUser: user, activeProjectId: proyecto_id });
      return user;
    } catch (err) {
      console.error('[register mock]', err);
      return null;
    }
  },

  // async initSession() {
  //   set({ sessionLoading: true });
  //   try {
  //     const authUser = await authService.me();
  //     if (authUser) {
  //       const user    = toUser(authUser);
  //       const updated = upsertUser(get().data, user);
  //       // Persist only if the user was genuinely new to localStorage
  //       if (!get().data.usuarios.find(u => u.id === user.id)) persist(updated);
  //       set({ data: updated, currentUser: user });
  //     } else {
  //       set({ currentUser: null });
  //     }
  //   } catch {
  //     set({ currentUser: null });
  //   } finally {
  //     set({ sessionLoading: false });
  //   }
  // },
  async initSession() {
    // Sin servidor, no hay sesión persistente entre recargas
    set({ currentUser: null, sessionLoading: false });
  },

  // ── Workspace ──────────────────────────────────────────────────────────────

  setActiveProject(id) {
    set({ activeProjectId: id });
  },

  updateProject(partial) {
    const { data, activeProjectId } = get();
    if (!activeProjectId) return;
    const updated: AppData = {
      ...data,
      proyectos: data.proyectos.map(p =>
        p.id === activeProjectId ? { ...p, ...partial } : p,
      ),
    };
    persist(updated);
    set({ data: updated });
  },

  // ── Admin / Consultant ────────────────────────────────────────────────────

  async createClientWithProject({ nombre, empresa, giro, email, pwd: rawPwd, consultor_id, notas }) {
    const finalPwd = rawPwd || Math.random().toString(36).slice(2, 10);
    try {
      const proyId = uid();   // pre-generate so we can create the project right after
      const authUser = await authService.createUser({
        nombre, empresa, email, password: finalPwd,
        rol: 'cliente', giro, proyecto_id: proyId,
      });
      const user = toUser(authUser);
      const { data } = get();
      if (data.usuarios.find(u => u.email === email)) return null;
      const newProj: Proyecto = {
        id: user.proyecto_id ?? proyId,
        cliente_id: user.id,
        consultor_id: consultor_id || null,
        cuestionario: {
          respondido: false,
          respuestas: { giro, emisiones: null, agua: null, residuos_peligrosos: false, residuos_especiales: false, obras: null },
          fecha: null,
        },
        tramites: [], alertas: [], instrucciones_admin: [], reuniones: [],
        iso14001: { secciones: {} },
        creado: today(), notas,
      };
      const updated: AppData = {
        usuarios: [...data.usuarios, user],
        proyectos: [...data.proyectos, newProj],
      };
      persist(updated);
      set({ data: updated });
      return { user, pwd: finalPwd };
    } catch (err) {
      console.error('[createClientWithProject]', err);
      return null;
    }
  },

  async createConsultor({ nombre, email, pwd }) {
    try {
      const authUser = await authService.createUser({
        nombre, empresa: 'BIOIMPACT', email, password: pwd, rol: 'consultor',
      });
      const user = toUser(authUser);
      const updated = upsertUser(get().data, user);
      persist(updated);
      set({ data: updated });
      return user;
    } catch (err) {
      console.error('[createConsultor]', err);
      return null;
    }
  },

  async deleteUser(userId) {
    // Best-effort server deletion (may fail if user was never on server)
    try { await authService.deleteUser(userId); } catch { /* ignore */ }
    const { data } = get();
    const proj = data.proyectos.find(p => p.cliente_id === userId);
    const updated: AppData = {
      usuarios: data.usuarios.filter(u => u.id !== userId),
      proyectos: proj
        ? data.proyectos.filter(p => p.id !== proj.id)
        : data.proyectos.map(p => p.consultor_id === userId ? { ...p, consultor_id: null } : p),
    };
    persist(updated);
    set({ data: updated });
  },

  deleteProject(projectId) {
    const { data } = get();
    const proj = data.proyectos.find(p => p.id === projectId);
    const updated: AppData = {
      usuarios: proj ? data.usuarios.filter(u => u.id !== proj.cliente_id) : data.usuarios,
      proyectos: data.proyectos.filter(p => p.id !== projectId),
    };
    persist(updated);
    set({ data: updated });
  },

  assignConsultor(projectId, consultorId) {
    const { data } = get();
    const updated: AppData = {
      ...data,
      proyectos: data.proyectos.map(p =>
        p.id === projectId ? { ...p, consultor_id: consultorId } : p,
      ),
    };
    persist(updated);
    set({ data: updated });
  },
}));
