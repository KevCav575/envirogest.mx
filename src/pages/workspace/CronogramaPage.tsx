import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { ESTADOS } from '@/constants/estados';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate } from '@/lib/utils';

export default function CronogramaPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { data }      = useAppStore();

  const proj    = data.proyectos.find(p => p.id === projectId);
  const tramites = proj?.tramites ?? [];

  if (!tramites.length) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <Icon n="calendar" s={44} c="#D1D5DB" />
        <p className="text-gray-400 mt-3">Sin trámites para mostrar</p>
      </div>
    );
  }

  const allD = tramites.flatMap(t =>
    [t.cronograma?.inicio, t.cronograma?.fin, t.fecha_limite].filter(Boolean) as string[],
  );
  const hasAny = allD.length > 0;
  const minD   = hasAny ? new Date(Math.min(...allD.map(d => new Date(d).getTime()))) : new Date();
  const maxD   = hasAny ? new Date(Math.max(...allD.map(d => new Date(d).getTime()))) : new Date(Date.now() + 60 * 864e5);

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
    <div className="p-6 fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Cronograma</h1>
        <p className="text-sm text-gray-500">Vista Gantt · Define fechas en el detalle de cada trámite</p>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
          <div className="relative h-5 ml-56">
            {months.map((m, i) => (
              <span key={i} className="absolute text-[10px] text-gray-400" style={{ left: `${m.pct}%` }}>{m.label}</span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {tramites.map(t => {
            const e    = ESTADOS[t.estado] ?? ESTADOS.no_iniciado;
            const hasS = !!t.cronograma?.inicio;
            const hasE = !!(t.cronograma?.fin ?? t.fecha_limite);
            return (
              <div key={t._id} className="flex items-center hover:bg-gray-50 group">
                <div className="w-56 flex-shrink-0 px-4 py-3 cursor-pointer" onClick={() => navigate(`/proyecto/${projectId}/tramites/${t._id}`)}>
                  <p className="text-xs font-medium text-gray-700 truncate group-hover:text-green-800">{t.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                    <span className="text-[10px] text-gray-400">{e.label}</span>
                  </div>
                </div>
                <div className="flex-1 relative h-10">
                  {hasS && hasE && (
                    <div className="absolute top-2.5 rounded-full h-5 flex items-center px-2"
                      style={{ left: `${pct(t.cronograma.inicio!)}%`, width: `${wid(t.cronograma.inicio!, t.cronograma.fin ?? t.fecha_limite!)}%`, background: e.color, opacity: 0.85, minWidth: 4 }}>
                      {wid(t.cronograma.inicio!, t.cronograma.fin ?? t.fecha_limite!) > 10 && (
                        <span className="text-[9px] text-white font-medium">{e.pct}%</span>
                      )}
                    </div>
                  )}
                  {(t.cronograma?.hitos ?? []).filter(h => h.fecha).map(h => (
                    <div key={h.id} className="absolute top-3 w-3 h-3 rounded-full border-2 border-white"
                      style={{ left: `calc(${pct(h.fecha)}% - 6px)`, background: h.completado ? '#10B981' : '#F59E0B', zIndex: 2 }}
                      title={h.nombre} />
                  ))}
                  {t.fecha_limite && (
                    <div className="absolute top-1 w-0.5 h-8 bg-red-400 opacity-60" style={{ left: `${pct(t.fecha_limite)}%` }} />
                  )}
                  {!hasS && <p className="text-[10px] text-gray-300 ml-3 mt-3">Sin fechas</p>}
                </div>
                <div className="w-28 flex-shrink-0 px-3 text-right">
                  <p className="text-[10px] text-gray-400">{t.cronograma?.inicio ? fmtDate(t.cronograma.inicio) : '—'}</p>
                  <p className="text-[10px] text-gray-400">{t.cronograma?.fin ? fmtDate(t.cronograma.fin) : t.fecha_limite ? fmtDate(t.fecha_limite) : '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
