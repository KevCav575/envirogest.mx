export type UserRole = 'admin' | 'consultor' | 'cliente';

export interface User {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  /** Password hash is managed server-side (bcrypt). Never stored in the browser. */
  pwd_hash?: string;
  rol: UserRole;
  giro?: string;
  proyecto_id?: string;
}

export interface Hito {
  id: string;
  nombre: string;
  fecha: string;
  completado: boolean;
}

export interface Cronograma {
  inicio: string | null;
  fin: string | null;
  hitos: Hito[];
  notas: string;
  dependencias: string[];
}

export interface Nota {
  id: string;
  texto: string;
  fecha: string;
}

export type TramiteEstado =
  | 'no_iniciado'
  | 'recopilando'
  | 'ingresado'
  | 'en_revision'
  | 'cumplido'
  | 'vencido';

export type TramiteNivel = 'federal' | 'estatal' | 'municipal';

export interface Tramite {
  _id: string;
  id: string;
  nombre: string;
  autoridad: string;
  nivel: TramiteNivel;
  base_legal: string;
  descripcion: string;
  estado: TramiteEstado;
  fecha_limite: string | null;
  cronograma: Cronograma;
  documentos: string[];
  notas2: Nota[];
}

export type AlertaTipo = 'vencimiento' | 'solicitud' | 'firma' | 'visita' | 'estado' | 'info';

export interface Alerta {
  id: string;
  tipo: AlertaTipo;
  mensaje: string;
  fecha: string;
  leido: boolean;
  tramite_id: string | null;
}

export interface Instruccion {
  id: string;
  texto: string;
  urgente: boolean;
  fecha: string;
  leido: boolean;
}

export interface Reunion {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  duracion: string;
  agenda: string;
  gcal_link: string;
  creado: string;
}

export type ISO14001Secciones = Record<string, Record<string, boolean>>;

export interface ISO14001 {
  secciones: ISO14001Secciones;
}

export interface CuestionarioRespuestas {
  giro: string;
  emisiones: boolean | null;
  agua: boolean | null;
  residuos_peligrosos: boolean;
  residuos_especiales: boolean;
  obras: boolean | null;
}

export interface Cuestionario {
  respondido: boolean;
  respuestas: CuestionarioRespuestas;
  fecha: string | null;
}

export interface Proyecto {
  id: string;
  cliente_id: string;
  consultor_id: string | null;
  cuestionario: Cuestionario;
  tramites: Tramite[];
  alertas: Alerta[];
  instrucciones_admin: Instruccion[];
  reuniones: Reunion[];
  iso14001: ISO14001;
  creado: string;
  notas: string;
}

export interface AppData {
  usuarios: User[];
  proyectos: Proyecto[];
}
