import { Autonomous, z } from "@botpress/runtime";
import { supabaseFetch } from "../lib/supabaseClient";

interface ExistingLocation {
  id: number;
  location_url: string;
  guide_name: string;
  active: boolean;
}

/**
 * Tool ADK: permite a un guía compartir su enlace de ubicación en tiempo real
 * para un tour específico en una fecha concreta.
 *
 * Si ya existe un enlace para ese tour y fecha, se actualiza con el nuevo.
 */
export default new Autonomous.Tool({
  name: "setGuideLocation",
  description:
    "Permite que un guía comparta su enlace de ubicación en tiempo real (Google Maps, WhatsApp Location, etc.) para un tour específico en una fecha concreta. Si ya hay un enlace previo para ese tour y fecha, se reemplaza con el nuevo. Usa esta herramienta cuando un guía quiera compartir dónde se encuentra.",
  input: z.object({
    tourId: z.number().describe("ID del tour para el que el guía comparte su ubicación."),
    guideName: z
      .string()
      .describe("Nombre del guía que comparte la ubicación (ej: Marina, Mercedes, Concepción)."),
    locationUrl: z
      .string()
      .describe(
        "Enlace de ubicación en tiempo real (URL de Google Maps, WhatsApp Location, o cualquier enlace válido)."
      ),
    fecha: z
      .string()
      .describe("Fecha del tour en formato YYYY-MM-DD (ej: 2026-05-15)."),
  }),
  output: z.object({
    exito: z.boolean(),
    mensaje: z.string(),
  }),
  handler: async ({ tourId, guideName, locationUrl, fecha }) => {
    try {
      // 1) Verificar si ya existe un enlace para este tour y fecha.
      const existing = await supabaseFetch<ExistingLocation[]>(
        `/guide_live_locations?tour_id=eq.${tourId}&fecha=eq.${fecha}&select=id,location_url,guide_name,active`
      );

      if (existing.length > 0) {
        // Actualiza el registro existente con la nueva ubicación.
        const record = existing[0]!;
        await supabaseFetch(
          `/guide_live_locations?id=eq.${record.id}`,
          {
            method: "PATCH",
            body: {
              guide_name: guideName,
              location_url: locationUrl,
              active: true,
              updated_at: new Date().toISOString(),
            },
          }
        );

        return {
          exito: true,
          mensaje: `✅ Enlace de ubicación actualizado correctamente. La guía ${guideName} ha compartido su ubicación para el tour del ${fecha}. Los clientes que lleguen tarde podrán recibir este enlace.`,
        };
      }

      // 2) Si no existe, crea un nuevo registro.
      await supabaseFetch("/guide_live_locations", {
        method: "POST",
        body: {
          tour_id: tourId,
          guide_name: guideName,
          location_url: locationUrl,
          fecha,
          active: true,
        },
      });

      return {
        exito: true,
        mensaje: `✅ Enlace de ubicación registrado correctamente. La guía ${guideName} ha compartido su ubicación para el tour del ${fecha}. Los clientes que lleguen tarde podrán recibir este enlace.`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        exito: false,
        mensaje: `Error al guardar la ubicación del guía: ${message}`,
      };
    }
  },
});
