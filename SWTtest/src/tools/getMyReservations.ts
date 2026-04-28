import { Autonomous, z } from "@botpress/runtime";
import { supabaseFetch } from "../lib/supabaseClient";

interface ReservationRow {
  id: number;
  fecha: string;
  num_personas: number;
  precio_total: number;
  estado: string;
  notas: string | null;
  created_at: string;
  tours: {
    id: number;
    nombre: string;
    ubicacion: string;
  };
  guides: {
    id: number;
    nombre: string;
  } | null;
}

// Tool ADK: consulta reservas del cliente por email.
// Devuelve estructura simplificada para que el asistente la muestre directamente.
export default new Autonomous.Tool({
  name: "getMyReservations",
  description:
    "Busca las reservas existentes de un cliente usando su email. Usa esta herramienta cuando el usuario quiera ver sus reservas anteriores o comprobar el estado de una reserva.",
  input: z.object({
    email: z.string().describe("Email del cliente para buscar sus reservas."),
  }),
  output: z.object({
    encontradas: z.number(),
    reservations: z.array(
      z.object({
        id: z.number(),
        tourNombre: z.string(),
        tourUbicacion: z.string(),
        guiaNombre: z.string(),
        fecha: z.string(),
        hora: z.string().optional(),
        numPersonas: z.number(),
        precioTotal: z.number(),
        estado: z.string(),
        notas: z.string(),
      })
    ),
    error: z.string().optional(),
  }),
  handler: async ({ email }) => {
    try {
      // Consulta reservas e incluye joins de tour y guía para respuesta completa.
      const rows = await supabaseFetch<ReservationRow[]>(
        `/reservations?email_cliente=eq.${encodeURIComponent(email)}&select=id,fecha,hora,num_personas,precio_total,estado,notas,created_at,tours(id,nombre,ubicacion),guides(id,nombre)&order=fecha.desc`
      );

      return {
        encontradas: rows.length,
        // Mapea columnas DB a un formato estable y legible para el agente.
        reservations: rows.map((r) => ({
          id: r.id,
          tourNombre: r.tours.nombre,
          tourUbicacion: r.tours.ubicacion,
          guiaNombre: r.guides?.nombre ?? "Sin guía asignado",
          fecha: r.fecha,
          hora: (r as any).hora ?? null,
          numPersonas: r.num_personas,
          precioTotal: r.precio_total,
          estado: r.estado,
          notas: r.notas ?? "",
        })),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        encontradas: 0,
        reservations: [],
        error: `Error al buscar reservas: ${message}`,
      };
    }
  },
});
