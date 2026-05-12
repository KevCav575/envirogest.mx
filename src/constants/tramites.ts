import type { CuestionarioRespuestas, TramiteNivel } from '@/types';
import { GIROS } from './giros';

export interface TramiteCatalogEntry {
  id: string;
  nombre: string;
  autoridad: string;
  nivel: TramiteNivel;
  base_legal: string;
  descripcion: string;
  condicion: (resp: CuestionarioRespuestas) => boolean;
}

export const TRAMITES_CATALOG: TramiteCatalogEntry[] = [
  {
    id: 'mia_federal',
    nombre: 'MIA Federal (Modalidad Particular)',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Art. 28 y 30 LGEEPA; Arts. 5,9,10,11,12,13 Rgto. LGEEPA MEIA; NOM-059-SEMARNAT-2010',
    descripcion: 'Obligatoria para obras/actividades del Art. 28 LGEEPA: industria química, petroquímica, siderurgia, cemento, minería, hidrocarburos y otras actividades de competencia federal.',
    condicion: ({ giro, obras }) => !!(GIROS.find(g => g.id === giro)?.art28 && obras),
  },
  {
    id: 'mia_estatal',
    nombre: 'MIA Estatal (Modalidad Industrial)',
    autoridad: 'Secretaría de Medio Ambiente NL',
    nivel: 'estatal',
    base_legal: 'Ley Ambiental del Estado de NL (Decreto 252), Art. 1 fracc. V; Guías MIA 2025',
    descripcion: 'Obligatoria para obras o actividades que no son de competencia federal. Aplica cuando la empresa realiza obras, ampliaciones o modificaciones de instalaciones en NL.',
    condicion: ({ obras }) => !!obras,
  },
  {
    id: 'licencia_ff',
    nombre: 'Licencia de Funcionamiento — Fuentes Fijas',
    autoridad: 'Secretaría de Medio Ambiente NL',
    nivel: 'estatal',
    base_legal: 'Ley Ambiental NL Art. 1 fracc. VIII; Rgto. Ley Ambiental NL; NOM-043-SEMARNAT-1993; NOM-085-SEMARNAT-2011',
    descripcion: 'Licencia para fuentes fijas que emiten contaminantes a la atmósfera. Aplica con chimeneas, ductos o procesos de combustión. Renovación anual.',
    condicion: ({ emisiones }) => !!emisiones,
  },
  {
    id: 'coa',
    nombre: 'COA — Cédula de Operación Anual',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Art. 109 BIS LGEEPA; Art. 10 Rgto. LGEEPA MPCCA; Acuerdo DOF 2014',
    descripcion: 'Reporte anual de emisiones a la atmósfera y transferencia de contaminantes. Fecha límite: 31 de mayo de cada año. Aplica a establecimientos de competencia federal.',
    condicion: ({ giro, emisiones }) => !!(GIROS.find(g => g.id === giro)?.art28 && emisiones),
  },
  {
    id: 'gei',
    nombre: 'Inventario de GEI (RENE)',
    autoridad: 'SEMARNAT / RENE',
    nivel: 'federal',
    base_legal: 'Art. 87 LGCC; Reglamento RENE; Acuerdo SEMARNAT 2014',
    descripcion: 'Cálculo y reporte anual de Gases de Efecto Invernadero. Aplica a establecimientos que emitan 25,000+ tCO2e/año. Reporte en septiembre.',
    condicion: ({ emisiones }) => !!emisiones,
  },
  {
    id: 'registro_rp',
    nombre: 'Registro Generador de RP (SEMARNAT-07-017)',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Arts. 46-48 LGPGIR; Art. 72 Rgto. LGPGIR; NOM-052-SEMARNAT-2005; FF-SEMARNAT-090',
    descripcion: 'Registro ante SEMARNAT como generador de residuos peligrosos. Trámite tipo aviso, sin costo. Se obtiene NRA (Número de Registro Ambiental).',
    condicion: ({ residuos_peligrosos }) => !!residuos_peligrosos,
  },
  {
    id: 'plan_rp',
    nombre: 'Plan de Manejo de Residuos Peligrosos',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Arts. 29-32 LGPGIR; Art. 7 fracc. II y Art. 13 Rgto. LGPGIR; FF-SEMARNAT-034',
    descripcion: 'Obligatorio para grandes generadores. Incluye identificación de residuos, cantidades, estrategias de minimización, valoración y destino final.',
    condicion: ({ residuos_peligrosos }) => !!residuos_peligrosos,
  },
  {
    id: 'registro_rme',
    nombre: 'Registro Generador de RME',
    autoridad: 'PMA Nuevo León',
    nivel: 'estatal',
    base_legal: 'Ley Ambiental NL; NOM-161-SEMARNAT-2011; Arts. 7 fracc. V, 19 y 20 LGPGIR',
    descripcion: 'Registro ante la Procuraduría de Medio Ambiente de NL como generador de Residuos de Manejo Especial.',
    condicion: ({ residuos_especiales }) => !!residuos_especiales,
  },
  {
    id: 'plan_rme',
    nombre: 'Plan de Manejo de RME',
    autoridad: 'PMA Nuevo León',
    nivel: 'estatal',
    base_legal: 'Arts. 7 fracc. V, 19, 20, 28 fracc. III, 30, 32 LGPGIR; NOM-161-SEMARNAT-2011',
    descripcion: 'Documento con acciones para el manejo de RME: identificación, almacenamiento, transporte, valoración y disposición final.',
    condicion: ({ residuos_especiales }) => !!residuos_especiales,
  },
  {
    id: 'descarga_agua',
    nombre: 'Registro Descarga de Aguas Residuales',
    autoridad: 'CONAGUA / Municipio / SADM',
    nivel: 'municipal',
    base_legal: 'LAN y Rgto.; NOM-001-SEMARNAT-2021; NOM-002-SEMARNAT-1996; Ley Ambiental NL Art. 3 fracc. XXII',
    descripcion: 'Registro de descarga a cuerpo federal (CONAGUA) o a alcantarillado (Municipio/SADM). Cumplir parámetros fisicoquímicos de las NOMs.',
    condicion: ({ agua }) => !!agua,
  },
  {
    id: 'estudio_riesgo',
    nombre: 'Estudio de Riesgo Ambiental',
    autoridad: 'Secretaría de Medio Ambiente NL',
    nivel: 'estatal',
    base_legal: 'LGEEPA Arts. 145-149; Ley Ambiental NL; Listados AAR (DOF); Guía ERA 2025',
    descripcion: 'Obligatorio si la empresa maneja sustancias del Listado de Actividades Altamente Riesgosas. Aplica principalmente a industria química y petroquímica.',
    condicion: ({ giro }) => giro === 'quimica',
  },
  {
    id: 'plan_minero',
    nombre: 'Plan de Manejo Residuos Minero-Metalúrgicos',
    autoridad: 'SEMARNAT',
    nivel: 'federal',
    base_legal: 'Arts. 2,7,17,27,32 LGPGIR; Arts. 33,34,40 Rgto. LGPGIR; NOM-157-SEMARNAT-2009',
    descripcion: 'Para empresas de minería y procesamiento de minerales. Caracterización química y volumétrica, acciones de minimización y manejo integral.',
    condicion: ({ giro }) => giro === 'mineria',
  },
];
