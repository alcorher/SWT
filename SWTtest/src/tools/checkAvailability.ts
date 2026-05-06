import { Autonomous, z } from "@botpress/runtime";
import { supabaseFetch } from "../lib/supabaseClient";  

interface Reservation {
  id: number;
  num_personas: number;
}

// Tours de la Knowledge Base con capacidades máximas
const TOURS_KB = [
  { id: 1, nombre: "Sevilla City Intro Tour", maxPersonas: 12 },
  { id: 2, nombre: "Cathedral Tour (sin tickets)", maxPersonas: 12 },
  { id: 3, nombre: "Cathedral Tour (tickets incluidos)", maxPersonas: 12 },
  { id: 4, nombre: "Alcázar Tour (sin tickets)", maxPersonas: 12 },
  { id: 5, nombre: "Alcázar Tour (tickets incluidos)", maxPersonas: 12 },
  { id: 6, nombre: "Cathedral, Alcázar and Santa Cruz Quarter", maxPersonas: 12 },
  { id: 7, nombre: "City Intro Tour + 1 Monument", maxPersonas: 12 },
  { id: 8, nombre: "City Intro, Cathedral and Alcázar", maxPersonas: 12 },
  { id: 9, nombre: "City Intro, Cathedral, Alcázar and Santa Cruz", maxPersonas: 12 },
  { id: 10, nombre: "Triana to Plaza de España", maxPersonas: 12 },
  { id: 11, nombre: "Tapas Tour Off the Beaten Path", maxPersonas: 12 },
  { id: 12, nombre: "Family Tour", maxPersonas: 12 },
  { id: 13, nombre: "Day Trip to Ronda", maxPersonas: 8 },
  { id: 14, nombre: "Day Trip to Cádiz and Jerez", maxPersonas: 8 },
  { id: 15, nombre: "Private Custom Tour", maxPersonas: 12 },
];

interface TourGuideJoin {
  guide_id: number;
  guides: {
    id: number;
    nombre: string;
    idiomas: string[];
    activo: boolean;
  };
}

// Tool ADK: valida disponibilidad real para una fecha dada.
// Separa capacidad (desde KB), reservas ya confirmadas (desde Supabase) y guías disponibles.
export default new Autonomous.Tool({
  name: "checkAvailability",
  description:
    "Comprueba si hay disponibilidad para un tour en una fecha concreta. Devuelve las plazas restantes y los guías disponibles. Usa esta herramienta ANTES de crear una reserva.",
  input: z.object({
    tourId: z.number().describe("ID del tour a consultar."),
    fecha: z
      .string()
      .describe("Fecha deseada en formato YYYY-MM-DD (por ejemplo 2026-05-15)."),
  }),
  output: z.object({
    disponible: z.boolean(),
    plazasMaximas: z.number(),
    plazasReservadas: z.number(),
    plazasRestantes: z.number(),
    hayTourEseDia: z.boolean(),
    guiasDisponibles: z.array(
      z.object({
        id: z.number(),
        nombre: z.string(),
        idiomas: z.array(z.string()),
      })
    ),
    mensaje: z.string(),
  }),
  handler: async ({ tourId, fecha }) => {
    try {
      // 1) Obtiene capacidad máxima del tour desde Knowledge Base
      const tourKB = TOURS_KB.find((t) => t.id === tourId);

      if (!tourKB) {
        return {
          disponible: false,
          plazasMaximas: 0,
          plazasReservadas: 0,
          plazasRestantes: 0,
          hayTourEseDia: false,
          guiasDisponibles: [],
          mensaje: `No se encontró el tour con ID ${tourId}`,
        };
      }

      // 2) Suma personas ya reservadas en esa fecha (solo estado confirmada) desde Supabase
      let plazasReservadas = 0;
      try {
        const reservations = await supabaseFetch<Reservation[]>(
          `/reservations?tour_id=eq.${tourId}&fecha=eq.${fecha}&estado=eq.confirmada&select=id,num_personas`
        );

        plazasReservadas = reservations.reduce(
          (sum, r) => sum + r.num_personas,
          0
        );
      } catch {
        // Si Supabase falla, asumimos 0 reservas
        plazasReservadas = 0;
      }

      const plazasRestantes = tourKB.maxPersonas - plazasReservadas;
      const hayTourEseDia = true; // Fixed: A tour can be scheduled even if there are 0 reservations.

      // 3) Obtiene guías disponibles vinculados al tour por tabla puente (desde Supabase)
      let guiasDisponibles = [];
      try {
        const joins = await supabaseFetch<TourGuideJoin[]>(
          `/tour_guides?tour_id=eq.${tourId}&select=guide_id,guides(id,nombre,idiomas,activo)`
        );

        guiasDisponibles = joins
          .filter((j) => j.guides.activo)
          .map((j) => ({
            id: j.guides.id,
            nombre: j.guides.nombre,
            idiomas: j.guides.idiomas,
          }));
      } catch {
        // Si Supabase falla, continuamos sin guías
        guiasDisponibles = [];
      }

      // Una reserva es posible solo si quedan plazas > 0
      const disponible = plazasRestantes > 0;

      return {
        disponible,
        plazasMaximas: tourKB.maxPersonas,
        plazasReservadas,
        plazasRestantes,
        hayTourEseDia,
        guiasDisponibles,
        mensaje: disponible
          ? `✅ Disponibilidad confirmada: ${plazasRestantes} plaza(s) disponible(s) para ${tourKB.nombre} el ${fecha}`
          : `❌ No hay disponibilidad: ${tourKB.nombre} está lleno el ${fecha}`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        disponible: false,
        plazasMaximas: 0,
        plazasReservadas: 0,
        plazasRestantes: 0,
        hayTourEseDia: false,
        guiasDisponibles: [],
        mensaje: `Error al verificar disponibilidad: ${message}`,
      };
    }
  },
});
