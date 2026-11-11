import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
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
    giro: ex.giro ?? proj?.cuestionario?.respuestas?.giro ?? '', emisiones: ex.emisiones ?? null, agua: ex.agua ?? null,
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
      <div className="mx-auto max-w-[760px] px-5 pt-16 fade-in">
        <p className="text-sm font-medium text-green-700">Diagnóstico terminado</p>
        <h1 className="font-display text-[34px] font-semibold text-ink mt-1">
          Te aplican {proj?.tramites.length ?? 0} trámites ambientales
        </h1>
        <p className="text-stone-600 mt-3 max-w-[560px]">
          Ya están en tu lista de trámites, ordenados por autoridad. Puedes repetir el diagnóstico
          si cambió algo en tu operación; la lista se vuelve a generar.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Btn size="lg" onClick={() => navigate(`/proyecto/${projectId}/tramites`)}>VER TRÁMITES</Btn>
          <Btn size="lg" variant="secondary" onClick={() => { setDone(false); setStep(0); }}>Repetir diagnóstico</Btn>
        </div>
      </div>
    );
  }

  const optCls = (on: boolean) =>
    `flex w-full items-center justify-between gap-4 rounded-lg border-2 px-7 text-left transition-colors ${
      on ? 'border-green-600 bg-green-50' : 'border-green-600/80 bg-white hover:bg-green-50/50'}`;

  const Check = ({ on }: { on: boolean }) => (
    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-green-600 bg-green-600 text-white' : 'border-stone-300'}`}>
      {on && <Icon n="check" s={14} w={2.5} />}
    </span>
  );

  return (
    <div className="mx-auto max-w-[860px] px-5 pt-12 fade-in">
      {/* Stepper */}
      <ol className="flex items-center gap-7" aria-label={`Pregunta ${step + 1} de ${Q_STEPS.length}`}>
        {Q_STEPS.map((_, i) => (
          <li key={i} className={`flex items-center gap-7 ${i < Q_STEPS.length - 1 ? 'flex-1' : ''}`}>
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-label={`Pregunta ${i + 1}`}
              className={`flex h-[53px] w-[53px] flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold transition-colors ${
                i <= step ? 'bg-green-600 text-white' : 'bg-[#EEEEF3] text-stone-400'}`}>
              {i < step ? <Icon n="check" s={18} w={2.4} /> : null}
            </button>
            {i < Q_STEPS.length - 1 && (
              <span className="relative h-2 flex-1 rounded-full bg-[#EEEEF3] overflow-hidden">
                <span className="absolute inset-y-0 left-0 rounded-full bg-green-600 transition-all"
                  style={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }} />
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-14 px-1 sm:px-7">
        <h1 className="font-display text-[32px] font-normal text-ink">Pregunta {step + 1}</h1>
        <p className="mt-3 text-[19px] text-ink max-w-[620px]">{cur.titulo}</p>
        <p className="mt-1.5 text-sm text-stone-500 max-w-[620px]">{cur.ayuda}</p>

        <div className="mt-10 max-w-[618px]">
          {cur.tipo === 'select' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cur.opciones!.map(o => {
                const on = resp.giro === o.value;
                return (
                  <button key={o.value} onClick={() => setResp(r => ({ ...r, giro: o.value }))}
                    aria-pressed={on} className={`${optCls(on)} min-h-[72px] py-3 !px-5`}>
                    <span className="text-[16px] text-ink">{o.label}</span>
                    <Check on={on} />
                  </button>
                );
              })}
            </div>
          )}

          {cur.tipo === 'yesno' && (
            <div className="space-y-6">
              {([true, false] as const).map(v => {
                const on = yesnoValue === v;
                return (
                  <button key={String(v)} onClick={() => setResp(r => ({ ...r, [cur.id]: v }))}
                    aria-pressed={on} className={`${optCls(on)} h-[96px]`}>
                    <span className="text-[30px] text-ink">{v ? 'Sí' : 'No'}</span>
                    <Check on={on} />
                  </button>
                );
              })}
            </div>
          )}

          {cur.tipo === 'multicheck' && (
            <div className="space-y-6">
              {cur.opciones!.map(o => {
                const key = o.id as 'residuos_peligrosos' | 'residuos_especiales';
                const on = !!resp[key];
                return (
                  <button key={o.id} onClick={() => setResp(r => ({ ...r, [key]: !r[key] }))}
                    aria-pressed={on} className={`${optCls(on)} min-h-[96px] py-4`}>
                    <span className="text-[20px] text-ink">{o.label}</span>
                    <Check on={on} />
                  </button>
                );
              })}
              <p className="text-sm text-stone-500">Marca las que apliquen. Si no generas ninguna, solo continúa.</p>
            </div>
          )}
        </div>

        <div className="mt-14 mb-10 flex max-w-[738px] items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink">
              <Icon n="arrowL" s={15} />Anterior
            </button>
          ) : <span />}
          {step < Q_STEPS.length - 1
            ? <Btn size="lg" className="min-w-[158px] h-14" onClick={() => setStep(s => s + 1)} disabled={!canNext}>CONTINUAR</Btn>
            : <Btn size="lg" className="min-w-[158px] h-14" onClick={finish} disabled={!canNext}>TERMINAR</Btn>
          }
        </div>
      </div>
    </div>
  );
}
