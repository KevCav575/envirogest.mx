import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Badge } from '@/components/ui/Badge';
import { ESTADOS } from '@/constants/estados';
import { ISO_DATA, type ISOItem } from '@/constants/iso14001';
import { useAppStore } from '@/store/useAppStore';
import { docsResumen, progreso, siguientePaso, tramitesParaIso } from '@/lib/tramites';
import type { Tramite } from '@/types';

const SECCIONES = Object.keys(ISO_DATA);

export default function ISO14001Page() {
  const { projectId }           = useParams<{ projectId: string }>();
  const { data, updateProject } = useAppStore();

  const proj     = data.proyectos.find(p => p.id === projectId);
  const secs     = proj?.iso14001?.secciones ?? {};
  const tramites = proj?.tramites ?? [];

  const [openSec, setOpenSec]   = useState('6');
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  if (!proj) return null;
  const base = `/proyecto/${projectId}`;

  const toggle = (sid: string, iid: string) => {
    const s = secs[sid] ?? {};
    updateProject({ iso14001: { ...proj.iso14001, secciones: { ...secs, [sid]: { ...s, [iid]: !s[iid] } } } });
  };

  const toggleAbierto = (iid: string) =>
    setAbiertos(prev => {
      const n = new Set(prev);
      if (n.has(iid)) n.delete(iid); else n.add(iid);
      return n;
    });

  const secPct = (sid: string) => {
    const items = ISO_DATA[sid].items;
    const s     = secs[sid] ?? {};
    return items.length ? Math.round(items.filter(i => s[i.id]).length / items.length * 100) : 0;
  };

  const totalItems = Object.values(ISO_DATA).flatMap(s => s.items).length;
  const totalDone  = Object.entries(secs).reduce(
    (a, [sid, s]) => a + (ISO_DATA[sid]?.items ?? []).filter(i => s[i.id]).length, 0,
  );
  const totalPct = totalItems ? Math.round(totalDone / totalItems * 100) : 0;

  const sec = ISO_DATA[openSec];
  const conVinculo = sec.items.filter(i => tramitesParaIso(i, tramites).length > 0);
  const todosAbiertos = conVinculo.length > 0 && conVinculo.every(i => abiertos.has(i.id));

  /** Lista de trámites que respaldan un requisito. */
  const listaTramites = (item: ISOItem, rel: Tramite[]) => {
    const cumplidos = rel.filter(t => t.estado === 'cumplido').length;
    const esDocs = item.id === '7.5';
    return (
      <div className="mt-3 ml-8 rounded-lg border border-stone-200 bg-white">
        <p className="border-b border-stone-100 px-4 py-2.5 text-[12px] text-stone-500">
          {item.vinculo} <span className="text-ink">{cumplidos} de {rel.length} cumplidos.</span>
        </p>
        <ul className="divide-y divide-stone-100">
          {rel.map(t => {
            const e = ESTADOS[t.estado] ?? ESTADOS.no_iniciado;
            const prog = progreso(t);
            const docs = docsResumen(t);
            const next = siguientePaso(t);
            return (
              <li key={t._id}>
                <Link to={`${base}/tramites/${t._id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-stone-50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-ink">{t.nombre}</span>
                    <span className="block truncate text-[12px] text-stone-500">
                      {esDocs
                        ? `${docs.listos} de ${docs.total} documentos obligatorios · ${(t.anexos ?? []).length} archivos`
                        : next ? `Sigue: ${next.titulo}` : 'Todos los pasos hechos'}
                    </span>
                  </span>
                  <span className="flex w-28 items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <span className="block h-full rounded-full bg-green-600" style={{ width: `${esDocs ? (docs.total ? Math.round(docs.listos / docs.total * 100) : 0) : prog.pct}%` }} />
                    </span>
                    <span className="w-8 text-right text-[12px] text-stone-500">{esDocs ? (docs.total ? Math.round(docs.listos / docs.total * 100) : 0) : prog.pct}%</span>
                  </span>
                  <Badge label={e.corto} color={e.color} bg={e.bg} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 lg:px-6 pt-12 pb-10 fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="font-display text-[22px] font-medium text-green-600">ISO 14001:2015</h1>
          <p className="text-sm text-stone-500">Requisitos del sistema de gestión ambiental, capítulos 4 a 10</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold text-ink">{totalPct}%</p>
          <p className="text-xs text-stone-500">{totalDone} de {totalItems} requisitos</p>
        </div>
      </div>

      {tramites.length === 0 && (
        <p className="mt-5 rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-600">
          Varios requisitos se demuestran con tus trámites ambientales.{' '}
          <Link to={`${base}/diagnostico`} className="font-semibold text-green-700 hover:underline">Haz el diagnóstico</Link>{' '}
          para verlos aquí.
        </p>
      )}

      {/* Capítulos */}
      <div className="mt-6 grid grid-cols-4 sm:grid-cols-7 gap-2">
        {SECCIONES.map(sid => {
          const p = secPct(sid);
          const n = new Set(ISO_DATA[sid].items.flatMap(i => tramitesParaIso(i, tramites).map(t => t._id))).size;
          return (
            <button key={sid} onClick={() => setOpenSec(sid)}
              className={`rounded-lg border px-2 py-3 text-center transition-colors ${openSec === sid ? 'border-ink bg-white' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}>
              <p className="font-display text-lg font-semibold text-ink">{p}%</p>
              <p className="text-[11px] text-stone-500">Cap. {sid}</p>
              <p className="mt-0.5 text-[10px] text-stone-400">{n > 0 ? `${n} trámite${n === 1 ? '' : 's'}` : '—'}</p>
            </button>
          );
        })}
      </div>

      {/* Capítulo abierto */}
      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-stone-500">Capítulo {openSec}</p>
            <h2 className="font-display text-[20px] font-semibold text-ink">{sec.nombre}</h2>
          </div>
          {conVinculo.length > 0 && (
            <button onClick={() => setAbiertos(todosAbiertos ? new Set() : new Set(conVinculo.map(i => i.id)))}
              className="text-[13px] font-semibold text-green-700 hover:underline">
              {todosAbiertos ? 'Contraer trámites' : 'Desplegar todos los trámites'}
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {sec.items.map(item => {
            const checked = !!((secs[openSec] ?? {})[item.id]);
            const rel = tramitesParaIso(item, tramites);
            const abierto = abiertos.has(item.id);
            const todosCumplidos = rel.length > 0 && rel.every(t => t.estado === 'cumplido');
            return (
              <li key={item.id} className={`rounded-lg border px-4 py-3 ${checked ? 'border-green-200 bg-green-50/60' : 'border-stone-200 bg-white'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(openSec, item.id)} aria-pressed={checked}
                    aria-label={checked ? `Marcar ${item.id} como pendiente` : `Marcar ${item.id} como cumplido`}
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${checked ? 'border-green-600 bg-green-600 text-white' : 'border-stone-300 hover:border-stone-400'}`}>
                    {checked && <Icon n="check" s={12} w={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] leading-relaxed ${checked ? 'text-green-900' : 'text-ink'}`}>{item.texto}</p>
                    {!checked && todosCumplidos && (
                      <p className="text-[12px] text-green-700">Todos sus trámites están cumplidos; puedes darlo por cubierto.</p>
                    )}
                  </div>
                  {rel.length > 0 && (
                    <button onClick={() => toggleAbierto(item.id)} aria-expanded={abierto}
                      className="flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-stone-600 hover:bg-stone-100">
                      {rel.length} trámite{rel.length === 1 ? '' : 's'}
                      <Icon n={abierto ? 'cd' : 'cr'} s={14} />
                    </button>
                  )}
                </div>
                {abierto && rel.length > 0 && listaTramites(item, rel)}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex gap-2">
          {SECCIONES.indexOf(openSec) > 0 && (
            <Btn variant="secondary" size="sm" onClick={() => setOpenSec(SECCIONES[SECCIONES.indexOf(openSec) - 1])}>
              <Icon n="cl" s={13} />Anterior
            </Btn>
          )}
          {SECCIONES.indexOf(openSec) < SECCIONES.length - 1 && (
            <Btn size="sm" onClick={() => setOpenSec(SECCIONES[SECCIONES.indexOf(openSec) + 1])}>
              Siguiente<Icon n="cr" s={13} />
            </Btn>
          )}
        </div>
      </section>
    </div>
  );
}
