import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { EVENT_META, MESES, DIAS_CORTOS, groupByDate, mondayIndex, parseYmd, ymd, type CalEvent, type EventKind } from '@/lib/events';

interface CalendarWidgetProps {
  events: CalEvent[];
  onOpenAgenda?: () => void;
  onOpenTramite?: (id: string) => void;
}

/** Color de la celda: gana el evento más urgente del día. */
const CELL: { kind: EventKind; bg: string; fg: string; label: string }[] = [
  { kind: 'limite',  bg: '#4A4A4A', fg: '#fff',    label: 'Fecha límite' },
  { kind: 'reunion', bg: '#5257CF', fg: '#fff',    label: 'Reunión' },
  { kind: 'hito',    bg: '#F3BE2A', fg: '#141414', label: 'Hito pendiente' },
  { kind: 'hito_ok', bg: '#659A49', fg: '#fff',    label: 'Hito completado' },
];

export function CalendarWidget({ events, onOpenAgenda, onOpenTramite }: CalendarWidgetProps) {
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<string | null>(null);

  const year  = cur.getFullYear();
  const month = cur.getMonth();
  const lead  = mondayIndex(new Date(year, month, 1));
  const days  = new Date(year, month + 1, 0).getDate();
  const todayStr = ymd(new Date());

  const byDate = useMemo(() => groupByDate(events.filter(e => e.kind !== 'alerta')), [events]);

  const move = (delta: number) => { setCur(new Date(year, month + delta, 1)); setSel(null); };

  const selEvents = sel ? byDate[sel] ?? [] : [];

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-[17px] font-semibold text-ink">Calendario</h2>
        {onOpenAgenda && (
          <button onClick={onOpenAgenda} aria-label="Abrir agenda"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-ink hover:bg-stone-50">
            <Icon n="calClock" s={18} w={1.5} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <button onClick={() => move(-1)} aria-label="Mes anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-ink hover:bg-green-700">
          <Icon n="arrowL" s={16} w={1.8} />
        </button>
        <p className="font-display text-[16px] font-medium text-ink">
          {MESES[month]} <span className="text-stone-400">{year}</span>
        </p>
        <button onClick={() => move(1)} aria-label="Mes siguiente"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-ink hover:bg-green-700">
          <Icon n="arrowR" s={16} w={1.8} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
        {DIAS_CORTOS.map((d, i) => (
          <div key={i} className="py-1 text-center text-[11px] font-medium text-stone-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: lead }, (_, i) => <div key={'e' + i} className="bg-stone-50" />)}
        {Array.from({ length: days }, (_, i) => i + 1).map(d => {
          const ds  = ymd(new Date(year, month, d));
          const ev  = byDate[ds] ?? [];
          const hit = CELL.find(c => ev.some(e => e.kind === c.kind));
          const isToday = ds === todayStr;
          const bg = isToday ? '#7DBEFF' : hit?.bg ?? '#DADADA';
          const fg = isToday ? '#141414' : hit?.fg ?? '#141414';
          return (
            <button key={d} onClick={() => setSel(sel === ds ? null : ds)}
              aria-label={`${d} de ${MESES[month]}${ev.length ? `, ${ev.length} actividad(es)` : ''}`}
              className={`relative flex h-[74px] sm:h-[94px] items-end justify-center pb-3 font-display text-[15px] font-bold transition-[filter] hover:brightness-95
                ${sel === ds ? 'outline outline-2 -outline-offset-2 outline-ink' : ''}`}
              style={{ background: bg, color: fg }}>
              {d}
              {ev.length > 1 && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold opacity-80">{ev.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-stone-500"><span className="h-2.5 w-2.5" style={{ background: '#7DBEFF' }} />Hoy</span>
        {CELL.map(c => (
          <span key={c.kind} className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="h-2.5 w-2.5" style={{ background: c.bg }} />{c.label}
          </span>
        ))}
      </div>

      {sel && (
        <div className="mt-4 border-t border-stone-200 pt-4">
          <p className="text-sm font-semibold text-ink mb-2">
            {parseYmd(sel).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {selEvents.length === 0 ? (
            <p className="text-sm text-stone-500">Nada programado este día.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {selEvents.map(e => (
                <li key={e.id}>
                  <button disabled={!e.tramiteId || !onOpenTramite}
                    onClick={() => e.tramiteId && onOpenTramite?.(e.tramiteId)}
                    className="flex w-full items-start gap-3 py-2 text-left enabled:hover:bg-stone-50">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: EVENT_META[e.kind].color }} />
                    <span className="min-w-0">
                      <span className="block text-sm text-ink">{e.hora ? `${e.hora} · ` : ''}{e.title}</span>
                      <span className="block text-xs text-stone-500">{EVENT_META[e.kind].label}{e.detail ? ` · ${e.detail}` : ''}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
