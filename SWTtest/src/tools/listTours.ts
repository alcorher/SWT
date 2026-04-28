import { Autonomous, z } from "@botpress/runtime";

interface Tour {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: string;
  tipo: string;
  grupo: boolean;
  horarios: string;
  dias: string;
}

// Tours disponibles de la Knowledge Base con horarios de la web
const TOURS_KNOWLEDGE_BASE: Tour[] = [
  {
    id: 1,
    nombre: "Sevilla City Intro Tour",
    descripcion: "Una introducción completa a las principales atracciones de Sevilla. Plan tu tiempo mejor y maximiza tu experiencia en Sevilla.",
    duracion: "2-3 horas",
    tipo: "tours-grupo",
    grupo: true,
    horarios: "10:30 am (Julio-Agosto: 10:00 am)",
    dias: "Lunes a Sábado (excepto feriados)",
  },
  {
    id: 2,
    nombre: "Cathedral Tour (sin tickets)",
    descripcion: "Visita la Catedral de Sevilla; opción sin entrada incluida.",
    duracion: "2-3 horas",
    tipo: "monumentos",
    grupo: true,
    horarios: "Consultar",
    dias: "Varios días",
  },
  {
    id: 3,
    nombre: "Cathedral Tour (tickets incluidos)",
    descripcion: "Visita la Catedral de Sevilla con la entrada incluida en el precio.",
    duracion: "2-3 horas",
    tipo: "monumentos",
    grupo: true,
    horarios: "Consultar",
    dias: "Varios días",
  },
  {
    id: 4,
    nombre: "Alcázar Tour (sin tickets)",
    descripcion: "Visita el Alcázar de Sevilla; opción sin entrada incluida.",
    duracion: "2-3 horas",
    tipo: "monumentos",
    grupo: true,
    horarios: "Consultar",
    dias: "Varios días",
  },
  {
    id: 5,
    nombre: "Alcázar Tour (tickets incluidos)",
    descripcion: "Visita el Alcázar de Sevilla con la entrada incluida en el precio.",
    duracion: "2-3 horas",
    tipo: "monumentos",
    grupo: true,
    horarios: "Consultar",
    dias: "Varios días",
  },
  {
    id: 6,
    nombre: "Cathedral, Alcázar and Santa Cruz Quarter",
    descripcion: "Experiencia completa del día cubriendo los principales monumentos y el barrio histórico de Santa Cruz.",
    duracion: "4-5 horas",
    tipo: "monumentos",
    grupo: true,
    horarios: "Consultar",
    dias: "Consultar",
  },
  {
    id: 7,
    nombre: "City Intro Tour + 1 Monument",
    descripcion: "Tour de introducción a la ciudad combinado con la visita a uno de los monumentos principales.",
    duracion: "3-4 horas",
    tipo: "tours-grupo",
    grupo: true,
    horarios: "Consultar",
    dias: "Consultar",
  },
  {
    id: 8,
    nombre: "City Intro, Cathedral and Alcázar",
    descripcion: "Tour comprehensivo que combina la orientación de la ciudad con dos monumentos principales.",
    duracion: "4-5 horas",
    tipo: "monumentos",
    grupo: true,
    horarios: "Consultar",
    dias: "Consultar",
  },
  {
    id: 9,
    nombre: "City Intro, Cathedral, Alcázar and Santa Cruz",
    descripcion: "Tour extendido que incluye todo más el histórico barrio de Santa Cruz.",
    duracion: "5-6 horas",
    tipo: "monumentos",
    grupo: true,
    horarios: "Consultar",
    dias: "Consultar",
  },
  {
    id: 10,
    nombre: "Triana to Plaza de España",
    descripcion: "Explora dos áreas icónicas de Sevilla. Combina la cultura del barrio local con la arquitectura monumental.",
    duracion: "2-3 horas",
    tipo: "tours-grupo",
    grupo: true,
    horarios: "Consultar",
    dias: "Consultar",
  },
  {
    id: 11,
    nombre: "Tapas Tour Off the Beaten Path",
    descripcion: "Experiencia culinaria explorando bares de tapas auténticas.",
    duracion: "3 horas",
    tipo: "gastronomia",
    grupo: true,
    horarios: "Consultar (flexible)",
    dias: "Consultar",
  },
  {
    id: 12,
    nombre: "Family Tour",
    descripcion: "Tour especial adaptado para familias con niños.",
    duracion: "2-3 horas",
    tipo: "familia",
    grupo: true,
    horarios: "Flexible - Contactar",
    dias: "Cualquier día",
  },
  {
    id: 13,
    nombre: "Day Trip to Ronda",
    descripcion: "Excursión de día completo al dramático pueblo blanco de Ronda.",
    duracion: "9 horas",
    tipo: "excursiones",
    grupo: true,
    horarios: "8:00 am",
    dias: "Consultar",
  },
  {
    id: 14,
    nombre: "Day Trip to Cádiz and Jerez",
    descripcion: "Excursión a Cádiz y Jerez con transporte incluido.",
    duracion: "8+ horas",
    tipo: "excursiones",
    grupo: true,
    horarios: "Consultar",
    dias: "Consultar",
  },
  {
    id: 15,
    nombre: "Private Custom Tour",
    descripcion: "Tours personalizados completamente adaptados a tus necesidades e intereses específicos.",
    duracion: "Flexible",
    tipo: "privados",
    grupo: false,
    horarios: "Flexible",
    dias: "Cualquier día",
  },
];

// Tool ADK: lista tours desde la Knowledge Base con información de horarios
export default new Autonomous.Tool({
  name: "listTours",
  description:
    "Lista todos los tours disponibles de Sevilla Walking Tours desde la Knowledge Base con información de horarios. Usa esta herramienta cuando el usuario quiera ver qué tours hay o al inicio de la conversación para presentar opciones.",
  input: z.object({
    tipo: z
      .enum(["tours-grupo", "monumentos", "gastronomia", "familia", "excursiones", "privados", "todos"])
      .optional()
      .describe("Filtro opcional por tipo de tour. Usa 'todos' o déjalo vacío para ver todos los tours."),
  }),
  output: z.object({
    tours: z.array(
      z.object({
        id: z.number(),
        nombre: z.string(),
        descripcion: z.string(),
        duracion: z.string(),
        tipo: z.string(),
        horarios: z.string(),
        dias: z.string(),
      })
    ),
    totalTours: z.number(),
    filtroAplicado: z.string().optional(),
  }),
  handler: async ({ tipo = "todos" }) => {
    // Filtrar tours por tipo si se especifica
    let toursFiltered = TOURS_KNOWLEDGE_BASE;
    let filtroAplicado = "Todos los tours";

    if (tipo && tipo !== "todos") {
      toursFiltered = TOURS_KNOWLEDGE_BASE.filter((tour) => tour.tipo === tipo);
      filtroAplicado = `Tours de tipo: ${tipo}`;
    }

    // Mapear solo campos relevantes
    const toursFormateados = toursFiltered.map(({ id, nombre, descripcion, duracion, tipo, horarios, dias }) => ({
      id,
      nombre,
      descripcion,
      duracion,
      tipo,
      horarios,
      dias,
    }));

    return {
      tours: toursFormateados,
      totalTours: toursFormateados.length,
      filtroAplicado,
    };
  },
});
