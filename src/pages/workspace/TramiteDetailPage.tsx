import { useRef, useState, type DragEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Badge } from '@/components/ui/Badge';
import { ESTADOS } from '@/constants/estados';
import type { DocumentoTramite, PasoTramite } from '@/constants/tramites';
import { useAppStore } from '@/store/useAppStore';
import { filesService, MAX_FILE_BYTES } from '@/services/files.service';
import { fmtDate, today, uid } from '@/lib/utils';
import { ymd } from '@/lib/events';
import {
  anexosDe, catalogOf, docsResumen, documentosDe, estadoCalculado, fmtBytes,
  pasoHecho, pasosDe, progreso, siguientePaso,
} from '@/lib/tramites';
import type { Anexo, Tramite } from '@/types';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip,.kml,.kmz,.dwg';

export default function TramiteDetailPage() {
  const { projectId, tramiteId } = useParams<{ projectId: string; tramiteId: string }>();
  const { data } = useAppStore();

  const proj    = data.proyectos.find(p => p.id === projectId);
  const tramite = proj?.tramites.find(t => t._id === tramiteId);

  const [newNota, setNewNota] = useState('');
  const [newHito, setNewHito] = useState({ nombre: '', fecha: '' });
  const [msg, setMsg]         = useState<{ error?: string; ok?: string }>({});
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [dragDoc, setDragDoc] = useState<string | null>(null);
  const [verInfo, setVerInfo] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!proj || !tramite) {
    return (
      <div className="mx-auto max-w-[700px] px-5 pt-20 text-center">
        <p className="text-stone-600">No encontramos este trámite.</p>
        <Link to={`/proyecto/${projectId}/tramites`} className="mt-3 inline-block text-sm font-semibold text-green-700">Volver a trámites</Link>
      </div>
    );
  }

  /**
   * Actualiza el trámite leyendo el estado más reciente del store (las cargas de
   * archivos son asíncronas) y recalcula su estado a partir del avance.
   */
  const saveTramite = (fn: (t: Tramite) => Partial<Tramite>) => {
    const { data: d, updateProject } = useAppStore.getState();
    const p = d.proyectos.find(x => x.id === projectId);
    if (!p) return;
    updateProject({
      tramites: p.tramites.map(t => {
        if (t._id !== tramiteId) return t;
        const next = { ...t, ...fn(t) };
        return { ...next, estado: estadoCalculado(next, ymd(new Date())) };
      }),
    });
  };

  const e       = ESTADOS[tramite.estado] ?? ESTADOS.no_iniciado;
  const prog    = progreso(tramite);
  const pasos   = pasosDe(tramite);
  const docs    = documentosDe(tramite);
  const entrada = docs.filter(d => !d.salida);
  const salida  = docs.filter(d => d.salida);
  const resumen = docsResumen(tramite);
  const next    = siguientePaso(tramite);
  const otros   = anexosDe(tramite, 'otro');
  const docName = (id?: string) => docs.find(d => d.id === id)?.nombre;

  // ── Pasos ──
  const togglePaso = (p: PasoTramite) =>
    saveTramite(t => {
      const hechos = t.pasos_hechos ?? [];
      return { pasos_hechos: hechos.includes(p.id) ? hechos.filter(x => x !== p.id) : [...hechos, p.id] };
    });

  // ── Anexos ──
  const subir = async (docId: string, files: FileList | File[] | null) => {
    const lista = Array.from(files ?? []);
    if (!lista.length) return;
    const grandes = lista.filter(f => f.size > MAX_FILE_BYTES);
    const validos = lista.filter(f => f.size <= MAX_FILE_BYTES);
    setMsg({});
    setSubiendo(docId);
    const nuevos: Anexo[] = [];
    try {
      for (const f of validos) {
        const id = uid();
        await filesService.put(id, f);
        nuevos.push({ id, doc_id: docId, nombre: f.name, tipo: f.type, tamano: f.size, fecha: today() });
      }
    } catch {
      setMsg({ error: 'No se pudo guardar el archivo en este navegador. Revisa el espacio disponible.' });
    } finally {
      setSubiendo(null);
    }
    if (nuevos.length) saveTramite(t => ({ anexos: [...(t.anexos ?? []), ...nuevos] }));
    if (grandes.length) {
      setMsg({ error: `${grandes.map(f => f.name).join(', ')} pesa más de ${fmtBytes(MAX_FILE_BYTES)}.` });
    } else if (nuevos.length) {
      setMsg({ ok: nuevos.length === 1 ? `Se anexó ${nuevos[0].nombre}.` : `Se anexaron ${nuevos.length} archivos.` });
    }
  };

  const quitar = async (a: Anexo) => {
    if (!window.confirm(`¿Quitar "${a.nombre}" de este trámite?`)) return;
    saveTramite(t => ({ anexos: (t.anexos ?? []).filter(x => x.id !== a.id) }));
    filesService.remove([a.id]).catch(() => { /* ya no estaba */ });
    setMsg({ ok: `Se quitó ${a.nombre}.` });
  };

  const ver = async (a: Anexo) => {
    const ok = await filesService.open(a.id, a.nombre).catch(() => false);
    if (!ok) setMsg({ error: `El archivo "${a.nombre}" no está en este navegador. Vuelve a anexarlo.` });
  };

  const pickFile = (docId: string) => inputs.current[docId]?.click();

  const dropProps = (docId: string) => ({
    onDragOver: (ev: DragEvent) => { ev.preventDefault(); if (dragDoc !== docId) setDragDoc(docId); },
    onDragLeave: () => setDragDoc(d => (d === docId ? null : d)),
    onDrop: (ev: DragEvent) => { ev.preventDefault(); setDragDoc(null); subir(docId, ev.dataTransfer.files); },
  });

  // ── Hitos y notas ──
  const addNota = () => {
    if (!newNota.trim()) return;
    saveTramite(t => ({ notas2: [...(t.notas2 ?? []), { id: uid(), texto: newNota.trim(), fecha: today() }] }));
    setNewNota('');
  };
  const addHito = () => {
    if (!newHito.nombre.trim()) return;
    saveTramite(t => ({ cronograma: { ...t.cronograma, hitos: [...(t.cronograma?.hitos ?? []), { id: uid(), nombre: newHito.nombre.trim(), fecha: newHito.fecha, completado: false }] } }));
    setNewHito({ nombre: '', fecha: '' });
  };
  const toggleHito = (hid: string) =>
    saveTramite(t => ({ cronograma: { ...t.cronograma, hitos: (t.cronograma?.hitos ?? []).map(h => (h.id === hid ? { ...h, completado: !h.completado } : h)) } }));
  const delHito = (hid: string) =>
    saveTramite(t => ({ cronograma: { ...t.cronograma, hitos: (t.cronograma?.hitos ?? []).filter(h => h.id !== hid) } }));

  // ── Componentes locales ──
  const fileInput = (docId: string) => (
    <input ref={el => { inputs.current[docId] = el; }} type="file" multiple accept={ACCEPT} className="hidden"
      onChange={ev => { subir(docId, ev.target.files); ev.target.value = ''; }} />
  );

  const anexoRow = (a: Anexo) => (
    <li key={a.id} className="flex items-center gap-2 py-1.5 text-[13px]">
      <Icon n="doc" s={15} cls="flex-shrink-0 text-stone-400" />
      <button onClick={() => ver(a)} className="min-w-0 truncate text-left text-ink hover:text-green-700 hover:underline" title="Abrir">
        {a.nombre}
      </button>
      <span className="flex-shrink-0 text-[11px] text-stone-400">{fmtBytes(a.tamano)} · {fmtDate(a.fecha)}</span>
      <button onClick={() => quitar(a)} aria-label={`Quitar ${a.nombre}`}
        className="ml-auto flex-shrink-0 rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600">
        <Icon n="x" s={13} />
      </button>
    </li>
  );

  const docRow = (d: DocumentoTramite) => {
    const archivos = anexosDe(tramite, d.id);
    const listo = archivos.length > 0;
    return (
      <li key={d.id} {...dropProps(d.id)}
        className={`px-4 py-3 transition-colors ${dragDoc === d.id ? 'bg-green-50 outline-dashed outline-2 -outline-offset-4 outline-green-500' : ''}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${listo ? 'border-green-600 bg-green-600 text-white' : 'border-stone-300'}`}>
            {listo && <Icon n="check" s={11} w={3} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-ink">
              {d.nombre}
              {!d.salida && (
                <span className={`ml-2 align-middle text-[11px] ${d.obligatorio ? 'text-red-600' : 'text-stone-400'}`}>
                  {d.obligatorio ? 'Obligatorio' : 'Opcional'}
                </span>
              )}
            </p>
            {d.detalle && <p className="text-[12px] text-stone-500">{d.detalle}</p>}
            {listo && <ul className="mt-1">{archivos.map(anexoRow)}</ul>}
          </div>
          {fileInput(d.id)}
          <Btn size="sm" variant={listo ? 'ghost' : 'secondary'} disabled={subiendo === d.id} onClick={() => pickFile(d.id)}>
            {subiendo === d.id ? 'Guardando…' : listo ? 'Agregar otro' : 'Anexar'}
          </Btn>
        </div>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 lg:px-6 pt-10 pb-10 fade-in">
      <Link to={`/proyecto/${projectId}/tramites`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink">
        <Icon n="cl" s={14} />Trámites
      </Link>

      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[24px] font-medium text-ink leading-tight">{tramite.nombre}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {tramite.autoridad} · <span className="capitalize">{tramite.nivel}</span>
            {' · '}
            <button onClick={() => setVerInfo(v => !v)} className="text-green-700 hover:underline">
              {verInfo ? 'Ocultar fundamento' : 'Ver fundamento y descripción'}
            </button>
          </p>
        </div>
        <Badge label={e.label} color={e.color} bg={e.bg} />
      </div>

      {verInfo && (
        <div className="mt-4 rounded-lg bg-stone-50 px-5 py-4 text-sm leading-relaxed text-stone-600">
          <p>{tramite.descripcion}</p>
          <p className="mt-2 text-[13px]"><span className="font-medium text-ink">Fundamento legal:</span> {tramite.base_legal}</p>
          <p className="mt-2 text-[12px] text-stone-500">
            Los pasos y documentos son una guía. Confirma los requisitos vigentes con {tramite.autoridad} antes de ingresar.
          </p>
        </div>
      )}

      {/* Avance */}
      <div className="mt-6 rounded-xl border border-stone-200 px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-stone-600">
            <span className="font-display text-2xl font-semibold text-ink">{prog.pct}%</span>
            <span className="ml-2">{prog.hechos} de {prog.total} pasos · {resumen.listos} de {resumen.total} documentos obligatorios</span>
          </p>
          {next
            ? <p className="text-sm text-stone-600">Sigue: <span className="font-medium text-ink">{next.titulo}</span></p>
            : <p className="text-sm font-medium text-green-700">Trámite completo</p>}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${prog.pct}%` }} />
        </div>
        {tramite.estado === 'vencido' && (
          <p className="mt-3 text-[13px] text-red-700">
            La fecha límite ({fmtDate(tramite.fecha_limite)}) ya pasó. Termina los pasos o ajusta la fecha si la autoridad te dio prórroga.
          </p>
        )}
      </div>

      {msg.error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-2.5 text-[13px] text-red-700">{msg.error}</p>}
      {msg.ok && <p role="status" className="mt-4 rounded-md bg-green-50 px-4 py-2.5 text-[13px] text-green-800">{msg.ok}</p>}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="min-w-0 space-y-8">
          {/* Pasos */}
          <section>
            <h2 className="font-display text-[18px] font-semibold text-ink mb-3">Pasos</h2>
            {pasos.length === 0 ? (
              <p className="text-sm text-stone-500">Este trámite no tiene pasos definidos en el catálogo.</p>
            ) : (
              <ol className="relative">
                {pasos.map((p, i) => {
                  const hecho = pasoHecho(tramite, p);
                  const esSiguiente = next?.id === p.id;
                  const auto = p.auto === 'documentos' && resumen.completos && !(tramite.pasos_hechos ?? []).includes(p.id);
                  const evid = p.evidencia ? anexosDe(tramite, p.evidencia) : [];
                  return (
                    <li key={p.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < pasos.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-stone-200" aria-hidden="true" />}
                      <button onClick={() => !auto && togglePaso(p)} disabled={auto}
                        aria-label={hecho ? `Marcar "${p.titulo}" como pendiente` : `Marcar "${p.titulo}" como hecho`}
                        className={`relative z-[1] flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-semibold transition-colors
                          ${hecho ? 'border-green-600 bg-green-600 text-white' : esSiguiente ? 'border-green-600 bg-white text-green-700' : 'border-stone-300 bg-white text-stone-400 hover:border-stone-400'}`}>
                        {hecho ? <Icon n="check" s={15} w={2.6} /> : i + 1}
                      </button>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className={`text-[15px] ${hecho ? 'text-stone-500' : 'text-ink'} ${esSiguiente ? 'font-semibold' : ''}`}>{p.titulo}</p>
                        {p.detalle && <p className="mt-0.5 text-[13px] text-stone-500">{p.detalle}</p>}
                        {p.auto === 'documentos' && (
                          <p className="mt-1 text-[12px] text-stone-500">{resumen.listos} de {resumen.total} documentos obligatorios anexados</p>
                        )}
                        {p.evidencia && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                            <span className="text-stone-500">Evidencia: {docName(p.evidencia)}</span>
                            {evid.length > 0
                              ? <span className="text-green-700">anexada</span>
                              : <button onClick={() => pickFile(p.evidencia!)} className="font-semibold text-green-700 hover:underline">Anexar</button>}
                          </div>
                        )}
                        <div className="mt-2">
                          {auto ? (
                            <span className="text-[12px] text-green-700">Completo por documentos</span>
                          ) : (
                            <button onClick={() => togglePaso(p)}
                              className={`text-[12px] font-semibold ${hecho ? 'text-stone-500 hover:text-ink' : 'text-green-700 hover:underline'}`}>
                              {hecho ? 'Deshacer' : 'Marcar como hecho'}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Documentos */}
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[18px] font-semibold text-ink">Documentos</h2>
              <p className="text-[12px] text-stone-500">Arrastra archivos sobre un documento o usa Anexar. Máx. {fmtBytes(MAX_FILE_BYTES)} por archivo.</p>
            </div>

            <h3 className="text-[13px] font-medium text-stone-500 mb-2">Para presentar</h3>
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {entrada.map(docRow)}
            </ul>

            {salida.length > 0 && (
              <>
                <h3 className="mt-6 text-[13px] font-medium text-stone-500 mb-2">Lo que te entrega la autoridad</h3>
                <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
                  {salida.map(docRow)}
                </ul>
              </>
            )}

            <div {...dropProps('otro')}
              className={`mt-6 rounded-lg border border-dashed px-4 py-3 ${dragDoc === 'otro' ? 'border-green-500 bg-green-50' : 'border-stone-300'}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] text-ink">Otros documentos <span className="text-[12px] text-stone-500">(oficios, prevenciones, fotos, correos)</span></p>
                {fileInput('otro')}
                <Btn size="sm" variant="ghost" disabled={subiendo === 'otro'} onClick={() => pickFile('otro')}>
                  {subiendo === 'otro' ? 'Guardando…' : 'Anexar'}
                </Btn>
              </div>
              {otros.length > 0 && <ul className="mt-1">{otros.map(anexoRow)}</ul>}
            </div>
          </section>

          {/* Notas */}
          <section>
            <h2 className="font-display text-[18px] font-semibold text-ink mb-3">Notas</h2>
            {(tramite.notas2 ?? []).length > 0 && (
              <ul className="mb-3 space-y-2">
                {tramite.notas2.map(n => (
                  <li key={n.id} className="rounded-lg bg-stone-50 px-4 py-2.5">
                    <p className="text-[14px] text-ink whitespace-pre-wrap">{n.texto}</p>
                    <p className="mt-1 text-[11px] text-stone-400">{fmtDate(n.fecha)}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input value={newNota} onChange={ev => setNewNota(ev.target.value)} onKeyDown={ev => { if (ev.key === 'Enter') addNota(); }}
                placeholder="Folio de ingreso, nombre del revisor, acuerdos…"
                className="h-10 flex-1 rounded-md border border-stone-300 px-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" />
              <Btn variant="secondary" onClick={addNota}>Guardar</Btn>
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <aside className="space-y-8">
          <section>
            <h2 className="font-display text-[16px] font-semibold text-ink mb-3">Fechas</h2>
            <div className="space-y-3">
              {[
                { label: 'Inicio', val: tramite.cronograma?.inicio ?? '', key: 'inicio' as const },
                { label: 'Fecha límite', val: tramite.fecha_limite ?? '', key: 'fecha_limite' as const },
                { label: 'Resolución', val: tramite.cronograma?.fin ?? '', key: 'fin' as const },
              ].map(({ label, val, key }) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-[12px] text-stone-500">{label}</span>
                  <input type="date" value={val} onChange={ev => {
                    const v = ev.target.value || null;
                    saveTramite(t => (key === 'fecha_limite' ? { fecha_limite: v } : { cronograma: { ...t.cronograma, [key]: v } }));
                  }} className="h-10 w-full rounded-md border border-stone-300 px-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" />
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ink mb-3">Hitos</h2>
            {(tramite.cronograma?.hitos ?? []).length > 0 && (
              <ul className="mb-3 space-y-1">
                {tramite.cronograma.hitos.map(h => (
                  <li key={h.id} className="group flex items-center gap-2.5 py-1">
                    <button onClick={() => toggleHito(h.id)} aria-label={h.completado ? 'Marcar pendiente' : 'Marcar hecho'}
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${h.completado ? 'border-green-600 bg-green-600 text-white' : 'border-stone-400'}`}>
                      {h.completado && <Icon n="check" s={10} w={3} />}
                    </button>
                    <span className={`flex-1 text-[13px] ${h.completado ? 'text-stone-400 line-through' : 'text-ink'}`}>{h.nombre}</span>
                    {h.fecha && <span className="text-[11px] text-stone-400">{fmtDate(h.fecha)}</span>}
                    <button onClick={() => delHito(h.id)} aria-label="Quitar hito" className="text-stone-300 opacity-0 hover:text-red-600 group-hover:opacity-100">
                      <Icon n="x" s={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2">
              <input value={newHito.nombre} onChange={ev => setNewHito(h => ({ ...h, nombre: ev.target.value }))} placeholder="Nuevo hito"
                className="h-9 w-full rounded-md border border-stone-300 px-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" />
              <div className="flex gap-2">
                <input type="date" value={newHito.fecha} onChange={ev => setNewHito(h => ({ ...h, fecha: ev.target.value }))}
                  className="h-9 flex-1 rounded-md border border-stone-300 px-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" />
                <Btn size="sm" variant="secondary" onClick={addHito}>Agregar</Btn>
              </div>
            </div>
          </section>

          {catalogOf(tramite) && (
            <p className="text-[12px] leading-relaxed text-stone-500">
              Este trámite sirve de evidencia en ISO 14001: {catalogOf(tramite)!.iso.join(', ')}.{' '}
              <Link to={`/proyecto/${projectId}/iso14001`} className="text-green-700 hover:underline">Ver en ISO</Link>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
