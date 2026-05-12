import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { fmtDate } from '@/lib/utils';
import type { Tramite, Alerta } from '@/types';

interface CalendarWidgetProps {
  tramites: Tramite[];
  alertas:  Alerta[];
}

interface CalEvent { type: 'hito' | 'limit' | 'alert'; done?: boolean; }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function CalendarWidget({ tramites, alertas }: CalendarWidgetProps) {
  const [cur, setCur] = useState(new Date());
  const [sel, setSel] = useState<number | null>(null);
  const year  = cur.getFullYear();
  const month = cur.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayD      = new Date();

  const events = useMemo(() => {
    const m: Record<string, CalEvent[]> = {};
    tramites.forEach(t => {
      (t.cronograma?.hitos ?? []).forEach(h => {
        if (h.fecha) (m[h.fecha] ??= []).push({ type: 'hito', done: h.completado });
      });
      if (t.fecha_limite) (m[t.fecha_limite] ??= []).push({ type: 'limit' });
    });
    alertas.forEach(a => {
      const d = a.fecha?.slice(0, 10);
      if (d) (m[d] ??= []).push({ type: 'alert' });
    });
    return m;
  }, [tramites, alertas]);

  const selStr = sel
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(sel).padStart(2, '0')}`
    : null;

  const eventColor = (e: CalEvent) =>
    e.type === 'alert' ? '#DC2626' : e.type === 'limit' ? '#F59E0B' : e.done ? '#10B981' : '#F59E0B';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{MESES[month]} {year}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCur(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <Icon n="cl" s={14} />
          </button>
          <button onClick={() => setCur(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <Icon n="cr" s={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['D','L','M','X','J','V','S'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array(firstDay).fill(null).map((_, i) => <div key={'e' + i} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const ev = events[ds] ?? [];
          const isToday = todayD.getDate() === d && todayD.getMonth() === month && todayD.getFullYear() === year;
          return (
            <button
              key={d}
              onClick={() => setSel(sel === d ? null : d)}
              className={`flex flex-col items-center p-1 rounded-lg text-xs transition-all
                ${isToday ? 'bg-green-800 text-white font-bold' : sel === d ? 'bg-green-50 ring-1 ring-green-400 text-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{d}</span>
              {ev.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {ev.slice(0, 3).map((e, i) => (
                    <span key={i} className="w-1 h-1 rounded-full" style={{ background: eventColor(e) }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {sel && selStr && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-1">{fmtDate(selStr)}</p>
          {(events[selStr] ?? []).length === 0
            ? <p className="text-xs text-gray-400">Sin actividades</p>
            : (events[selStr] ?? []).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: eventColor(e) }} />
                  <span>{e.type === 'alert' ? 'Alerta' : e.type === 'limit' ? 'Fecha límite' : e.done ? 'Hito completado' : 'Hito pendiente'}</span>
                </div>
              ))
          }
        </div>
      )}

      <div className="flex gap-4 mt-3 pt-2 border-t border-gray-100">
        {[{ c: '#10B981', l: 'Completado' }, { c: '#F59E0B', l: 'Pendiente' }, { c: '#DC2626', l: 'Alerta' }].map(x => (
          <div key={x.l} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: x.c }} />
            <span className="text-[10px] text-gray-400">{x.l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
