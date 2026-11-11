import type { Proyecto } from '@/types';

export type EventKind = 'reunion' | 'hito' | 'hito_ok' | 'limite' | 'alerta';

export interface CalEvent {
  id: string;
  date: string;          // YYYY-MM-DD
  kind: EventKind;
  title: string;
  detail?: string;
  hora?: string;         // HH:MM (solo reuniones)
  duracion?: number;     // minutos (solo reuniones)
  tramiteId?: string;
  link?: string;
}

export const EVENT_META: Record<EventKind, { label: string; color: string; bg: string; border: string }> = {
  reunion: { label: 'Evento',           color: '#2563EB', bg: '#EEF3FE', border: '#C9D8FB' },
  hito:    { label: 'Hito pendiente',   color: '#B7791F', bg: '#FFF9E8', border: '#F5E3AE' },
  hito_ok: { label: 'Hito completado',  color: '#4E8A3A', bg: '#F1F8EC', border: '#CFE5C1' },
  limite:  { label: 'Fecha límite',     color: '#C2410C', bg: '#FFF1EC', border: '#F8D2C3' },
  alerta:  { label: 'Alerta',           color: '#7C3AED', bg: '#F6F0FF', border: '#E1D2FB' },
};

/** Fecha local en formato YYYY-MM-DD (sin desfase por UTC). */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function projectEvents(proj: Proyecto): CalEvent[] {
  const out: CalEvent[] = [];
  for (const t of proj.tramites ?? []) {
    for (const h of t.cronograma?.hitos ?? []) {
      if (!h.fecha) continue;
      out.push({
        id: `h_${t._id}_${h.id}`, date: h.fecha, kind: h.completado ? 'hito_ok' : 'hito',
        title: h.nombre || 'Hito', detail: t.nombre, tramiteId: t._id,
      });
    }
    if (t.fecha_limite && t.estado !== 'cumplido') {
      out.push({ id: `l_${t._id}`, date: t.fecha_limite, kind: 'limite', title: t.nombre, detail: t.autoridad, tramiteId: t._id });
    }
  }
  for (const r of proj.reuniones ?? []) {
    if (!r.fecha) continue;
    out.push({
      id: `r_${r.id}`, date: r.fecha, kind: 'reunion', title: r.titulo,
      detail: r.agenda || undefined, hora: r.hora, duracion: parseInt(r.duracion) || 60, link: r.gcal_link,
    });
  }
  for (const a of proj.alertas ?? []) {
    const d = a.fecha?.slice(0, 10);
    if (!d || a.leido) continue;
    out.push({ id: `a_${a.id}`, date: d, kind: 'alerta', title: a.mensaje, tramiteId: a.tramite_id ?? undefined });
  }
  return out;
}

export function groupByDate(events: CalEvent[]): Record<string, CalEvent[]> {
  const m: Record<string, CalEvent[]> = {};
  for (const e of events) (m[e.date] ??= []).push(e);
  return m;
}

export const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const DIAS_CORTOS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Índice de día con lunes = 0. */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}
