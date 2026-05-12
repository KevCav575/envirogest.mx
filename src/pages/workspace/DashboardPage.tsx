import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Card } from '@/components/ui/Card';
import { CalendarWidget } from '@/components/CalendarWidget';
import { ESTADOS } from '@/constants/estados';
import { ISO_DATA } from '@/constants/iso14001';
import { useAppStore } from '@/store/useAppStore';

export default function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { data, currentUser } = useAppStore();

  const proj       = data.proyectos.find(p => p.id === projectId);
  const clientUser = proj ? data.usuarios.find(u => u.id === proj.cliente_id) : undefined;
  if (!proj || !clientUser) return null;

  const tramites = proj.tramites ?? [];
  const alertas  = proj.alertas  ?? [];
  const unread   = alertas.filter(a => !a.leido).length;

  const kpis = [
    { l: 'Trámites totales', v: tramites.length,                                                         c: '#166534' },
    { l: 'Cumplidos',        v: tramites.filter(t => t.estado === 'cumplido').length,                    c: '#10B981' },
    { l: 'En proceso',       v: tramites.filter(t => ['recopilando','ingresado','en_revision'].includes(t.estado)).length, c: '#3B82F6' },
    { l: 'Vencidos',         v: tramites.filter(t => t.estado === 'vencido').length,                     c: '#DC2626' },
  ];

  const isoAll  = Object.values(ISO_DATA).flatMap(s => s.items);
  const isoDone = Object.values(proj.iso14001?.secciones ?? {}).reduce(
    (a, s) => a + Object.values(s).filter(Boolean).length, 0,
  );
  const isoPct = isoAll.length ? Math.round(isoDone / isoAll.length * 100) : 0;

  const displayUser = currentUser?.rol === 'cliente' ? currentUser : clientUser;

  return (
    <div className="p-6 fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Bienvenido, {displayUser.nombre.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {kpis.map(k => (
          <Card key={k.l} className="p-4">
            <p className="text-2xl font-bold" style={{ color: k.c }}>{k.v}</p>
            <p className="text-xs text-gray-500 mt-1">{k.l}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <CalendarWidget tramites={tramites} alertas={alertas} />
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">Alertas recientes</h3>
              {unread > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unread} nuevas</span>}
            </div>
            {alertas.length === 0
              ? <p className="text-xs text-gray-400">Sin alertas</p>
              : alertas.slice(0, 4).map(a => (
                  <div key={a.id} className={`flex gap-2 p-2 rounded-lg mb-1.5 ${a.leido ? '' : 'bg-amber-50'}`}>
                    <Icon n="bell" s={13} c={a.leido ? '#9CA3AF' : '#F59E0B'} cls="mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600 line-clamp-2">{a.mensaje}</p>
                  </div>
                ))
            }
            {alertas.length > 0 && (
              <button onClick={() => navigate(`/proyecto/${projectId}/alertas`)} className="text-xs text-green-700 font-medium mt-1 hover:underline">Ver todas →</button>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon n="shield" s={15} c="#166534" />
              <h3 className="font-semibold text-gray-800 text-sm">ISO 14001:2015</h3>
            </div>
            <p className="text-3xl font-bold text-green-800 mb-1">{isoPct}%</p>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-green-700" style={{ width: `${isoPct}%` }} />
            </div>
            <button onClick={() => navigate(`/proyecto/${projectId}/iso14001`)} className="text-xs text-green-700 font-medium hover:underline">Ver checklist →</button>
          </Card>
        </div>
      </div>

      {tramites.length > 0 && (
        <Card className="p-4 mt-5">
          <h3 className="font-semibold text-gray-800 mb-3">Matriz de cumplimiento</h3>
          <div className="space-y-2">
            {tramites.map(t => {
              const e = ESTADOS[t.estado] ?? ESTADOS.no_iniciado;
              return (
                <div key={t._id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{t.nombre}</p>
                    <p className="text-[10px] text-gray-400">{t.autoridad}</p>
                  </div>
                  <div className="w-28"><div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${e.pct}%`, background: e.color }} /></div></div>
                  <span className="text-[10px] font-medium w-20 text-right" style={{ color: e.color }}>{e.label.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {!proj.cuestionario?.respondido && (
        <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center flex-shrink-0"><Icon n="clipboard" s={20} c="white" /></div>
          <div className="flex-1">
            <p className="font-semibold text-green-900 text-sm">Inicia el diagnóstico ambiental</p>
            <p className="text-xs text-green-700">Responde 5 preguntas para identificar las obligaciones aplicables.</p>
          </div>
          <Btn onClick={() => navigate(`/proyecto/${projectId}/diagnostico`)}>Iniciar diagnóstico</Btn>
        </div>
      )}
    </div>
  );
}
