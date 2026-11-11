import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate } from '@/lib/utils';
import type { AlertaTipo } from '@/types';

type Filter = 'todas' | 'no_leidas' | 'leidas';

const TIPO_META: Record<AlertaTipo, { c: string; bg: string }> = {
  vencimiento: { c: '#E0315A', bg: '#FDE8EC' },
  estado:      { c: '#4E8A3A', bg: '#EDF6E7' },
  info:        { c: '#78716C', bg: '#F5F5F4' },
};

const TIPO_LABEL: Record<AlertaTipo, string> = {
  vencimiento: 'Vencimiento', estado: 'Cambio de estado', info: 'Aviso',
};

export default function AlertasPage() {
  const { projectId }   = useParams<{ projectId: string }>();
  const { data, updateProject } = useAppStore();

  const proj    = data.proyectos.find(p => p.id === projectId);
  const alertas  = proj?.alertas ?? [];
  const tramites = proj?.tramites ?? [];

  const [filter, setFilter] = useState<Filter>('todas');

  const markRead  = (id: string) => updateProject({ alertas: alertas.map(a => a.id === id ? { ...a, leido: true } : a) });
  const delAlerta = (id: string) => updateProject({ alertas: alertas.filter(a => a.id !== id) });

  const filtered = alertas.filter(a =>
    filter === 'todas' || (filter === 'no_leidas' && !a.leido) || (filter === 'leidas' && a.leido),
  );

  const unread = alertas.filter(a => !a.leido).length;
  const sorted = filtered.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="mx-auto max-w-[1000px] px-4 lg:px-6 pt-14 fade-in">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-1 pb-5 border-b border-stone-200">
        <div className="mr-auto">
          <h1 className="font-display text-[20px] font-medium text-green-600">Alertas</h1>
          <p className="text-sm text-stone-500">{unread === 0 ? 'Estás al día.' : `${unread} sin leer`}</p>
        </div>
        <div role="radiogroup" aria-label="Filtro" className="flex items-center gap-5 text-[15px]">
          {([['todas', 'Todas'], ['no_leidas', 'Sin leer'], ['leidas', 'Leídas']] as [Filter, string][]).map(([id, l]) => {
            const on = filter === id;
            return (
              <button key={id} role="radio" aria-checked={on} onClick={() => setFilter(id)}
                className={`flex items-center gap-1.5 ${on ? 'text-green-600' : 'text-ink hover:text-green-700'}`}>
                <span className={`h-[9px] w-[9px] rounded-full ${on ? 'bg-green-600' : 'border border-ink'}`} />{l}
              </button>
            );
          })}
        </div>
        {unread > 0 && (
          <Btn variant="secondary" onClick={() => updateProject({ alertas: alertas.map(a => ({ ...a, leido: true })) })}>
            Marcar todas como leídas
          </Btn>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="py-20 text-center text-stone-500">
          {filter === 'todas' ? 'No hay alertas en este proyecto.' : 'Nada en esta vista.'}
        </p>
      ) : (
        <ul>
          {sorted.map(a => {
            const ti = TIPO_META[a.tipo] ?? TIPO_META.info;
            const tr = tramites.find(t => t._id === a.tramite_id);
            return (
              <li key={a.id} className="group flex items-start gap-4 border-b border-stone-200 px-1 py-4">
                <span className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${a.leido ? 'bg-transparent' : 'bg-red-500'}`} aria-label={a.leido ? undefined : 'Sin leer'} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] leading-relaxed ${a.leido ? 'text-stone-500' : 'text-ink'}`}>{a.mensaje}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-stone-500">
                    <span className="rounded px-1.5 py-0.5" style={{ color: ti.c, background: ti.bg }}>{TIPO_LABEL[a.tipo] ?? 'Aviso'}</span>
                    <span>{fmtDate(a.fecha)}</span>
                    {tr && (
                      <Link to={`/proyecto/${projectId}/tramites/${tr._id}`} className="truncate text-stone-600 underline-offset-2 hover:underline">
                        {tr.nombre}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-60 group-hover:opacity-100">
                  {!a.leido && (
                    <button onClick={() => markRead(a.id)} title="Marcar como leída" aria-label="Marcar como leída"
                      className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 hover:text-ink">
                      <Icon n="check" s={15} />
                    </button>
                  )}
                  <button onClick={() => delAlerta(a.id)} title="Eliminar" aria-label="Eliminar alerta"
                    className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 hover:text-red-600">
                    <Icon n="trash" s={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
