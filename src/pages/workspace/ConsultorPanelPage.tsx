import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/SelectField';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate, today, uid } from '@/lib/utils';
import type { AlertaTipo } from '@/types';

type PanelTab = 'instrucciones' | 'reuniones' | 'alerta' | 'docs' | 'visita' | 'firma';

export default function ConsultorPanelPage() {
  const { projectId }           = useParams<{ projectId: string }>();
  const { data, updateProject } = useAppStore();

  const proj    = data.proyectos.find(p => p.id === projectId);
  const tramites = proj?.tramites ?? [];
  const alertas  = proj?.alertas  ?? [];
  const instrucciones = proj?.instrucciones_admin ?? [];
  const reuniones = (proj?.reuniones ?? []).slice().sort((a, b) => a.fecha > b.fecha ? 1 : -1);

  const [tab, setTab]   = useState<PanelTab>('instrucciones');
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ tipo: 'solicitud' as AlertaTipo, tramite_id: '', mensaje: '', fecha_visita: '', hora_visita: '', motivo: '', docs: '' });
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const sendAlert = (tipo: AlertaTipo, msg: string) => {
    if (!msg) return;
    updateProject({ alertas: [...alertas, { id: uid(), tipo, mensaje: msg, fecha: today(), leido: false, tramite_id: form.tramite_id || null }] });
    setSent(true); setTimeout(() => setSent(false), 3000);
    setF('mensaje', ''); setF('docs', '');
  };

  const markInstrLeida = (iid: string) =>
    updateProject({ instrucciones_admin: instrucciones.map(i => i.id === iid ? { ...i, leido: true } : i) });

  const instrPend    = instrucciones.filter(i => !i.leido).length;
  const reunFutures  = reuniones.filter(r => r.fecha >= today());

  const TABS: { id: PanelTab; l: string; badge?: number }[] = [
    { id: 'instrucciones', l: 'Instrucciones del admin', badge: instrPend > 0 ? instrPend : undefined },
    { id: 'reuniones',     l: 'Reuniones',              badge: reunFutures.length > 0 ? reunFutures.length : undefined },
    { id: 'alerta',        l: 'Enviar alerta' },
    { id: 'docs',          l: 'Solicitar docs' },
    { id: 'visita',        l: 'Agendar visita' },
    { id: 'firma',         l: 'Para firma' },
  ];

  return (
    <div className="p-6 fade-in max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Panel del Consultor</h1>
        <p className="text-sm text-gray-500">Herramientas BIOIMPACT · instrucciones y comunicación</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${tab === t.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.l}
            {t.badge && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{t.badge}</span>}
          </button>
        ))}
      </div>

      {sent && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <Icon n="checkCircle" s={15} c="#166534" />Acción enviada correctamente
        </div>
      )}

      {/* ── INSTRUCCIONES ── */}
      {tab === 'instrucciones' && (
        instrucciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3"><Icon n="checkCircle" s={24} c="#166534" /></div>
            <p className="text-gray-600 font-medium">Sin instrucciones pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {instrucciones.slice().reverse().map(instr => (
              <div key={instr.id} className={`bg-white rounded-xl border p-4 ${instr.urgente ? 'instr-urgente' : 'instr-normal'} ${instr.leido ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${instr.urgente ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Icon n={instr.urgente ? 'alert' : 'info'} s={16} c={instr.urgente ? '#dc2626' : '#1e40af'} />
                    </div>
                    <div className="flex-1">
                      {instr.urgente && <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">⚡ Urgente</span>}
                      <p className="text-sm text-gray-800 leading-relaxed mt-0.5">{instr.texto}</p>
                      <p className="text-[10px] text-gray-400 mt-2">Enviado por BIOIMPACT · {fmtDate(instr.fecha)}</p>
                    </div>
                  </div>
                  {!instr.leido
                    ? <button onClick={() => markInstrLeida(instr.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 text-xs font-medium flex-shrink-0">
                        <Icon n="check" s={12} />Marcar leída
                      </button>
                    : <span className="text-[10px] text-green-600 font-medium flex-shrink-0 flex items-center gap-1"><Icon n="checkCircle" s={11} c="#16a34a" />Leída</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── REUNIONES ── */}
      {tab === 'reuniones' && (
        reuniones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3"><Icon n="calendar" s={24} c="#1e40af" /></div>
            <p className="text-gray-600 font-medium">Sin reuniones programadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reuniones.map(r => {
              const isPast = r.fecha < today();
              return (
                <div key={r.id} className={`bg-white rounded-xl border p-4 ${isPast ? 'opacity-50' : 'border-blue-100'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isPast ? 'bg-gray-100' : 'bg-blue-50'}`}>
                      <span className="text-[10px] font-bold" style={{ color: isPast ? '#9ca3af' : '#1e40af' }}>
                        {r.fecha ? new Date(r.fecha + 'T12:00').toLocaleString('es', { month: 'short' }).toUpperCase() : ''}
                      </span>
                      <span className="text-lg font-black leading-none" style={{ color: isPast ? '#9ca3af' : '#1e3a8a' }}>{r.fecha ? r.fecha.split('-')[2] : ''}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{r.titulo}</p>
                          <p className="text-xs text-gray-500">{r.hora} · {r.duracion} min · {fmtDate(r.fecha)}</p>
                          {r.agenda && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.agenda}</p>}
                        </div>
                        {r.gcal_link && !isPast && (
                          <a href={r.gcal_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0 hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
                            <Icon n="calendar" s={12} c="white" />Google Cal
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── ACTION TABS ── */}
      {(['alerta', 'docs', 'visita', 'firma'] as PanelTab[]).includes(tab) && (
        <Card className="p-5">
          <SelectField label="Trámite vinculado (opcional)" value={form.tramite_id} onChange={v => setF('tramite_id', v)}
            options={tramites.map(t => ({ value: t._id, label: t.nombre }))} className="mb-4" />

          {tab === 'alerta' && (
            <div className="space-y-4">
              <SelectField label="Tipo" value={form.tipo} onChange={v => setF('tipo', v)} options={[
                { value: 'vencimiento', label: 'Vencimiento próximo' }, { value: 'solicitud', label: 'Solicitud información' },
                { value: 'estado', label: 'Cambio de estado' }, { value: 'info', label: 'Informativa' },
              ]} />
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">Mensaje *</label>
                <textarea value={form.mensaje} onChange={e => setF('mensaje', e.target.value)} rows={3} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none" /></div>
              <Btn onClick={() => sendAlert(form.tipo, form.mensaje)}><Icon n="send" s={14} />Enviar alerta</Btn>
            </div>
          )}

          {tab === 'docs' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">Documentos requeridos *</label>
                <textarea value={form.docs} onChange={e => setF('docs', e.target.value)} rows={4} placeholder="Plano de ubicación, Acta constitutiva, RFC..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none" /></div>
              <Btn onClick={() => sendAlert('solicitud', `BIOIMPACT solicita: ${form.docs}`)}><Icon n="file" s={14} />Solicitar documentos</Btn>
            </div>
          )}

          {tab === 'visita' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Fecha *" value={form.fecha_visita} onChange={v => setF('fecha_visita', v)} type="date" />
                <Input label="Hora" value={form.hora_visita} onChange={v => setF('hora_visita', v)} type="time" />
              </div>
              <Input label="Motivo" value={form.motivo} onChange={v => setF('motivo', v)} placeholder="Recolección de documentos firmados" />
              <Btn onClick={() => sendAlert('visita', `Visita: ${fmtDate(form.fecha_visita)} a las ${form.hora_visita || 'hora TBD'}. Motivo: ${form.motivo || 'Recolección de documentos'}.`)}><Icon n="calendar" s={14} />Agendar visita</Btn>
            </div>
          )}

          {tab === 'firma' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">Documentos para firma</label>
                <textarea value={form.docs} onChange={e => setF('docs', e.target.value)} rows={3} placeholder="Plan de Manejo RME, MIA Estatal..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none" /></div>
              <Btn onClick={() => sendAlert('firma', `Documentos para firma: ${form.docs}. Favor revisar y firmar.`)}><Icon n="edit" s={14} />Notificar para firma</Btn>
            </div>
          )}
        </Card>
      )}

      <div className="mt-5 grid grid-cols-4 gap-4">
        {[
          { l: 'Instrucciones pendientes', v: instrPend,                                         c: '#1e40af' },
          { l: 'Reuniones próximas',       v: reunFutures.length,                               c: '#8b5cf6' },
          { l: 'Alertas sin leer',         v: alertas.filter(a => !a.leido).length,             c: '#F59E0B' },
          { l: 'Trámites activos',         v: tramites.filter(t => ['recopilando','ingresado','en_revision'].includes(t.estado)).length, c: '#166534' },
        ].map(x => (
          <Card key={x.l} className="p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: x.c }}>{x.v}</p>
            <p className="text-xs text-gray-500 mt-0.5">{x.l}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
