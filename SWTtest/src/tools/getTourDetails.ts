import { Autonomous, z } from "@botpress/runtime";
import { supabaseFetch } from "../lib/supabaseClient";

// Tours de la Knowledge Base (misma estructura que en listTours.ts)
const TOURS_KB = [
  { id: 1, nombre: "Sevilla City Intro Tour", horarios: "10:30 am (Julio-Agosto: 10:00 am)", dias: "Lunes a Sábado (excepto feriados)", maxPersonas: 12, precio: 25 },
  { id: 2, nombre: "Cathedral Tour (sin tickets)", horarios: "12:45 o 13:15", dias: "Lunes, Miércoles y Viernes (excepto festivos)", maxPersonas: 12, precio: 30 },
  { id: 3, nombre: "Cathedral Tour (tickets incluidos)", horarios: "12:45 o 13:15", dias: "Lunes, Miércoles y Viernes (excepto festivos)", maxPersonas: 12, precio: 45 },
  { id: 4, nombre: "Alcázar Tour (sin tickets)", horarios: "13:15 (verano: 12:45; primavera/otoño también 15:15)", dias: "Mar/Jue/Sáb + opciones estacionales Lun/Mie/Vie", maxPersonas: 12, precio: 30 },
  { id: 5, nombre: "Alcázar Tour (tickets incluidos)", horarios: "13:15 (verano: 12:45; primavera/otoño también 15:15)", dias: "Mar/Jue/Sáb + opciones estacionales Lun/Mie/Vie", maxPersonas: 12, precio: 45 },
  { id: 6, nombre: "Cathedral, Alcázar and Santa Cruz Quarter", horarios: "Consultar", dias: "Consultar", maxPersonas: 12, precio: 55 },
  { id: 7, nombre: "City Intro Tour + 1 Monument", horarios: "Consultar", dias: "Consultar", maxPersonas: 12, precio: 40 },
  { id: 8, nombre: "City Intro, Cathedral and Alcázar", horarios: "Consultar", dias: "Consultar", maxPersonas: 12, precio: 50 },
  { id: 9, nombre: "City Intro, Cathedral, Alcázar and Santa Cruz", horarios: "Consultar", dias: "Consultar", maxPersonas: 12, precio: 60 },
  { id: 10, nombre: "Triana to Plaza de España", horarios: "Consultar", dias: "Consultar", maxPersonas: 12, precio: 30 },
  { id: 11, nombre: "Tapas Tour Off the Beaten Path", horarios: "Consultar (flexible)", dias: "Consultar", maxPersonas: 12, precio: 35 },
  { id: 12, nombre: "Family Tour", horarios: "Flexible - Contactar", dias: "Cualquier día", maxPersonas: 12, precio: 40 },
  { id: 13, nombre: "Day Trip to Ronda", horarios: "8:00 am", dias: "Consultar", maxPersonas: 8, precio: 80 },
  { id: 14, nombre: "Day Trip to Cádiz and Jerez", horarios: "9:00 am", dias: "Consultar", maxPersonas: 8, precio: 85 },
  { id: 15, nombre: "Private Custom Tour", horarios: "Flexible", dias: "Cualquier día", maxPersonas: 12, precio: 0 },
];

interface TourGuideJoin {
  guide_id: number;
  guides: {
    id: number;
    nombre: string;
    idiomas: string[];
    especialidad: string;
    experiencia: number;
  };
}

// Tool ADK: obtiene detalle completo de un tour desde KB y guías desde Supabase
export default new Autonomous.Tool({
  name: "getTourDetails",
  description:
    "Obtiene los detalles completos de un tour específico (desde la Knowledge Base con horarios), incluyendo los guías disponibles. Usa esta herramienta cuando el usuario pregunte por más información sobre un tour concreto.",
  input: z.object({
    tourId: z.number().describe("ID del tour del que se quieren obtener detalles."),
  }),
  output: z.object({
    encontrado: z.boolean(),
    tour: z
      .object({
        id: z.number(),
        nombre: z.string(),
        horarios: z.string(),
        dias: z.string(),
        schedule: z.array(z.object({ dia: z.number(), hora: z.string() })).optional(),
        maxPersonas: z.number(),
        precio: z.number(),
      })
      .optional(),
    guias: z.array(
      z.object({
        id: z.number(),
        nombre: z.string(),
        idiomas: z.array(z.string()),
        especialidad: z.string(),
        experiencia: z.number(),
      })
    ),
    error: z.string().optional(),
  }),
  handler: async ({ tourId }) => {
    try {
      // 1) Busca el tour en la Knowledge Base
      const tour = TOURS_KB.find((t) => t.id === tourId);

      if (!tour) {
        return { 
          encontrado: false, 
          tour: undefined, 
          guias: [],
          error: `No se encontró el tour con ID ${tourId}` 
        };
      }

      // 2) Trae guías asignados al tour usando Supabase (tabla puente tour_guides)
      let guias = [];
      try {
        const joins = await supabaseFetch<TourGuideJoin[]>(
          `/tour_guides?tour_id=eq.${tourId}&select=guide_id,guides(id,nombre,idiomas,especialidad,experiencia)`
        );

        guias = joins.map((j) => ({
          id: j.guides.id,
          nombre: j.guides.nombre,
          idiomas: j.guides.idiomas,
          especialidad: j.guides.especialidad,
          experiencia: j.guides.experiencia,
        }));
      } catch {
        // Si Supabase falla, continuamos sin guías (la KB tiene prioridad)
        guias = [];
      }

      // 3) Trae horarios desde la tabla tour_schedules (si existe)
      let schedules: { dia: number; hora: string }[] = [];
      try {
        const rows = await supabaseFetch<{ dia: number; hora: string }[]>(
          `/tour_schedules?tour_id=eq.${tourId}&select=dia,hora`
        );

        schedules = (rows || []).map((r) => ({ dia: Number(r.dia), hora: String(r.hora) }));
      } catch {
        schedules = [];
      }

      return {
        encontrado: true,
        tour: {
          id: tour.id,
          nombre: tour.nombre,
          horarios: tour.horarios,
          dias: tour.dias,
          schedule: schedules,
          maxPersonas: tour.maxPersonas,
          precio: tour.precio,
        },
        guias,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        encontrado: false,
        tour: undefined,
        guias: [],
        error: `Error al obtener detalles del tour: ${message}`,
      };
    }
  },
});
