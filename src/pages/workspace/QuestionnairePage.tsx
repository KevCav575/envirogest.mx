import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Card } from '@/components/ui/Card';
import { GIROS } from '@/constants/giros';
import { useAppStore } from '@/store/useAppStore';
import { generateTramites, today, uid } from '@/lib/utils';
import type { CuestionarioRespuestas } from '@/types';

const Q_STEPS = [
  { id: 'giro' as const, titulo: '¿Cuál es el giro industrial principal de tu empresa?', ayuda: 'Determina competencia federal (SEMARNAT) o estatal (PMA NL) y si aplica COA.', tipo: 'select' as const, opciones: GIROS.map(g => ({ value: g.id, label: g.label })) },
  { id: 'emisiones' as const, titulo: '¿Tu proceso genera emisiones a la atmósfera o utiliza combustibles fósiles?', ayuda: 'Gas natural, diésel, LP. Chimeneas, ductos, procesos de combustión.', tipo: 'yesno' as const },
  { id: 'agua' as const, titulo: '¿Tu proceso utiliza agua industrial y/o genera aguas residuales?', ayuda: 'Descargas a cuerpos de agua o a alcantarillado municipal.', tipo: 'yesno' as const },
  { id: 'residuos' as const, titulo: '¿Tu proceso genera residuos peligrosos (RP) y/o de manejo especial (RME)?', ayuda: 'RP: solventes, aceites, baterías. RME: residuos no municipales ni peligrosos.', tipo: 'multicheck' as const,
    opciones: [{ id: 'residuos_peligrosos', label: 'Sí, genera Residuos Peligrosos (RP)' }, { id: 'residuos_especiales', label: 'Sí, genera Residuos de Manejo Especial (RME)' }] },
  { id: 'obras' as const, titulo: '¿Tu empresa realiza o planea obras de construcción, ampliación o modificación de instalaciones?', ayuda: 'Incluye cambio de uso de suelo. Determina si requieres MIA federal o estatal.', tipo: 'yesno' as const },
];

export default function QuestionnairePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { data, updateProject } = useAppStore();

  const proj = data.proyectos.find(p => p.id === projectId);
  const ex   = proj?.cuestionario?.respondido ? proj.cuestionario.respuestas : {} as Partial<CuestionarioRespuestas>;

  const [step, setStep] = useState(0);
  const [resp, setResp] = useState<CuestionarioRespuestas>({
    giro: ex.giro ?? '', emisiones: ex.emisiones ?? null, agua: ex.agua ?? null,
    residuos_peligrosos: ex.residuos_peligrosos ?? false, residuos_especiales: ex.residuos_especiales ?? false,
    obras: ex.obras ?? null,
  });
  const [done, setDone] = useState(proj?.cuestionario?.respondido ?? false);

  const cur     = Q_STEPS[step];
  const yesnoValue = (resp as unknown as Record<string, boolean | null>)[cur.id];
  const canNext = cur.tipo === 'select' ? !!resp.giro : cur.tipo === 'yesno' ? yesnoValue !== null : true;

  const finish = () => {
    const tramites = generateTramites(resp);
    const alertas  = [...(proj?.alertas ?? []), { id: uid(), tipo: 'info' as const, mensaje: `Diagnóstico completado. Se identificaron ${tramites.length} trámites aplicables.`, fecha: today(), leido: false, tramite_id: null }];
    updateProject({ cuestionario: { respondido: true, respuestas: resp, fecha: today() }, tramites, alertas });
    setDone(true);
  };

  if (done) {
    return (
      <div className="p-6 fade-in max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Icon n="checkCircle" s={28} c="#166534" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Diagnóstico completado</h2>
          <p className="text-gray-500 mb-5">Se identificaron <strong>{proj?.tramites.length ?? 0} trámites ambientales aplicables</strong>.</p>
          <div className="flex gap-3 justify-center">
            <Btn onClick={() => navigate(`/proyecto/${projectId}/tramites`)}>Ver trámites</Btn>
            <Btn variant="secondary" onClick={() => { setDone(false); setStep(0); }}>Repetir diagnóstico</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 fade-in max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Diagnóstico de Obligaciones Ambientales</h1>
        <p className="text-sm text-gray-500">5 preguntas estratégicas · LGEEPA, LGPGIR, Ley Ambiental NL</p>
      </div>
      <div className="flex gap-1.5 mb-5">
        {Q_STEPS.map((_, i) => <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-green-700' : 'bg-gray-200'}`} />)}
      </div>
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-5">
          <span className="w-7 h-7 rounded-full bg-green-800 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{step + 1}</span>
          <div><h2 className="font-semibold text-gray-800">{cur.titulo}</h2><p className="text-xs text-gray-500 mt-1">{cur.ayuda}</p></div>
        </div>

        {cur.tipo === 'select' && (
          <div className="grid grid-cols-2 gap-2">
            {cur.opciones!.map(o => (
              <button key={o.value} onClick={() => setResp(r => ({ ...r, giro: o.value }))}
                className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${resp.giro === o.value ? 'border-green-700 bg-green-50 text-green-900 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}

        {cur.tipo === 'yesno' && (
          <div className="flex gap-4">
            {([true, false] as const).map(v => (
              <button key={String(v)} onClick={() => setResp(r => ({ ...r, [cur.id]: v }))}
                className={`flex-1 py-4 rounded-xl border-2 font-semibold text-lg transition-all ${yesnoValue === v ? 'border-green-700 bg-green-50 text-green-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {v ? 'Sí' : 'No'}
              </button>
            ))}
          </div>
        )}

        {cur.tipo === 'multicheck' && (
          <div className="space-y-3">
            {cur.opciones!.map(o => {
              const key = o.id as 'residuos_peligrosos' | 'residuos_especiales';
              return (
                <label key={o.id} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer" style={resp[key] ? { borderColor: '#166534', background: '#f0fdf4' } : { borderColor: '#e5e7eb' }}>
                  <input type="checkbox" checked={!!resp[key]} onChange={e => setResp(r => ({ ...r, [key]: e.target.checked }))} className="w-4 h-4 accent-green-700" />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              );
            })}
            <p className="text-xs text-gray-400">Puedes seleccionar ninguna, una o ambas.</p>
          </div>
        )}

        <div className="flex justify-between mt-5 pt-4 border-t border-gray-100">
          <Btn variant="secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0}><Icon n="cl" s={14} />Anterior</Btn>
          {step < Q_STEPS.length - 1
            ? <Btn onClick={() => setStep(s => s + 1)} disabled={!canNext}>Siguiente<Icon n="cr" s={14} /></Btn>
            : <Btn onClick={finish} disabled={!canNext}><Icon n="checkCircle" s={14} />Finalizar</Btn>
          }
        </div>
      </Card>
    </div>
  );
}
