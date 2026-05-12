export interface Giro {
  id: string;
  label: string;
  art28: boolean;
  color: string;
}

export const GIROS: Giro[] = [
  { id: 'manufactura', label: 'Manufactura metálica / Automotriz', art28: true,  color: '#3B82F6' },
  { id: 'quimica',     label: 'Química / Petroquímica',             art28: true,  color: '#8B5CF6' },
  { id: 'alimentos',   label: 'Alimentos y bebidas',                art28: false, color: '#F59E0B' },
  { id: 'construccion',label: 'Construcción',                       art28: false, color: '#EF4444' },
  { id: 'mineria',     label: 'Minería / Extracción',               art28: true,  color: '#78716C' },
  { id: 'plasticos',   label: 'Plásticos / Hule',                   art28: false, color: '#06B6D4' },
  { id: 'logistica',   label: 'Logística / Transporte',             art28: false, color: '#10B981' },
  { id: 'textil',      label: 'Textil / Confección',                art28: false, color: '#EC4899' },
  { id: 'electronica', label: 'Electrónica / Manufactura ligera',   art28: false, color: '#6366F1' },
  { id: 'otro',        label: 'Otro giro industrial',               art28: false, color: '#9CA3AF' },
];

export function giroLabel(id: string): string {
  return GIROS.find(g => g.id === id)?.label ?? id;
}

export function giroColor(id: string): string {
  return GIROS.find(g => g.id === id)?.color ?? '#9CA3AF';
}
