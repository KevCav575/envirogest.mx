import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { ESTADOS } from '@/constants/estados';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate } from '@/lib/utils';
import { ymd } from '@/lib/events';
import type { Tramite, TramiteEstado } from '@/types';

type LevelFilter = 'todos' | 'federal' | 'estatal' | 'municipal';
type EstadoFilter = 'cumplido' | 'proceso' | 'vencido' | null;

const PAGE = 8;

/** Paleta de etiquetas como en la tabla del mockup. */
const PILL: Record<TramiteEstado, { color: string; bg: string; label: string }> = {
  no_iniciado: { color: '#8A8A8A', bg: '#F1F1F1', label: 'Sin iniciar' },
  recopilando: { color: '#C99A00', bg: '#FFF8E1', label: 'Recopilando' },
  ingresado:   { color: '#3D6FE0', bg: '#EAF1FF', label: 'Ingresado' },
  en_revision: { color: '#3D6FE0', bg: '#EAF1FF', label: 'En revisión' },
  cumplido:    { color: '#4E8A3A', bg: '#EDF6E7', label: 'Cumplido' },
  vencido:     { color: '#E0315A', bg: '#FDE8EC', label: 'Vencido' },
};

const ESTADO_FILTER_LABEL: Record<Exclude<EstadoFilter, null>, string> = {
  cumplido: 'Cumplidos', proceso: 'En proceso', vencido: 'Vencidos',
};

function deadlineColor(t: Tramite): string {
  if (!t.fecha_limite) return '#A8A29E';
  if (t.estado === 'cumplido') return '#57534E';
  const diff = (new Date(t.fecha_limite + 'T00:00:00').getTime() - new Date(ymd(new Date()) + 'T00:00:00').getTime()) / 864e5;
  if (diff < 0)  return '#B91C1C';
  if (diff <= 7) return '#B88A00';
  return '#1D4ED8';
}

