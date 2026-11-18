import type { CuestionarioRespuestas, TramiteEstado, TramiteNivel } from '@/types';
import { GIROS } from './giros';

/**
 * Catálogo de trámites.
 *
 * Los pasos y documentos son una guía de referencia para preparar cada trámite;
 * los requisitos exactos pueden variar según la autoridad y el año, por lo que
 * conviene confirmarlos en el portal o la ventanilla correspondiente.
 */

export interface PasoTramite {
  id: string;
  titulo: string;
  detalle?: string;
  /** Estado al que avanza el trámite cuando este paso se completa. */
  fase?: Exclude<TramiteEstado, 'no_iniciado' | 'vencido'>;
  /** Documento que sirve de evidencia del paso (se sugiere anexarlo). */
  evidencia?: string;
  /** Se marca solo cuando están anexados todos los documentos obligatorios. */
  auto?: 'documentos';
}

export interface DocumentoTramite {
  id: string;
  nombre: string;
  detalle?: string;
  obligatorio: boolean;
  /** Documento que entrega la autoridad (acuse, resolución, registro). */
  salida?: boolean;
}

export interface TramiteCatalogEntry {
  id: string;
  nombre: string;
  autoridad: string;
  nivel: TramiteNivel;
  base_legal: string;
  descripcion: string;
  condicion: (resp: CuestionarioRespuestas) => boolean;
  pasos: PasoTramite[];
  documentos: DocumentoTramite[];
  /** Requisitos de ISO 14001 que este trámite ayuda a demostrar. */
  iso: string[];
}

// ── Piezas comunes ─────────────────────────────────────────────────────────

const DOCS_EMPRESA: DocumentoTramite[] = [
  { id: 'acta',      nombre: 'Acta constitutiva', obligatorio: true },
  { id: 'poder',     nombre: 'Poder del representante legal', obligatorio: true },
  { id: 'ine',       nombre: 'Identificación oficial del representante legal', obligatorio: true },
  { id: 'rfc',       nombre: 'Constancia de situación fiscal (RFC)', obligatorio: true },
];

const DOC_PAGO: DocumentoTramite = {
  id: 'pago', nombre: 'Comprobante de pago de derechos', detalle: 'Hoja de ayuda o recibo bancario del pago.', obligatorio: true,
};

const DOC_ACUSE: DocumentoTramite = {
  id: 'acuse', nombre: 'Acuse de recibo del ingreso', detalle: 'Sello o folio que entrega la autoridad.', obligatorio: false, salida: true,
};

const PASO_DOCS: PasoTramite = {
  id: 'docs', titulo: 'Reunir y anexar la documentación', fase: 'recopilando', auto: 'documentos',
  detalle: 'Se marca solo cuando están anexados todos los documentos obligatorios.',
};

function pasosEstandar(opts: {
  preparar: PasoTramite[];
  ingreso: string;
  seguimiento?: string;
  resolucion: string;
  salida: string;
}): PasoTramite[] {
  return [
    PASO_DOCS,
    ...opts.preparar.map(p => ({ fase: 'recopilando' as const, ...p })),
    { id: 'ingreso', titulo: opts.ingreso, fase: 'ingresado', evidencia: 'acuse' },
    {
      id: 'seguimiento', titulo: opts.seguimiento ?? 'Dar seguimiento y atender requerimientos',
      detalle: 'Si la autoridad pide información adicional, respóndela dentro del plazo indicado.', fase: 'en_revision',
    },
    { id: 'resolucion', titulo: opts.resolucion, fase: 'cumplido', evidencia: opts.salida },
  ];
}

// ── Catálogo ───────────────────────────────────────────────────────────────

