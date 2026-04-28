import { Autonomous, z } from "@botpress/runtime";
import { supabaseFetch } from "../lib/supabaseClient";

interface LocationRow {
  id: number;
  guide_name: string;
  location_url: string;
  fecha: string;
  active: boolean;
  updated_at: string;
  tours: {
    id: number;
    nombre: string;
  };
}

/**
 * Tool ADK: obtiene el enlace de ubicación en tiempo real del guía
 * para un tour concreto en una fecha específica.
 *
 * Diseñado para cuando un cliente llega tarde y necesita localizar al grupo.
 */
export default new Autonomous.Tool({
  name: "getGuideLocation",
  description:
    "Obtiene el enlace de ubicación en tiempo real del guía para un tour específico. Usa esta herramienta cuando un cliente indica que llega tarde o que no encuentra al grupo, para enviarle el enlace de ubicación del guía.",
  input: z.object({
    tourId: z.number().describe("ID del tour al que el cliente llega tarde."),
    fecha: z
      .string()
      .describe("Fecha del tour en formato YYYY-MM-DD (ej: 2026-05-15)."),
  }),
  output: z.object({
    encontrado: z.boolean(),
    guideName: z.string().optional(),
    locationUrl: z.string().optional(),
    tourNombre: z.string().optional(),
    fecha: z.string().optional(),
    updatedAt: z.string().optional(),
    mensaje: z.string(),
  }),
  handler: async ({ tourId, fecha }) => {
    try {
      // Busca el enlace activo para este tour y fecha, con join al nombre del tour.
      const rows = await supabaseFetch<LocationRow[]>(
        `/guide_live_locations?tour_id=eq.${tourId}&fecha=eq.${fecha}&active=eq.true&select=id,guide_name,location_url,fecha,active,updated_at,tours(id,nombre)&order=updated_at.desc&limit=1`
      );

      if (rows.length === 0) {
        return {
          encontrado: false,
          mensaje:
            "No hay un enlace de ubicación disponible para este tour en esta fecha. El guía aún no ha compartido su ubicación. Te recomiendo seguir la ruta: Plaza Nueva → Plaza de San Francisco → Plaza del Salvador, o revisar tus emails para usar los tickets directamente.",
        };
      }

      const loc = rows[0]!;

      return {
        encontrado: true,
        guideName: loc.guide_name,
        locationUrl: loc.location_url,
        tourNombre: loc.tours.nombre,
        fecha: loc.fecha,
        updatedAt: loc.updated_at,
        mensaje: `📍 La guía ${loc.guide_name} ha compartido su ubicación para el tour "${loc.tours.nombre}" del ${loc.fecha}. Puedes seguir su ubicación en tiempo real aquí: ${loc.location_url}`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        encontrado: false,
        mensaje: `Error al buscar la ubicación del guía: ${message}`,
      };
    }
  },
});
