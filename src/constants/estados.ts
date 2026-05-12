import type { TramiteEstado } from '@/types';

export interface EstadoInfo {
  label: string;
  color: string;
  bg: string;
  pct: number;
}

export const ESTADOS: Record<TramiteEstado, EstadoInfo> = {
  no_iniciado: { label: 'No iniciado',           color: '#9CA3AF', bg: '#F3F4F6', pct: 0   },
  recopilando: { label: 'Recopilando documentos', color: '#F59E0B', bg: '#FFFBEB', pct: 25  },
  ingresado:   { label: 'Trámite ingresado',      color: '#3B82F6', bg: '#EFF6FF', pct: 50  },
  en_revision: { label: 'En revisión autoridad',  color: '#8B5CF6', bg: '#F5F3FF', pct: 75  },
  cumplido:    { label: 'Cumplido / Vigente',      color: '#10B981', bg: '#ECFDF5', pct: 100 },
  vencido:     { label: 'Vencido',                 color: '#DC2626', bg: '#FEF2F2', pct: 0   },
};

export const TRAM_ESTADO_LABELS: Record<string, [string, string]> = {
  no_aplica:   ['No aplica',        '#9CA3AF'],
  recopilando: ['Recopilando docs', '#F59E0B'],
  ingresado:   ['Ingresado',        '#3B82F6'],
  en_revision: ['En revisión',      '#8B5CF6'],
  resolucion:  ['Resolución',       '#06B6D4'],
  cumplido:    ['Cumplido',         '#10B981'],
  vencido:     ['VENCIDO',          '#EF4444'],
};