export const TRAMITES_CATALOG: TramiteCatalogEntry[] = [
  {
    id: 'mia_federal',
    nombre: 'MIA Federal (Modalidad Particular)',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Art. 28 y 30 LGEEPA; Arts. 5,9,10,11,12,13 Rgto. LGEEPA MEIA; NOM-059-SEMARNAT-2010',
    descripcion: 'Obligatoria para obras/actividades del Art. 28 LGEEPA: industria química, petroquímica, siderurgia, cemento, minería, hidrocarburos y otras actividades de competencia federal.',
    condicion: ({ giro, obras }) => !!(GIROS.find(g => g.id === giro)?.art28 && obras),
    documentos: [
      { id: 'mia', nombre: 'Manifestación de Impacto Ambiental, modalidad particular', detalle: 'Documento completo, impreso y en digital.', obligatorio: true },
      { id: 'resumen', nombre: 'Resumen ejecutivo de la MIA', obligatorio: true },
      { id: 'planos', nombre: 'Planos de localización y del proyecto', obligatorio: true },
      ...DOCS_EMPRESA,
      DOC_PAGO,
      DOC_ACUSE,
      { id: 'resolucion', nombre: 'Resolución en materia de impacto ambiental', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [
        { id: 'elaborar', titulo: 'Elaborar la MIA', detalle: 'Describe el proyecto, el sitio, los impactos y las medidas de mitigación.' },
        { id: 'pagar', titulo: 'Pagar los derechos de evaluación', evidencia: 'pago' },
      ],
      ingreso: 'Ingresar la MIA ante SEMARNAT',
      seguimiento: 'Dar seguimiento a la evaluación y, si aplica, a la consulta pública',
      resolucion: 'Recibir la resolución de impacto ambiental',
      salida: 'resolucion',
    }),
    iso: ['6.1.2', '6.1.3', '8.1', '9.1.2'],
  },
  {
    id: 'mia_estatal',
    nombre: 'MIA Estatal (Modalidad Industrial)',
    autoridad: 'Secretaría de Medio Ambiente NL',
    nivel: 'estatal',
    base_legal: 'Ley Ambiental del Estado de NL (Decreto 252), Art. 1 fracc. V; Guías MIA 2025',
    descripcion: 'Obligatoria para obras o actividades que no son de competencia federal. Aplica cuando la empresa realiza obras, ampliaciones o modificaciones de instalaciones en NL.',
    condicion: ({ obras }) => !!obras,
    documentos: [
      { id: 'solicitud', nombre: 'Solicitud de evaluación firmada', obligatorio: true },
      { id: 'mia', nombre: 'Manifestación de Impacto Ambiental estatal', detalle: 'Conforme a la guía vigente de la Secretaría.', obligatorio: true },
      { id: 'uso_suelo', nombre: 'Licencia o factibilidad de uso de suelo municipal', obligatorio: true },
      { id: 'planos', nombre: 'Planos del proyecto y de ubicación', obligatorio: true },
      ...DOCS_EMPRESA,
      DOC_PAGO,
      DOC_ACUSE,
      { id: 'resolucion', nombre: 'Resolución de impacto ambiental estatal', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [
        { id: 'elaborar', titulo: 'Elaborar la MIA con la guía estatal' },
        { id: 'pagar', titulo: 'Pagar los derechos', evidencia: 'pago' },
      ],
      ingreso: 'Ingresar la MIA ante la Secretaría de Medio Ambiente NL',
      resolucion: 'Recibir la resolución',
      salida: 'resolucion',
    }),
    iso: ['6.1.2', '6.1.3', '8.1', '9.1.2'],
  },
  {
    id: 'licencia_ff',
    nombre: 'Licencia de Funcionamiento — Fuentes Fijas',
    autoridad: 'Secretaría de Medio Ambiente NL',
    nivel: 'estatal',
    base_legal: 'Ley Ambiental NL Art. 1 fracc. VIII; Rgto. Ley Ambiental NL; NOM-043-SEMARNAT-1993; NOM-085-SEMARNAT-2011',
    descripcion: 'Licencia para fuentes fijas que emiten contaminantes a la atmósfera. Aplica con chimeneas, ductos o procesos de combustión. Renovación anual.',
    condicion: ({ emisiones }) => !!emisiones,
    documentos: [
      { id: 'solicitud', nombre: 'Solicitud de licencia de funcionamiento', obligatorio: true },
      { id: 'estudio_emisiones', nombre: 'Estudio de emisiones a la atmósfera', detalle: 'Muestreo hecho por un laboratorio acreditado.', obligatorio: true },
      { id: 'diagrama', nombre: 'Diagrama de flujo del proceso', obligatorio: true },
      { id: 'planos', nombre: 'Plano con ubicación de chimeneas y equipos de combustión', obligatorio: true },
      { id: 'uso_suelo', nombre: 'Licencia de uso de suelo', obligatorio: true },
      ...DOCS_EMPRESA,
      DOC_PAGO,
      DOC_ACUSE,
      { id: 'licencia', nombre: 'Licencia de funcionamiento emitida', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [
        { id: 'muestreo', titulo: 'Contratar el muestreo de emisiones', evidencia: 'estudio_emisiones' },
        { id: 'pagar', titulo: 'Pagar los derechos', evidencia: 'pago' },
      ],
      ingreso: 'Ingresar la solicitud ante la Secretaría',
      resolucion: 'Recibir la licencia (agenda su renovación anual)',
      salida: 'licencia',
    }),
    iso: ['6.1.2', '6.1.3', '8.1', '9.1.1', '9.1.2'],
  },
  {
    id: 'coa',
    nombre: 'COA — Cédula de Operación Anual',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Art. 109 BIS LGEEPA; Art. 10 Rgto. LGEEPA MPCCA; Acuerdo DOF 2014',
    descripcion: 'Reporte anual de emisiones a la atmósfera y transferencia de contaminantes. Fecha límite: 31 de mayo de cada año. Aplica a establecimientos de competencia federal.',
    condicion: ({ giro, emisiones }) => !!(GIROS.find(g => g.id === giro)?.art28 && emisiones),
    documentos: [
      { id: 'combustibles', nombre: 'Bitácoras de consumo de combustibles del año', obligatorio: true },
      { id: 'emisiones', nombre: 'Resultados de muestreo de emisiones', obligatorio: true },
      { id: 'manifiestos', nombre: 'Manifiestos de entrega de residuos peligrosos', obligatorio: false },
      { id: 'agua', nombre: 'Registros de consumo y descarga de agua', obligatorio: false },
      { id: 'acuse', nombre: 'Acuse de envío de la COA', obligatorio: false, salida: true },
    ],
    pasos: [
      PASO_DOCS,
      { id: 'datos', titulo: 'Concentrar los datos del año anterior', detalle: 'Producción, combustibles, emisiones, residuos y agua.', fase: 'recopilando' },
      { id: 'captura', titulo: 'Capturar la COA en el portal de SEMARNAT', fase: 'recopilando' },
      { id: 'ingreso', titulo: 'Firmar y enviar con e.firma', detalle: 'La e.firma se usa directo en el portal; no la subas aquí.', fase: 'ingresado', evidencia: 'acuse' },
      { id: 'resolucion', titulo: 'Guardar el acuse y agendar el reporte del próximo año', fase: 'cumplido', evidencia: 'acuse' },
    ],
    iso: ['6.1.3', '9.1.1', '9.1.2'],
  },
  {
    id: 'gei',
    nombre: 'Inventario de GEI (RENE)',
    autoridad: 'SEMARNAT / RENE',
    nivel: 'federal',
    base_legal: 'Art. 87 LGCC; Reglamento RENE; Acuerdo SEMARNAT 2014',
    descripcion: 'Cálculo y reporte anual de Gases de Efecto Invernadero. Aplica a establecimientos que emitan 25,000+ tCO2e/año. Reporte en septiembre.',
    condicion: ({ emisiones }) => !!emisiones,
    documentos: [
      { id: 'actividad', nombre: 'Datos de actividad', detalle: 'Consumo de combustibles y de electricidad del año.', obligatorio: true },
      { id: 'calculo', nombre: 'Memoria de cálculo de emisiones de GEI', obligatorio: true },
      { id: 'dictamen', nombre: 'Dictamen de verificación', detalle: 'Cuando corresponda por periodo, emitido por un organismo acreditado.', obligatorio: false },
      { id: 'acuse', nombre: 'Acuse del reporte RENE', obligatorio: false, salida: true },
    ],
    pasos: [
      { id: 'umbral', titulo: 'Confirmar si superas 25,000 tCO2e al año', detalle: 'Si no lo superas, deja una nota con el cálculo que lo respalda.', fase: 'recopilando' },
      PASO_DOCS,
      { id: 'calculo', titulo: 'Calcular el inventario de emisiones', fase: 'recopilando', evidencia: 'calculo' },
      { id: 'ingreso', titulo: 'Reportar en la plataforma de SEMARNAT', fase: 'ingresado', evidencia: 'acuse' },
      { id: 'resolucion', titulo: 'Guardar el acuse del reporte', fase: 'cumplido', evidencia: 'acuse' },
    ],
    iso: ['6.1.2', '6.1.3', '9.1.1', '9.1.2'],
  },
  {
    id: 'registro_rp',
    nombre: 'Registro Generador de RP (SEMARNAT-07-017)',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Arts. 46-48 LGPGIR; Art. 72 Rgto. LGPGIR; NOM-052-SEMARNAT-2005; FF-SEMARNAT-090',
    descripcion: 'Registro ante SEMARNAT como generador de residuos peligrosos. Trámite tipo aviso, sin costo. Se obtiene NRA (Número de Registro Ambiental).',
    condicion: ({ residuos_peligrosos }) => !!residuos_peligrosos,
    documentos: [
      { id: 'formato', nombre: 'Formato de registro como generador', obligatorio: true },
      { id: 'listado', nombre: 'Listado de residuos peligrosos y cantidades estimadas', detalle: 'Clasificados según la NOM-052-SEMARNAT-2005.', obligatorio: true },
      { id: 'ine', nombre: 'Identificación oficial del representante legal', obligatorio: true },
      { id: 'rfc', nombre: 'Constancia de situación fiscal (RFC)', obligatorio: true },
      { id: 'acta', nombre: 'Acta constitutiva', obligatorio: false },
      { id: 'registro', nombre: 'Constancia de registro / NRA', obligatorio: false, salida: true },
    ],
    pasos: [
      { id: 'identificar', titulo: 'Identificar y clasificar los residuos peligrosos', fase: 'recopilando', evidencia: 'listado' },
      { id: 'categoria', titulo: 'Determinar tu categoría de generador', detalle: 'Micro, pequeño o gran generador según el volumen anual.', fase: 'recopilando' },
      PASO_DOCS,
      { id: 'ingreso', titulo: 'Presentar el registro ante SEMARNAT', fase: 'ingresado' },
      { id: 'resolucion', titulo: 'Recibir la constancia de registro (NRA)', fase: 'cumplido', evidencia: 'registro' },
    ],
    iso: ['6.1.2', '6.1.3', '8.1', '9.1.2'],
  },
  {
    id: 'plan_rp',
    nombre: 'Plan de Manejo de Residuos Peligrosos',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Arts. 29-32 LGPGIR; Art. 7 fracc. II y Art. 13 Rgto. LGPGIR; FF-SEMARNAT-034',
    descripcion: 'Obligatorio para grandes generadores. Incluye identificación de residuos, cantidades, estrategias de minimización, valoración y destino final.',
    condicion: ({ residuos_peligrosos }) => !!residuos_peligrosos,
    documentos: [
      { id: 'plan', nombre: 'Plan de manejo de residuos peligrosos', obligatorio: true },
      { id: 'nra', nombre: 'Constancia de registro como generador (NRA)', obligatorio: true },
      { id: 'contratos', nombre: 'Contratos con empresas autorizadas de recolección y disposición', obligatorio: true },
      { id: 'formato', nombre: 'Formato de registro del plan de manejo', obligatorio: true },
      DOC_ACUSE,
      { id: 'registro', nombre: 'Registro del plan de manejo', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [
        { id: 'elaborar', titulo: 'Redactar el plan', detalle: 'Residuos, cantidades, minimización, almacenamiento, transporte y destino final.', evidencia: 'plan' },
      ],
      ingreso: 'Presentar el plan ante SEMARNAT',
      resolucion: 'Recibir el registro del plan',
      salida: 'registro',
    }),
    iso: ['6.1.3', '8.1', '9.1.2'],
  },
  {
    id: 'registro_rme',
    nombre: 'Registro Generador de RME',
    autoridad: 'PMA Nuevo León',
    nivel: 'estatal',
    base_legal: 'Ley Ambiental NL; NOM-161-SEMARNAT-2011; Arts. 7 fracc. V, 19 y 20 LGPGIR',
    descripcion: 'Registro ante la Procuraduría de Medio Ambiente de NL como generador de Residuos de Manejo Especial.',
    condicion: ({ residuos_especiales }) => !!residuos_especiales,
    documentos: [
      { id: 'solicitud', nombre: 'Solicitud de registro', obligatorio: true },
      { id: 'listado', nombre: 'Listado de residuos de manejo especial y volúmenes', obligatorio: true },
      ...DOCS_EMPRESA,
      DOC_ACUSE,
      { id: 'registro', nombre: 'Registro como generador de RME', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [{ id: 'identificar', titulo: 'Identificar los RME y estimar volúmenes', evidencia: 'listado' }],
      ingreso: 'Presentar la solicitud ante la Procuraduría',
      resolucion: 'Recibir el registro',
      salida: 'registro',
    }),
    iso: ['6.1.2', '6.1.3', '9.1.2'],
  },
  {
    id: 'plan_rme',
    nombre: 'Plan de Manejo de RME',
    autoridad: 'PMA Nuevo León',
    nivel: 'estatal',
    base_legal: 'Arts. 7 fracc. V, 19, 20, 28 fracc. III, 30, 32 LGPGIR; NOM-161-SEMARNAT-2011',
    descripcion: 'Documento con acciones para el manejo de RME: identificación, almacenamiento, transporte, valoración y disposición final.',
    condicion: ({ residuos_especiales }) => !!residuos_especiales,
    documentos: [
      { id: 'plan', nombre: 'Plan de manejo de RME', obligatorio: true },
      { id: 'registro_gen', nombre: 'Registro como generador de RME', obligatorio: true },
      { id: 'contratos', nombre: 'Contratos con transportistas y receptores autorizados', obligatorio: true },
      DOC_ACUSE,
      { id: 'registro', nombre: 'Registro del plan de manejo', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [{ id: 'elaborar', titulo: 'Redactar el plan de manejo', evidencia: 'plan' }],
      ingreso: 'Presentar el plan ante la Procuraduría',
      resolucion: 'Recibir el registro del plan',
      salida: 'registro',
    }),
    iso: ['6.1.3', '8.1', '9.1.2'],
  },
  {
    id: 'descarga_agua',
    nombre: 'Registro Descarga de Aguas Residuales',
    autoridad: 'CONAGUA / Municipio / SADM',
    nivel: 'municipal',
    base_legal: 'LAN y Rgto.; NOM-001-SEMARNAT-2021; NOM-002-SEMARNAT-1996; Ley Ambiental NL Art. 3 fracc. XXII',
    descripcion: 'Registro de descarga a cuerpo federal (CONAGUA) o a alcantarillado (Municipio/SADM). Cumplir parámetros fisicoquímicos de las NOMs.',
    condicion: ({ agua }) => !!agua,
    documentos: [
      { id: 'solicitud', nombre: 'Solicitud de permiso o registro de descarga', obligatorio: true },
      { id: 'analisis', nombre: 'Análisis fisicoquímico del agua residual', detalle: 'Hecho por un laboratorio acreditado.', obligatorio: true },
      { id: 'planos', nombre: 'Plano de la red de drenaje y punto de descarga', obligatorio: true },
      { id: 'suministro', nombre: 'Título de concesión o comprobante de suministro de agua', obligatorio: true },
      ...DOCS_EMPRESA,
      DOC_ACUSE,
      { id: 'permiso', nombre: 'Permiso o registro de descarga', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [
        { id: 'destino', titulo: 'Confirmar a dónde descargas', detalle: 'Cuerpo de agua federal (CONAGUA) o drenaje municipal (SADM / Municipio).' },
        { id: 'muestreo', titulo: 'Muestrear y analizar la descarga', evidencia: 'analisis' },
      ],
      ingreso: 'Presentar la solicitud ante la autoridad que corresponda',
      resolucion: 'Recibir el permiso o registro',
      salida: 'permiso',
    }),
    iso: ['6.1.2', '6.1.3', '8.1', '9.1.1', '9.1.2'],
  },
  {
    id: 'estudio_riesgo',
    nombre: 'Estudio de Riesgo Ambiental',
    autoridad: 'Secretaría de Medio Ambiente NL',
    nivel: 'estatal',
    base_legal: 'LGEEPA Arts. 145-149; Ley Ambiental NL; Listados AAR (DOF); Guía ERA 2025',
    descripcion: 'Obligatorio si la empresa maneja sustancias del Listado de Actividades Altamente Riesgosas. Aplica principalmente a industria química y petroquímica.',
    condicion: ({ giro }) => giro === 'quimica',
    documentos: [
      { id: 'inventario', nombre: 'Inventario de sustancias y cantidades almacenadas', obligatorio: true },
      { id: 'hds', nombre: 'Hojas de datos de seguridad de las sustancias', obligatorio: true },
      { id: 'estudio', nombre: 'Estudio de riesgo ambiental', obligatorio: true },
      { id: 'planos', nombre: 'Planos de instalaciones y zonas de almacenamiento', obligatorio: true },
      { id: 'ppa', nombre: 'Programa para la prevención de accidentes', obligatorio: false },
      ...DOCS_EMPRESA,
      DOC_ACUSE,
      { id: 'resolucion', nombre: 'Resolución del estudio de riesgo', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [
        { id: 'listado', titulo: 'Comparar tus sustancias contra los listados de actividades riesgosas', evidencia: 'inventario' },
        { id: 'elaborar', titulo: 'Elaborar el estudio de riesgo', evidencia: 'estudio' },
      ],
      ingreso: 'Ingresar el estudio ante la Secretaría',
      resolucion: 'Recibir la resolución',
      salida: 'resolucion',
    }),
    iso: ['6.1.1', '6.1.3', '8.2', '9.1.2'],
  },
  {
    id: 'plan_minero',
    nombre: 'Plan de Manejo Residuos Minero-Metalúrgicos',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Arts. 2,7,17,27,32 LGPGIR; Arts. 33,34,40 Rgto. LGPGIR; NOM-157-SEMARNAT-2009',
    descripcion: 'Para empresas de minería y procesamiento de minerales. Caracterización química y volumétrica, acciones de minimización y manejo integral.',
    condicion: ({ giro }) => giro === 'mineria',
    documentos: [
      { id: 'caracterizacion', nombre: 'Caracterización química y volumétrica de los residuos', obligatorio: true },
      { id: 'plan', nombre: 'Plan de manejo de residuos minero-metalúrgicos', obligatorio: true },
      ...DOCS_EMPRESA,
      DOC_ACUSE,
      { id: 'registro', nombre: 'Registro del plan de manejo', obligatorio: false, salida: true },
    ],
    pasos: pasosEstandar({
      preparar: [
        { id: 'caracterizar', titulo: 'Caracterizar los residuos', evidencia: 'caracterizacion' },
        { id: 'elaborar', titulo: 'Redactar el plan de manejo', evidencia: 'plan' },
      ],
      ingreso: 'Presentar el plan ante SEMARNAT',
      resolucion: 'Recibir el registro del plan',
      salida: 'registro',
    }),
    iso: ['6.1.2', '6.1.3', '8.1', '9.1.2'],
  },
];
