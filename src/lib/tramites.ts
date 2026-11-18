import { TRAMITES_CATALOG, type DocumentoTramite, type PasoTramite, type TramiteCatalogEntry } from '@/constants/tramites';
import type { ISOItem } from '@/constants/iso14001';
import type { Anexo, Tramite, TramiteEstado } from '@/types';

/* El trámite guardado solo trae su `id` de catálogo; pasos y documentos se leen
   siempre del catálogo para que las mejoras lleguen a proyectos existentes. */

const BY_ID = new Map(TRAMITES_CATALOG.map(c => [c.id, c]));

export function catalogOf(t: Pick<Tramite, 'id'>): TramiteCatalogEntry | undefined {
  return BY_ID.get(t.id);
}

export function pasosDe(t: Pick<Tramite, 'id'>): PasoTramite[] {
  return catalogOf(t)?.pasos ?? [];
}

export function documentosDe(t: Pick<Tramite, 'id'>): DocumentoTramite[] {
  return catalogOf(t)?.documentos ?? [];
}

export function anexosDe(t: Tramite, docId: string): Anexo[] {
  return (t.anexos ?? []).filter(a => a.doc_id === docId);
}

/** Documentos obligatorios de entrada (no los que emite la autoridad). */
export function docsObligatorios(t: Tramite): DocumentoTramite[] {
  return documentosDe(t).filter(d => d.obligatorio && !d.salida);
}

export function docsResumen(t: Tramite) {
  const req = docsObligatorios(t);
  const listos = req.filter(d => anexosDe(t, d.id).length > 0).length;
  return { listos, total: req.length, completos: listos === req.length };
}

export function pasoHecho(t: Tramite, p: PasoTramite): boolean {
  if ((t.pasos_hechos ?? []).includes(p.id)) return true;
  return p.auto === 'documentos' && docsResumen(t).completos && docsResumen(t).total > 0;
}

export function progreso(t: Tramite) {
  const pasos = pasosDe(t);
  const hechos = pasos.filter(p => pasoHecho(t, p)).length;
  return { hechos, total: pasos.length, pct: pasos.length ? Math.round((hechos / pasos.length) * 100) : 0 };
}

export function siguientePaso(t: Tramite): PasoTramite | undefined {
  return pasosDe(t).find(p => !pasoHecho(t, p));
}

const RANK: Record<TramiteEstado, number> = {
  no_iniciado: 0, recopilando: 1, ingresado: 2, en_revision: 3, cumplido: 4, vencido: -1,
};

/**
 * Estado derivado del avance real:
 * el paso completado más adelantado define la fase; si la fecha límite ya pasó
 * y el trámite no está cumplido, queda como vencido.
 */
export function estadoCalculado(t: Tramite, hoy: string): TramiteEstado {
  const pasos = pasosDe(t);
  let estado: TramiteEstado = 'no_iniciado';
  if ((t.anexos ?? []).length > 0 || pasos.some(p => pasoHecho(t, p))) estado = 'recopilando';
  for (const p of pasos) {
    if (p.fase && pasoHecho(t, p) && RANK[p.fase] > RANK[estado]) estado = p.fase;
  }
  if (estado !== 'cumplido' && t.fecha_limite && t.fecha_limite < hoy) return 'vencido';
  return estado;
}

/**
 * Para migrar trámites que solo tenían un estado manual: marca como hechos los
 * pasos cuya fase ya se había alcanzado, para no perder el avance.
 */
export function pasosHastaEstado(catalogId: string, estado: TramiteEstado): string[] {
  const pasos = BY_ID.get(catalogId)?.pasos ?? [];
  if (estado === 'cumplido') return pasos.map(p => p.id);
  const r = RANK[estado];
  // "Recopilando" no dice qué documentos había, así que no se marca nada
  if (r <= RANK.recopilando) return [];
  // El paso que lleva a la fase actual (p. ej. el ingreso) ya ocurrió
  return pasos.filter(p => p.fase && RANK[p.fase] <= r).map(p => p.id);
}

/** Trámites del proyecto que sirven de evidencia para un requisito de ISO 14001. */
export function tramitesParaIso(item: ISOItem, tramites: Tramite[]): Tramite[] {
  if (item.todos) return tramites;
  return tramites.filter(t => catalogOf(t)?.iso.includes(item.id));
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
