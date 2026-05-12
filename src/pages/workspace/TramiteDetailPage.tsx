import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ESTADOS } from '@/constants/estados';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate, today, uid } from '@/lib/utils';
import type { Tramite, TramiteEstado } from '@/types';

export default function TramiteDetailPage() {
  const { projectId, tramiteId } = useParams<{ projectId: string; tramiteId: string }>();
  const navigate                  = useNavigate();
  const { data, updateProject }   = useAppStore();

  const proj    = data.proyectos.find(p => p.id === projectId);
  const tramite = proj?.tramites.find(t => t._id === tramiteId);

  const [newNota, setNewNota]   = useState('');
  const [newHito, setNewHito]   = useState({ nombre: '', fecha: '' });

  if (!proj || !tramite) {
    return <div className="p-8 text-gray-400">Trámite no encontrado.</div>;
  }

  const save = (updates: Partial<Tramite>) => {
    updateProject({ tramites: proj.tramites.map(t => t._id === tramiteId ? { ...t, ...updates } : t) });
  };

  const e = ESTADOS[tramite.estado] ?? ESTADOS.no_iniciado;

  const addNota = () => {
    if (!newNota.trim()) return;
    save({ notas2: [...(tramite.notas2 ?? []), { id: uid(), texto: newNota, fecha: today() }] });
    setNewNota('');
  };

  const addHito = () => {
    if (!newHito.nombre) return;
    save({ cronograma: { ...tramite.cronograma, hitos: [...(tramite.cronograma?.hitos ?? []), { id: uid(), ...newHito, completado: false }] } });
    setNewHito({ nombre: '', fecha: '' });
  };

  const toggleHito = (hid: string) =>
    save({ cronograma: { ...tramite.cronograma, hitos: (tramite.cronograma?.hitos ?? []).map(h => h.id === hid ? { ...h, completado: !h.completado } : h) } });

  return (
    <div className="p-6 fade-in">
      <button onClick={() => navigate(`/proyecto/${projectId}/tramites`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <Icon n="cl" s={14} />Volver a trámites
      </button>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tramite.nombre}</h1>
          <p className="text-sm text-gray-500">
            {tramite.autoridad} ·{' '}
            <span className={`font-medium ${tramite.nivel === 'federal' ? 'text-blue-600' : tramite.nivel === 'estatal' ? 'text-purple-600' : 'text-orange-600'}`}>{tramite.nivel}</span>
          </p>
        </div>
        <Badge label={e.label} color={e.color} bg={e.bg} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main column */}
        <div className="col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2"><Icon n="file" s={14} />Fundamento Legal</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{tramite.base_legal}</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Descripción</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{tramite.descripcion}</p>
          </Card>

          {/* Hitos */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2"><Icon n="clock" s={14} />Hitos</h3>
            {(tramite.cronograma?.hitos ?? []).length === 0
              ? <p className="text-xs text-gray-400 mb-3">Sin hitos</p>
              : <div className="space-y-2 mb-3">
                  {tramite.cronograma.hitos.map(h => (
                    <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <button onClick={() => toggleHito(h.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${h.completado ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                        {h.completado && <Icon n="check" s={10} c="white" />}
                      </button>
                      <span className={`flex-1 text-xs ${h.completado ? 'line-through text-gray-400' : 'text-gray-700'}`}>{h.nombre}</span>
                      {h.fecha && <span className="text-[10px] text-gray-400">{fmtDate(h.fecha)}</span>}
                    </div>
                  ))}
                </div>
            }
            <div className="flex gap-2">
              <input value={newHito.nombre} onChange={e => setNewHito(h => ({ ...h, nombre: e.target.value }))} placeholder="Nuevo hito..."
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-700" />
              <input type="date" value={newHito.fecha} onChange={e => setNewHito(h => ({ ...h, fecha: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-700" />
              <Btn onClick={addHito} size="sm"><Icon n="plus" s={12} />Agregar</Btn>
            </div>
          </Card>

          {/* Notas */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Notas</h3>
            {(tramite.notas2 ?? []).length === 0
              ? <p className="text-xs text-gray-400 mb-3">Sin notas</p>
              : <div className="space-y-2 mb-3">
                  {tramite.notas2.map(n => (
                    <div key={n.id} className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                      <p className="text-xs text-gray-700">{n.texto}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{fmtDate(n.fecha)}</p>
                    </div>
                  ))}
                </div>
            }
            <div className="flex gap-2">
              <input value={newNota} onChange={e => setNewNota(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNota(); }} placeholder="Agregar nota..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-700" />
              <Btn onClick={addNota} size="sm">Guardar</Btn>
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          {/* Estado */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Estado</h3>
            <div className="space-y-1.5">
              {(Object.entries(ESTADOS) as [TramiteEstado, typeof ESTADOS[TramiteEstado]][]).map(([k, v]) => (
                <button key={k} onClick={() => save({ estado: k })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border-2 text-left transition-all"
                  style={tramite.estado === k ? { borderColor: v.color, background: v.bg } : { borderColor: 'transparent', background: '#f9fafb' }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                  <span className="text-xs font-medium" style={tramite.estado === k ? { color: v.color } : {}}>{v.label}</span>
                  {tramite.estado === k && <Icon n="check" s={12} c={v.color} cls="ml-auto" />}
                </button>
              ))}
            </div>
          </Card>

          {/* Fechas */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Fechas</h3>
            <div className="space-y-2">
              {[
                { label: 'Inicio', val: tramite.cronograma?.inicio ?? '', key: 'inicio' as const },
                { label: 'Fecha límite', val: tramite.fecha_limite ?? '', key: 'fecha_limite' as const },
                { label: 'Fin / Resolución', val: tramite.cronograma?.fin ?? '', key: 'fin' as const },
              ].map(({ label, val, key }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
                  <input type="date" value={val} onChange={e => {
                    if (key === 'fecha_limite') save({ fecha_limite: e.target.value || null });
                    else save({ cronograma: { ...tramite.cronograma, [key]: e.target.value } });
                  }} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-700" />
                </div>
              ))}
            </div>
          </Card>

          {/* Progress */}
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: e.color }}>{e.pct}%</p>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: `${e.pct}%`, background: e.color }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Avance</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
