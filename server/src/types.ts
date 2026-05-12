export type UserRole = 'admin' | 'consultor' | 'cliente';

export interface StoredUser {
  id:          string;
  nombre:      string;
  empresa:     string;
  email:       string;
  pwd_hash:    string;   // bcrypt hash — NEVER sent to the client
  rol:         UserRole;
  giro?:       string;
  proyecto_id?: string;
  created_at:  string;
}

export interface UserStore {
  users: StoredUser[];
}

export interface JwtPayload {
  sub: string;     // user id
  rol: UserRole;
  iat?: number;
  exp?: number;
}

/** Shape returned to the client — no pwd_hash, no created_at */
export type SafeUser = Omit<StoredUser, 'pwd_hash' | 'created_at'>;
