import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ESTADOS } from '@/constants/estados';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate, makeGCalLink, today, uid } from '@/lib/utils';
import {
  DIAS, DIAS_CORTOS, EVENT_META, MESES, groupByDate, mondayIndex, parseYmd, projectEvents, ymd,
  type CalEvent, type EventKind,
} from '@/lib/events';
import type { Reunion, Tramite } from '@/types';

type View = 'agenda' | 'gantt';

const H_START = 8;
const H_END   = 19;
const ROW_H   = 78;

function tzLabel() {
  const off = -new Date().getTimezoneOffset();
  const sign = off >= 0 ? '+' : '−';
  const a = Math.abs(off);
  return `UTC ${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

function hourLabel(h: number) {
  const suf = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}.00 ${suf}`;
}

function addMinutes(hora: string, min: number) {
  const [h, m] = hora.split(':').map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

const KIND_TAG: Record<EventKind, string> = {
  reunion: 'Evento', hito: 'Hito', hito_ok: 'Hito', limite: 'Límite', alerta: 'Alerta',
};

function statusTag(e: CalEvent, tramites: Tramite[]) {
  if (e.kind === 'hito_ok') return 'Hecho';
  if (e.kind === 'hito') return 'Pendiente';
  if (e.kind === 'reunion') return e.date < ymd(new Date()) ? 'Pasada' : 'Agendada';
  const t = tramites.find(x => x._id === e.tramiteId);
  return t ? (ESTADOS[t.estado]?.label.split(' ')[0] ?? '') : '';
}

/* ───────────────────────── Tarjeta de evento ───────────────────────── */

function EventCard({ e, tramites, onOpen, style }: {
  e: CalEvent; tramites: Tramite[]; onOpen?: () => void; style?: CSSProperties;
}) {
  const m = EVENT_META[e.kind];
  const time = e.hora ? `${e.hora} > ${addMinutes(e.hora, e.duracion ?? 60)}` : 'Todo el día';
  return (
    <button onClick={onOpen} disabled={!onOpen} style={{ background: m.bg, borderColor: m.border, ...style }}
      className="w-full overflow-hidden rounded-[3px] border px-3 py-2 text-left enabled:hover:brightness-[.98]">
      <span className="block truncate text-[14px] text-ink">{e.title}</span>
      <span className="block truncate text-[12px] text-stone-600">{time}</span>
      <span className="mt-1.5 flex justify-end gap-1.5">
        <span className="rounded-[3px] border border-stone-300 bg-white px-1.5 py-0.5 text-[11px] text-ink">{KIND_TAG[e.kind]}</span>
        {statusTag(e, tramites) && (
          <span className="rounded-[3px] border border-stone-300 bg-white px-1.5 py-0.5 text-[11px] text-ink">{statusTag(e, tramites)}</span>
        )}
      </span>
    </button>
  );
}

/* ───────────────────────── Vista agenda ───────────────────────── */

function Agenda({ events, tramites, onOpenTramite, onOpenReunion }: {
  events: CalEvent[]; tramites: Tramite[]; onOpenTramite: (id: string) => void; onOpenReunion: (id: string) => void;
}) {
  const todayStr = ymd(new Date());
  const [sel, setSel]     = useState(todayStr);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => events.filter(e => e.kind !== 'alerta'), [events]);
  const byDate  = useMemo(() => groupByDate(visible), [visible]);

  const selD   = parseYmd(sel);
  const monday = new Date(selD.getFullYear(), selD.getMonth(), selD.getDate() - mondayIndex(selD));
  const week   = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const weekStr = week.map(ymd);

  const y = month.getFullYear(), mo = month.getMonth();
  const lead = mondayIndex(new Date(y, mo, 1));
  const dim  = new Date(y, mo + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + dim) / 7) * 7 }, (_, i) => new Date(y, mo, i - lead + 1));

  const upcoming = visible
    .filter(e => e.date >= todayStr)
    .sort((a, b) => (a.date + (a.hora ?? '')).localeCompare(b.date + (b.hora ?? '')));
  const upShown = upcoming.slice(0, showAll ? 8 : 2);

  const inGrid = (e: CalEvent) => {
    if (!e.hora) return false;
    const h = Number(e.hora.split(':')[0]);
    return h >= H_START && h < H_END;
  };
  const hours = Array.from({ length: H_END - H_START }, (_, i) => H_START + i);
  const open = (e: CalEvent) =>
    e.kind === 'reunion' ? () => onOpenReunion(e.id.slice(2))
    : e.tramiteId ? () => onOpenTramite(e.tramiteId!)
    : undefined;

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-10">
      {/* Columna izquierda */}
      <aside className="w-full xl:w-[278px] flex-shrink-0 space-y-12">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-[17px] font-semibold text-ink">{MESES[mo]} {y}</h2>
            <div className="flex gap-2">
              <button onClick={() => setMonth(new Date(y, mo - 1, 1))} aria-label="Mes anterior"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50"><Icon n="cl" s={13} /></button>
              <button onClick={() => setMonth(new Date(y, mo + 1, 1))} aria-label="Mes siguiente"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200"><Icon n="cr" s={13} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] text-stone-400 mb-1">
            {DIAS_CORTOS.map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 border-t border-stone-100">
            {cells.map(d => {
              const ds = ymd(d);
              const other = d.getMonth() !== mo;
              const isSel = ds === sel;
              const ev = byDate[ds] ?? [];
              const kinds = Array.from(new Set(ev.map(e => e.kind))).slice(0, 3);
              return (
                <button key={ds} onClick={() => { setSel(ds); if (other) setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}
                  className={`relative flex h-9 flex-col items-center justify-center border-b border-r border-stone-100 text-[13px]
                    ${isSel ? 'bg-green-50 text-green-600 font-semibold' : other ? 'text-stone-300' : ds === todayStr ? 'text-ink font-semibold' : 'text-ink'}
                    ${weekStr.includes(ds) && !isSel ? 'bg-stone-50' : ''}`}>
                  {d.getDate()}
                  {kinds.length > 0 && (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {kinds.map(k => <span key={k} className="h-1 w-1 rounded-full" style={{ background: EVENT_META[k].color }} />)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-sans text-[17px] font-semibold text-ink mb-3">Categoría</h2>
          <div className="flex flex-wrap gap-2">
            {(['reunion', 'hito', 'hito_ok', 'limite'] as EventKind[]).map(k => (
              <span key={k} className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[14px] text-ink">
                <span className="h-2 w-2 rounded-full" style={{ background: EVENT_META[k].color }} />{EVENT_META[k].label}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-sans text-[17px] font-semibold text-ink">Próximos eventos</h2>
          <p className="flex items-center gap-1.5 text-[12px] text-stone-500 mb-3">
            <Icon n="info" s={13} />Lo que viene en tu calendario
          </p>
          {upShown.length === 0 ? (
            <p className="text-sm text-stone-500 py-4">No hay nada programado. Agrega un evento o pon fechas en el detalle de cada trámite.</p>
          ) : (
            <div className="space-y-3">
              {upShown.map(e => (
                <button key={e.id} onClick={open(e)} disabled={!open(e)}
                  className="flex w-full overflow-hidden rounded-lg bg-stone-100/80 text-left enabled:hover:bg-stone-100">
                  <span className="w-2.5 flex-shrink-0" style={{ background: EVENT_META[e.kind].color }} />
                  <span className="min-w-0 flex-1 px-3 py-2.5">
                    <span className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1"><Icon n="clock" s={12} />{e.hora ? `${e.hora} - ${addMinutes(e.hora, e.duracion ?? 60)}` : 'Todo el día'}</span>
                      <span>{fmtDate(e.date)}</span>
                    </span>
                    <span className="mt-1 block text-[14px] font-semibold leading-snug text-ink line-clamp-3">{e.title}</span>
                    {e.detail && (
                      <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-stone-500">
                        <Icon n="pin" s={12} />
                        <span className="truncate">{e.detail}</span>
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          {upcoming.length > 2 && (
            <div className="mt-4 flex justify-center">
              <button onClick={() => setShowAll(s => !s)}
                className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold text-ink hover:bg-stone-50">
                {showAll ? 'Ver menos' : 'Ver más'}
              </button>
            </div>
          )}
        </section>
      </aside>

      {/* Semana */}
      <section className="min-w-0 flex-1 overflow-x-auto">
        <div className="min-w-[980px] border-l border-t border-stone-200">
          {/* Cabecera */}
          <div className="grid grid-cols-[76px_repeat(7,minmax(0,1fr))] border-b border-stone-200">
            <div className="flex items-center justify-center border-r border-stone-200 px-1 text-center text-[12px] text-ink leading-tight">
              {tzLabel()}
            </div>
            {week.map((d, i) => {
              const ds = weekStr[i];
              const n = (byDate[ds] ?? []).length;
              const weekend = i >= 5;
              const isToday = ds === todayStr;
              return (
                <button key={ds} onClick={() => setSel(ds)}
                  className={`flex items-center gap-2.5 border-r border-stone-200 px-3 py-4 text-left ${ds === sel ? 'bg-green-50/60' : 'hover:bg-stone-50'}`}>
                  <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-display text-[15px] font-semibold
                    ${isToday ? 'bg-green-600 text-white' : 'bg-stone-100 text-ink'}`}>{d.getDate()}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-ink" title={DIAS[i]}>{DIAS[i].slice(0, 3)}</span>
                    {weekend
                      ? <span className="mt-0.5 inline-block whitespace-nowrap rounded bg-red-50 px-1.5 text-[10px] font-medium text-red-600">Inhábil</span>
                      : <span className="block whitespace-nowrap text-[12px] text-stone-500">{n === 0 ? '—' : `${n} actividad${n === 1 ? '' : 'es'}`}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Todo el día */}
          <div className="grid grid-cols-[76px_repeat(7,minmax(0,1fr))] border-b border-stone-200">
            <div className="border-r border-stone-200 px-2 pt-3 text-center text-[12px] text-ink">Todo el día</div>
            {weekStr.map((ds, i) => {
              const items = (byDate[ds] ?? []).filter(e => !inGrid(e));
              return (
                <div key={ds} className={`min-h-[64px] space-y-1.5 border-r border-stone-200 p-1.5 ${i >= 5 ? 'striped' : ''}`}>
                  {items.map(e => <EventCard key={e.id} e={e} tramites={tramites} onOpen={open(e)} />)}
                </div>
              );
            })}
          </div>

          {/* Horas */}
          <div className="grid grid-cols-[76px_repeat(7,minmax(0,1fr))]">
            <div className="border-r border-stone-200">
              {hours.map(h => (
                <div key={h} className="border-b border-stone-200 pt-3 text-center text-[12px] text-ink" style={{ height: ROW_H }}>{hourLabel(h)}</div>
              ))}
            </div>
            {weekStr.map((ds, i) => {
              const items = (byDate[ds] ?? []).filter(inGrid);
              return (
                <div key={ds} className={`relative border-r border-stone-200 ${i >= 5 ? 'striped' : ''}`}>
                  {hours.map(h => <div key={h} className="border-b border-stone-200" style={{ height: ROW_H }} />)}
                  {items.map(e => {
                    const [hh, mm] = e.hora!.split(':').map(Number);
                    const top = ((hh - H_START) + mm / 60) * ROW_H + 4;
                    const height = Math.max(ROW_H - 8, ((e.duracion ?? 60) / 60) * ROW_H - 8);
                    return (
                      <div key={e.id} className="absolute left-1.5 right-1.5" style={{ top, height }}>
                        <EventCard e={e} tramites={tramites} onOpen={open(e)} style={{ height: '100%' }} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────────────────────── Vista Gantt ───────────────────────── */

function Gantt({ tramites, onOpenTramite }: { tramites: Tramite[]; onOpenTramite: (id: string) => void }) {
  const allD = tramites.flatMap(t => [t.cronograma?.inicio, t.cronograma?.fin, t.fecha_limite].filter(Boolean) as string[]);
  const hasAny = allD.length > 0;
  const minD = hasAny ? new Date(Math.min(...allD.map(d => new Date(d).getTime()))) : new Date();
  const maxD = hasAny ? new Date(Math.max(...allD.map(d => new Date(d).getTime()))) : new Date(Date.now() + 60 * 864e5);
  const start = new Date(minD); start.setDate(start.getDate() - 7);
  const end   = new Date(maxD); end.setDate(end.getDate() + 14);

  const pct = (d: string) =>
    Math.max(0, Math.min(100, Math.round((new Date(d).getTime() - start.getTime()) / (end.getTime() - start.getTime()) * 100)));
  const wid = (s: string, e2: string) => Math.max(1, pct(e2) - pct(s));

  const months: { label: string; pct: number }[] = [];
  const tmp = new Date(start);
  while (tmp <= end) {
    const l = tmp.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    const p = pct(tmp.toISOString().slice(0, 10));
    if (!months.length || months[months.length - 1].label !== l) months.push({ label: l, pct: p });
    tmp.setDate(tmp.getDate() + 7);
  }

  return (
    <div className="overflow-x-auto border-t-2 border-stone-200">
      <div className="min-w-[860px]">
        <div className="flex border-b border-stone-200 py-3 text-[11px] text-stone-500">
          <div className="w-64 flex-shrink-0 pl-3 font-medium">Trámite</div>
          <div className="relative flex-1 h-4">
            {months.map((m, i) => <span key={i} className="absolute" style={{ left: `${m.pct}%` }}>{m.label}</span>)}
          </div>
          <div className="w-28 flex-shrink-0 pr-3 text-right font-medium">Fechas</div>
        </div>
        {tramites.map(t => {
          const e = ESTADOS[t.estado] ?? ESTADOS.no_iniciado;
          const ini = t.cronograma?.inicio;
          const fin = t.cronograma?.fin ?? t.fecha_limite;
          return (
            <div key={t._id} className="tram-row flex items-center">
              <button className="w-64 flex-shrink-0 py-3 pl-3 pr-4 text-left" onClick={() => onOpenTramite(t._id)}>
                <span className="block truncate text-[13px] text-ink hover:text-green-700">{t.nombre}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />{e.label}
                </span>
              </button>
              <div className="relative flex-1 h-11">
                {ini && fin && (
                  <div className="absolute top-3 h-5 rounded-[3px]"
                    style={{ left: `${pct(ini)}%`, width: `${wid(ini, fin)}%`, background: e.color, minWidth: 4 }} />
                )}
                {(t.cronograma?.hitos ?? []).filter(h => h.fecha).map(h => (
                  <div key={h.id} title={h.nombre}
                    className="absolute top-[15px] h-3 w-3 rotate-45 border-2 border-white"
                    style={{ left: `calc(${pct(h.fecha)}% - 6px)`, background: h.completado ? '#659A49' : '#F3BE2A' }} />
                ))}
                {t.fecha_limite && (
                  <div className="absolute top-1 h-9 w-px bg-red-500" style={{ left: `${pct(t.fecha_limite)}%` }} />
                )}
                {!ini && <span className="absolute left-3 top-3.5 text-[11px] text-stone-400">Sin fechas</span>}
              </div>
              <div className="w-28 flex-shrink-0 pr-3 text-right text-[11px] text-stone-500 leading-tight">
                <div>{ini ? fmtDate(ini) : '—'}</div>
                <div>{fin ? fmtDate(fin) : '—'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Página ───────────────────────── */

/* ───────────────────────── Eventos propios ───────────────────────── */

const EMPTY_FORM = { titulo: '', fecha: '', hora: '10:00', duracion: '60', agenda: '' };

function EventModal({ editing, onClose, onSave, onDelete }: {
  editing: Reunion | null;
  onClose: () => void;
  onSave: (r: Reunion) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState(() => editing
    ? { titulo: editing.titulo, fecha: editing.fecha, hora: editing.hora, duracion: editing.duracion, agenda: editing.agenda }
    : EMPTY_FORM);
  const [err, setErr] = useState('');

  const save = () => {
    const titulo = form.titulo.trim();
    if (!titulo || !form.fecha) { setErr('Pon un título y una fecha.'); return; }
    const hora = form.hora || '10:00';
    onSave({
      id: editing?.id ?? uid(),
      titulo, fecha: form.fecha, hora, duracion: form.duracion, agenda: form.agenda.trim(),
      gcal_link: makeGCalLink(titulo, form.fecha, hora, form.duracion, form.agenda.trim(), ''),
      creado: editing?.creado ?? today(),
    });
  };

  return (
    <Modal open onClose={onClose} title={editing ? 'Editar evento' : 'Nuevo evento'} width="max-w-lg">
      <div className="space-y-4">
        <Input label="Título" value={form.titulo} onChange={v => setForm(f => ({ ...f, titulo: v }))}
          placeholder="Visita de inspección, reunión con proveedor…" required />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Fecha" type="date" value={form.fecha} onChange={v => setForm(f => ({ ...f, fecha: v }))} required />
          <Input label="Hora" type="time" value={form.hora} onChange={v => setForm(f => ({ ...f, hora: v }))} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-stone-700">Duración</span>
            <select value={form.duracion} onChange={e => setForm(f => ({ ...f, duracion: e.target.value }))}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600">
              {[['30', '30 min'], ['60', '1 hora'], ['90', '1.5 h'], ['120', '2 h'], ['240', '4 h']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-stone-700">Notas o lugar</span>
          <textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} rows={3}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" />
        </label>
        {err && <p role="alert" className="text-[13px] text-red-700">{err}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex gap-1">
            {editing && <Btn variant="ghost" className="!text-red-600" onClick={() => onDelete(editing.id)}>Eliminar</Btn>}
            {editing?.gcal_link && (
              <a href={editing.gcal_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-md px-3 text-sm font-semibold text-stone-600 hover:bg-stone-100">
                Google Calendar
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
            <Btn onClick={save}>Guardar</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Página ───────────────────────── */

type ModalState = { editing: Reunion | null } | null;

export default function CronogramaPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { data, updateProject } = useAppStore();
  const [view, setView]   = useState<View>('agenda');
  const [modal, setModal] = useState<ModalState>(null);

  const proj      = data.proyectos.find(p => p.id === projectId);
  const tramites  = proj?.tramites ?? [];
  const reuniones = proj?.reuniones ?? [];
  const events    = useMemo(() => (proj ? projectEvents(proj) : []), [proj]);
  const openTramite = (id: string) => navigate(`/proyecto/${projectId}/tramites/${id}`);
  const openReunion = (id: string) => setModal({ editing: reuniones.find(r => r.id === id) ?? null });

  const saveReunion = (r: Reunion) => {
    const exists = reuniones.some(x => x.id === r.id);
    updateProject({ reuniones: exists ? reuniones.map(x => (x.id === r.id ? r : x)) : [...reuniones, r] });
    setModal(null);
  };
  const deleteReunion = (id: string) => {
    updateProject({ reuniones: reuniones.filter(r => r.id !== id) });
    setModal(null);
  };

  return (
    <div className="px-4 lg:px-6 pt-8 fade-in">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-display text-[20px] font-medium text-ink">
          {view === 'agenda' ? 'Agenda' : 'Cronograma de trámites'}
        </h1>
        <Btn onClick={() => setModal({ editing: null })}><Icon n="plus" s={15} />Nuevo evento</Btn>
        <div className="flex rounded-md border border-stone-200 p-0.5 text-sm">
          {(['agenda', 'gantt'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded px-3 py-1.5 ${view === v ? 'bg-ink text-white' : 'text-stone-600 hover:text-ink'}`}>
              {v === 'agenda' ? 'Semana' : 'Gantt'}
            </button>
          ))}
        </div>
      </div>

      {view === 'agenda'
        ? <Agenda events={events} tramites={tramites} onOpenTramite={openTramite} onOpenReunion={openReunion} />
        : tramites.length
          ? <Gantt tramites={tramites} onOpenTramite={openTramite} />
          : <p className="py-20 text-center text-stone-500">Sin trámites todavía. Completa el diagnóstico para verlos aquí.</p>}

      {modal && (
        <EventModal key={modal.editing?.id ?? 'nuevo'} editing={modal.editing}
          onClose={() => setModal(null)} onSave={saveReunion} onDelete={deleteReunion} />
      )}
    </div>
  );
}
