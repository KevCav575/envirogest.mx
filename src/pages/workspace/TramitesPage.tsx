import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ESTADOS } from '@/constants/estados';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate } from '@/lib/utils';
import type { Tramite } from '@/types';

type LevelFilter = 'todos' | 'federal' | 'estatal' | 'municipal';

export default function TramitesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { data }      = useAppStore();

  const proj    = data.proyectos.find(p => p.id === projectId);
  const tramites = proj?.tramites ?? [];

  const [filter, setFilter] = useState<LevelFilter>('todos');
  const [search, setSearch] = useState('');

  const filtered = tramites.filter(t =>
    (filter === 'todos' || t.nivel === filter) &&
    (!search || (t.nombre + t.autoridad).toLowerCase().includes(search.toLowerCase())),
  );

  if (!tramites.length) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <Icon n="clipboard" s={44} c="#D1D5DB" />
        <p className="text-lg font-semibold text-gray-400 mt-4">Sin trámites identificados</p>
        <p className="text-sm text-gray-400">Completa el diagnóstico primero.</p>
      </div>
    );
  }

  return (
    <div className="p-6 fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mis Trámites</h1>
          <p className="text-sm text-gray-500">{tramites.length} trámites identificados</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['todos', 'federal', 'estatal', 'municipal'] as LevelFilter[]).map(n => (
            <button key={n} onClick={() => setFilter(n)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${filter === n ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
              {n === 'todos' ? 'Todos' : n.charAt(0).toUpperCase() + n.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 w-48" />
          <Icon n="list" s={13} cls="absolute left-2.5 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(t => {
          const e = ESTADOS[t.estado] ?? ESTADOS.no_iniciado;
          return (
            <Card key={t._id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/proyecto/${projectId}/tramites/${t._id}`)}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: e.bg }}>
                  <Icon n="file" s={17} c={e.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{t.nombre}</h3>
                      <p className="text-xs text-gray-400">{t.autoridad}</p>
                    </div>
                    <Badge label={e.label} color={e.color} bg={e.bg} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{t.descripcion}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${e.pct}%`, background: e.color }} />
                    </div>
                    <span className="text-xs text-gray-400">{e.pct}%</span>
                    {t.fecha_limite && <span className="text-xs text-gray-400">{fmtDate(t.fecha_limite)}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.nivel === 'federal' ? 'bg-blue-50 text-blue-700' : t.nivel === 'estatal' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'}`}>
                      {t.nivel}
                    </span>
                  </div>
                </div>
                <Icon n="cr" s={15} c="#9CA3AF" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
