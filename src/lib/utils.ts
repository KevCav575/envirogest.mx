import type { CuestionarioRespuestas, Tramite } from '@/types';
import { TRAMITES_CATALOG } from '@/constants/tramites';

// hashPwd removed — passwords are hashed server-side with bcrypt (cost 12).

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Arma la lista de trámites que aplican según el diagnóstico.
 * Si se pasa la lista actual, conserva el avance (pasos, anexos, fechas, notas)
 * de los trámites que siguen aplicando.
 */
export function generateTramites(resp: CuestionarioRespuestas, actuales: Tramite[] = []): Tramite[] {
  return TRAMITES_CATALOG
    .filter(c => c.condicion(resp))
    .map(c => {
      const previo = actuales.find(t => t.id === c.id);
      if (previo) return previo;
      return {
        _id: uid(),
        id: c.id, nombre: c.nombre, autoridad: c.autoridad, nivel: c.nivel,
        base_legal: c.base_legal, descripcion: c.descripcion,
        estado: 'no_iniciado' as const,
        fecha_limite: null,
        cronograma: { inicio: null, fin: null, hitos: [], notas: '', dependencias: [] },
        pasos_hechos: [],
        anexos: [],
        notas2: [],
      };
    });
}

export function makeGCalLink(
  titulo: string,
  fecha: string,
  hora: string,
  duracion: string,
  agenda: string,
  email: string,
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const [y, m, d] = fecha.split('-');
  const [h, mi] = hora.split(':');
  const start = `${y}${m}${d}T${h}${mi}00`;
  const endMs = new Date(`${fecha}T${hora}:00`).getTime() + parseInt(duracion) * 60000;
  const ed = new Date(endMs);
  const end = `${ed.getFullYear()}${pad(ed.getMonth() + 1)}${pad(ed.getDate())}T${pad(ed.getHours())}${pad(ed.getMinutes())}00`;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${start}/${end}`,
    details: agenda || 'Reunión de seguimiento ambiental · EnviroGest MX',
  });
  if (email) p.append('add', email);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
