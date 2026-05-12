export interface ISOItem {
  id: string;
  texto: string;
}

export interface ISOSeccion {
  nombre: string;
  items: ISOItem[];
}

export const ISO_DATA: Record<string, ISOSeccion> = {
  '4': {
    nombre: 'Contexto de la organización',
    items: [
      { id: '4.1', texto: '4.1 Comprensión del contexto interno y externo de la organización' },
      { id: '4.2', texto: '4.2 Necesidades y expectativas de las partes interesadas' },
      { id: '4.3', texto: '4.3 Alcance del SGA determinado y documentado' },
      { id: '4.4', texto: '4.4 SGA establecido, implementado y mantenido' },
    ],
  },
  '5': {
    nombre: 'Liderazgo',
    items: [
      { id: '5.1', texto: '5.1 Liderazgo y compromiso de la alta dirección' },
      { id: '5.2', texto: '5.2 Política ambiental documentada y comunicada' },
      { id: '5.3', texto: '5.3 Roles, responsabilidades y autoridades asignados' },
    ],
  },
  '6': {
    nombre: 'Planificación',
    items: [
      { id: '6.1.1', texto: '6.1.1 Riesgos y oportunidades identificados' },
      { id: '6.1.2', texto: '6.1.2 Aspectos ambientales significativos determinados' },
      { id: '6.1.3', texto: '6.1.3 Requisitos legales identificados y evaluados' },
      { id: '6.1.4', texto: '6.1.4 Acciones planificadas para cumplir requisitos' },
      { id: '6.2',   texto: '6.2 Objetivos ambientales con planes de acción' },
    ],
  },
  '7': {
    nombre: 'Apoyo',
    items: [
      { id: '7.1', texto: '7.1 Recursos necesarios determinados y proporcionados' },
      { id: '7.2', texto: '7.2 Competencia del personal determinada y documentada' },
      { id: '7.3', texto: '7.3 Toma de conciencia sobre política y aspectos ambientales' },
      { id: '7.4', texto: '7.4 Comunicación interna y externa establecida' },
      { id: '7.5', texto: '7.5 Información documentada controlada' },
    ],
  },
  '8': {
    nombre: 'Operación',
    items: [
      { id: '8.1', texto: '8.1 Planificación y control operacional implementados' },
      { id: '8.2', texto: '8.2 Preparación y respuesta ante emergencias' },
    ],
  },
  '9': {
    nombre: 'Evaluación del desempeño',
    items: [
      { id: '9.1.1', texto: '9.1.1 Seguimiento, medición y análisis definidos' },
      { id: '9.1.2', texto: '9.1.2 Evaluación del cumplimiento legal' },
      { id: '9.2',   texto: '9.2 Auditoría interna programada y ejecutada' },
      { id: '9.3',   texto: '9.3 Revisión por la dirección documentada' },
    ],
  },
  '10': {
    nombre: 'Mejora',
    items: [
      { id: '10.1', texto: '10.1 Mejora continua implementada' },
      { id: '10.2', texto: '10.2 No conformidades y acciones correctivas gestionadas' },
      { id: '10.3', texto: '10.3 Mejora del desempeño ambiental demostrada' },
    ],
  },
};
