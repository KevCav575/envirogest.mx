/**
 * Modelo de autogestión: cada cuenta pertenece a una empresa y su único rol
 * es `propietario`, con control total sobre su propio espacio de trabajo.
 * El tipo se deja como unión para poder sumar roles internos más adelante
 * (p. ej. 'editor' o 'lector') sin tocar la forma del token.
 */
export type UserRole = 'propietario';

export interface StoredUser {
  id:          string;
  nombre:      string;
  empresa:     string;
  email:       string;
  pwd_hash:    string;   // hash bcrypt — NUNCA se envía al cliente
  rol:         UserRole;
  giro?:       string;
  /** Espacio de trabajo (proyecto) de la empresa. */
  proyecto_id: string;
  created_at:  string;
}

export interface UserStore {
  users: StoredUser[];
}

export interface JwtPayload {
  sub:         string;     // id del usuario
  rol:         UserRole;
  proyecto_id: string;     // espacio de trabajo al que pertenece la sesión
  iat?: number;
  exp?: number;
}

/** Forma que se devuelve al cliente — sin pwd_hash ni created_at */
export type SafeUser = Omit<StoredUser, 'pwd_hash' | 'created_at'>;
