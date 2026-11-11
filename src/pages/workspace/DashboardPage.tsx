import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { CalendarWidget } from '@/components/CalendarWidget';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate } from '@/lib/utils';
import { projectEvents } from '@/lib/events';
import type { Tramite } from '@/types';

const EN_PROCESO = ['recopilando', 'ingresado', 'en_revision'];

/** Botón circular negro con flecha diagonal (esquina de las tarjetas). */
function ArrowBtn({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} aria-label={label}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-black">
      <Icon n="arrowUR" s={16} w={1.8} />
    </Link>
  );
}

/** Anillo de estados de trámites. */
function Donut({ tramites }: { tramites: Tramite[] }) {
  const parts = [
    { l: 'Cumplidos',   c: '#43846A', v: tramites.filter(t => t.estado === 'cumplido').length },
    { l: 'En proceso',  c: '#F29A1D', v: tramites.filter(t => EN_PROCESO.includes(t.estado)).length },
    { l: 'Sin iniciar', c: '#6A5ACD', v: tramites.filter(t => t.estado === 'no_iniciado').length },
    { l: 'Vencidos',    c: '#D9483B', v: tramites.filter(t => t.estado === 'vencido').length },
  ].filter(p => p.v > 0 || p.l !== 'Vencidos');

  const total = tramites.length;
  const R = 62, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div>
      <div className="relative mx-auto w-[164px] h-[164px]">
        <svg viewBox="0 0 164 164" className="w-full h-full -rotate-90">
          <circle cx="82" cy="82" r={R} fill="none" stroke="#E2DED7" strokeWidth="34" />
          {total > 0 && parts.map(p => {
            const len = (p.v / total) * C;
            const el = (
              <circle key={p.l} cx="82" cy="82" r={R} fill="none" stroke={p.c} strokeWidth="34"
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-ink">{total}</span>
          <span className="text-[10px] text-stone-500 -mt-0.5">trámites</span>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {parts.map(p => (
          <li key={p.l} className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.c }} />
            {p.l} <span className="text-stone-500 font-normal">{p.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { data }      = useAppStore();
  const [q, setQ]     = useState('');

  const proj = data.proyectos.find(p => p.id === projectId);
  const events = useMemo(() => (proj ? projectEvents(proj) : []), [proj]);
  if (!proj) return null;

  const base     = `/proyecto/${projectId}`;
  const tramites = proj.tramites ?? [];
  const alertas  = (proj.alertas ?? []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const shown    = alertas.filter(a => !q || a.mensaje.toLowerCase().includes(q.toLowerCase())).slice(0, 5);

  const kpis = [
    { l: 'Trámites totales', v: tramites.length,                                           to: `${base}/tramites` },
    { l: 'Cumplidos',        v: tramites.filter(t => t.estado === 'cumplido').length,      to: `${base}/tramites?estado=cumplido` },
    { l: 'En proceso',       v: tramites.filter(t => EN_PROCESO.includes(t.estado)).length, to: `${base}/tramites?estado=proceso` },
  ];
  const vencidos = tramites.filter(t => t.estado === 'vencido').length;

  return (
    <div className="mx-auto max-w-[1200px] px-4 lg:px-6 pt-6 fade-in">
      {!proj.cuestionario?.respondido && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <p className="flex-1 text-sm text-green-900">
            <span className="font-semibold">Falta el diagnóstico.</span>{' '}
            Son cinco preguntas y con ellas armamos la lista de trámites que te aplican.
          </p>
          <Link to={`${base}/diagnostico`}
            className="inline-flex h-10 items-center rounded-md bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700">
            Empezar diagnóstico
          </Link>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {kpis.map(k => (
          <Link key={k.l} to={k.to}
            className="flex h-[150px] lg:h-[170px] flex-col justify-between rounded-[22px] border border-stone-400/70 bg-white px-5 py-5 hover:border-ink transition-colors">
            <span className="font-display text-[34px] font-bold leading-none text-ink">{k.v}</span>
            <span className="text-[13px] font-semibold text-ink">{k.l}</span>
          </Link>
        ))}
        <div className="flex h-[150px] lg:h-[170px] flex-col justify-between rounded-[22px] bg-lime px-5 py-5">
          <span className="font-display text-[34px] font-bold leading-none text-ink">{vencidos}</span>
          <div className="flex items-end justify-between">
            <span className="text-[13px] font-semibold text-ink">Vencidos</span>
            <ArrowBtn to={`${base}/tramites?estado=vencido`} label="Ver trámites vencidos" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_266px] gap-8">
        <div className="lg:pl-4">
          <CalendarWidget
            events={events}
            onOpenAgenda={() => navigate(`${base}/cronograma`)}
            onOpenTramite={id => navigate(`${base}/tramites/${id}`)}
          />
        </div>

        <div className="space-y-2.5 lg:pt-1">
          {/* Notificaciones */}
          <section className="rounded-[22px] border border-stone-400/70 bg-white p-5">
            <div className="flex items-center gap-3">
              <Icon n="message" s={20} w={1.6} cls="text-ink" />
              <h2 className="flex-1 font-sans text-[12px] leading-tight text-ink">Notificaciones y Alertas</h2>
              <ArrowBtn to={`${base}/alertas`} label="Ver todas las alertas" />
            </div>
            <label className="mt-4 flex h-[52px] items-center gap-3 rounded-full border border-stone-400/70 px-5">
              <Icon n="search" s={17} cls="text-ink" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar mensaje"
                className="w-full bg-transparent text-[12px] text-ink placeholder:text-ink focus:outline-none" />
            </label>
            <ul className="mt-3 min-h-[110px]">
              {shown.length === 0 ? (
                <li className="py-6 text-center text-xs text-stone-500">{q ? 'Sin coincidencias.' : 'No tienes avisos.'}</li>
              ) : shown.map(a => (
                <li key={a.id} className="border-b border-stone-100 last:border-0">
                  <Link to={`${base}/alertas`} className="flex gap-2.5 py-2.5">
                    <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${a.leido ? 'bg-stone-300' : 'bg-red-500'}`} />
                    <span className="min-w-0">
                      <span className={`block text-[12px] leading-snug line-clamp-2 ${a.leido ? 'text-stone-500' : 'text-ink'}`}>{a.mensaje}</span>
                      <span className="block text-[11px] text-stone-400 mt-0.5">{fmtDate(a.fecha)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Informes */}
          <section className="rounded-sm bg-sand p-4 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-sans text-[15px] font-semibold text-ink">Informes</h2>
                <p className="text-[13px] text-ink mt-0.5">Estado de trámites</p>
              </div>
              <ArrowBtn to={`${base}/tramites`} label="Ver trámites" />
            </div>
            <div className="mt-4">
              <Donut tramites={tramites} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