export default function TramitesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { data }      = useAppStore();
  const [params, setParams] = useSearchParams();

  const proj     = data.proyectos.find(p => p.id === projectId);
  const tramites = proj?.tramites ?? [];

  const [filter, setFilter] = useState<LevelFilter>('todos');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(0);

  const estadoParam = params.get('estado');
  const estado: EstadoFilter = estadoParam === 'cumplido' || estadoParam === 'proceso' || estadoParam === 'vencido' ? estadoParam : null;

  const filtered = tramites.filter(t =>
    (filter === 'todos' || t.nivel === filter) &&
    (!estado ||
      (estado === 'cumplido' && t.estado === 'cumplido') ||
      (estado === 'vencido'  && t.estado === 'vencido') ||
      (estado === 'proceso'  && ['recopilando', 'ingresado', 'en_revision'].includes(t.estado))) &&
    (!search || (t.nombre + ' ' + t.autoridad).toLowerCase().includes(search.toLowerCase())),
  );

  const pages   = Math.max(1, Math.ceil(filtered.length / PAGE));
  const curPage = Math.min(page, pages - 1);
  const rows    = filtered.slice(curPage * PAGE, curPage * PAGE + PAGE);

  if (!tramites.length) {
    return (
      <div className="mx-auto max-w-[640px] px-5 pt-24 text-center fade-in">
        <h1 className="font-display text-2xl font-semibold text-ink">Todavía no hay trámites</h1>
        <p className="text-stone-600 mt-2">La lista sale del diagnóstico. Respóndelo y aquí verás cada trámite con su autoridad y fechas.</p>
        <Link to={`/proyecto/${projectId}/diagnostico`}
          className="mt-6 inline-flex h-11 items-center rounded-md bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700">
          Ir al diagnóstico
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] px-4 lg:px-6 pt-14 fade-in">
      {/* Encabezado + filtros */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-1 pb-5 border-b border-stone-200">
        <h1 className="font-display text-[20px] font-medium text-green-600 mr-auto">Resumen de trámites</h1>

        <div role="radiogroup" aria-label="Nivel" className="flex items-center gap-5 text-[15px]">
          {(['todos', 'federal', 'estatal', 'municipal'] as LevelFilter[]).map(n => {
            const on = filter === n;
            return (
              <button key={n} role="radio" aria-checked={on} onClick={() => { setFilter(n); setPage(0); }}
                className={`flex items-center gap-1.5 ${on ? 'text-green-600' : 'text-ink hover:text-green-700'}`}>
                <span className={`h-[9px] w-[9px] rounded-full ${on ? 'bg-green-600' : 'border border-ink'}`} />
                {n === 'todos' ? 'Todos' : n.charAt(0).toUpperCase() + n.slice(1)}
              </button>
            );
          })}
        </div>

        <label className="flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-stone-50 px-3 text-sm">
          <Icon n="search" s={15} cls="text-stone-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar trámite"
            className="w-36 bg-transparent text-stone-700 placeholder:text-stone-400 focus:outline-none" />
        </label>

        <button onClick={() => navigate(`/proyecto/${projectId}/cronograma`)}
          className="flex h-10 items-center gap-2.5 rounded-md bg-green-600 px-5 text-[15px] text-white hover:bg-green-700">
          <Icon n="sliders" s={17} w={1.6} />Ver cronograma
        </button>
      </div>

      {estado && (
        <div className="flex items-center gap-2 px-1 pt-4 text-sm text-stone-600">
          Mostrando: <span className="font-medium text-ink">{ESTADO_FILTER_LABEL[estado]}</span>
          <button onClick={() => { params.delete('estado'); setParams(params); setPage(0); }}
            className="ml-1 rounded px-1.5 py-0.5 text-xs text-stone-500 hover:bg-stone-100">Quitar filtro ×</button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-stone-200 text-left text-stone-500">
              <th className="font-medium py-6 pl-3 w-[30%]">Trámite</th>
              <th className="font-medium py-6">Autoridad</th>
              <th className="font-medium py-6">Inicio</th>
              <th className="py-6 w-12" aria-hidden="true" />
              <th className="font-medium py-6">Fecha límite</th>
              <th className="font-medium py-6">Avance</th>
              <th className="font-medium py-6">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-stone-500">Ningún trámite coincide con los filtros.</td></tr>
            ) : rows.map(t => {
              const e = ESTADOS[t.estado] ?? ESTADOS.no_iniciado;
              const pill = PILL[t.estado] ?? PILL.no_iniciado;
              return (
                <tr key={t._id} onClick={() => navigate(`/proyecto/${projectId}/tramites/${t._id}`)}
                  className="tram-row cursor-pointer h-[66px]">
                  <td className="pl-3 pr-4">
                    <span className="block text-ink line-clamp-1">{t.nombre}</span>
                    <span className="block text-xs text-stone-400 capitalize">{t.nivel}</span>
                  </td>
                  <td className="pr-4 text-stone-500">{t.autoridad}</td>
                  <td className="pr-4" style={{ color: t.cronograma?.inicio ? '#1D4ED8' : '#A8A29E' }}>
                    {t.cronograma?.inicio ? fmtDate(t.cronograma.inicio) : '—'}
                  </td>
                  <td className="text-stone-400 tracking-[0.2em]" aria-hidden="true">-----</td>
                  <td className="pr-4" style={{ color: deadlineColor(t) }}>{t.fecha_limite ? fmtDate(t.fecha_limite) : '—'}</td>
                  <td className="pr-4 text-ink">{e.pct}%</td>
                  <td className="pr-3"><Badge label={pill.label} color={pill.color} bg={pill.bg} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t-2 border-stone-200 px-3 pt-3 text-[15px] text-stone-500">
        <span>Página {curPage + 1} de {pages}</span>
        {pages > 1 && (
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={curPage === 0} aria-label="Página anterior"
              className="p-1.5 rounded-md hover:bg-stone-100 disabled:opacity-30"><Icon n="cl" s={16} /></button>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={curPage >= pages - 1} aria-label="Página siguiente"
              className="p-1.5 rounded-md hover:bg-stone-100 disabled:opacity-30"><Icon n="cr" s={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
