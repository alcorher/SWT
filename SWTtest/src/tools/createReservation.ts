import { Autonomous, z } from "@botpress/runtime";
import { supabaseFetch } from "../lib/supabaseClient";

interface Reservation {
  id: number;
  num_personas: number;
}

interface TourSchedule {
  tourId: number;
  dia: number;
  hora: string;
}

// Tours de la Knowledge Base con información de precios y capacidad
const TOURS_KB = [
  { id: 1, nombre: "Sevilla City Intro Tour", maxPersonas: 12, precio: 25 },
  { id: 2, nombre: "Cathedral Tour (sin tickets)", maxPersonas: 12, precio: 30 },
  { id: 3, nombre: "Cathedral Tour (tickets incluidos)", maxPersonas: 12, precio: 45 },
  { id: 4, nombre: "Alcázar Tour (sin tickets)", maxPersonas: 12, precio: 30 },
  { id: 5, nombre: "Alcázar Tour (tickets incluidos)", maxPersonas: 12, precio: 45 },
  { id: 6, nombre: "Cathedral, Alcázar and Santa Cruz Quarter", maxPersonas: 12, precio: 55 },
  { id: 7, nombre: "City Intro Tour + 1 Monument", maxPersonas: 12, precio: 40 },
  { id: 8, nombre: "City Intro, Cathedral and Alcázar", maxPersonas: 12, precio: 50 },
  { id: 9, nombre: "City Intro, Cathedral, Alcázar and Santa Cruz", maxPersonas: 12, precio: 60 },
  { id: 10, nombre: "Triana to Plaza de España", maxPersonas: 12, precio: 30 },
  { id: 11, nombre: "Tapas Tour Off the Beaten Path", maxPersonas: 12, precio: 35 },
  { id: 12, nombre: "Family Tour", maxPersonas: 12, precio: 40 },
  { id: 13, nombre: "Day Trip to Ronda", maxPersonas: 8, precio: 80 },
  { id: 14, nombre: "Day Trip to Cádiz and Jerez", maxPersonas: 8, precio: 85 },
  { id: 15, nombre: "Private Custom Tour", maxPersonas: 12, precio: 0 },
];

const TOUR_SCHEDULES: TourSchedule[] = [
  { tourId: 1, dia: 1, hora: "10:30" },
  { tourId: 1, dia: 2, hora: "10:30" },
  { tourId: 1, dia: 3, hora: "10:30" },
  { tourId: 1, dia: 4, hora: "10:30" },
  { tourId: 1, dia: 5, hora: "10:30" },
  { tourId: 1, dia: 6, hora: "10:30" },

  // Cathedral (Lun/Mie/Vie) 12:45 y 13:15 según mes — ambas opciones registradas
  { tourId: 2, dia: 1, hora: "12:45" },
  { tourId: 2, dia: 3, hora: "12:45" },
  { tourId: 2, dia: 5, hora: "12:45" },
  { tourId: 2, dia: 1, hora: "13:15" },
  { tourId: 2, dia: 3, hora: "13:15" },
  { tourId: 2, dia: 5, hora: "13:15" },
  { tourId: 3, dia: 1, hora: "12:45" },
  { tourId: 3, dia: 3, hora: "12:45" },
  { tourId: 3, dia: 5, hora: "12:45" },
  { tourId: 3, dia: 1, hora: "13:15" },
  { tourId: 3, dia: 3, hora: "13:15" },
  { tourId: 3, dia: 5, hora: "13:15" },

  // Alcázar: opciones según temporada (insertamos las opciones conocidas)
  { tourId: 4, dia: 2, hora: "13:15" },
  { tourId: 4, dia: 4, hora: "13:15" },
  { tourId: 4, dia: 6, hora: "13:15" },
  { tourId: 4, dia: 2, hora: "12:45" },
  { tourId: 4, dia: 4, hora: "12:45" },
  { tourId: 4, dia: 6, hora: "12:45" },
  { tourId: 4, dia: 1, hora: "15:15" },
  { tourId: 4, dia: 3, hora: "15:15" },
  { tourId: 4, dia: 5, hora: "15:15" },
  { tourId: 5, dia: 2, hora: "13:15" },
  { tourId: 5, dia: 4, hora: "13:15" },
  { tourId: 5, dia: 6, hora: "13:15" },
  { tourId: 5, dia: 2, hora: "12:45" },
  { tourId: 5, dia: 4, hora: "12:45" },
  { tourId: 5, dia: 6, hora: "12:45" },
  { tourId: 5, dia: 1, hora: "15:15" },
  { tourId: 5, dia: 3, hora: "15:15" },
  { tourId: 5, dia: 5, hora: "15:15" },

  { tourId: 6, dia: 2, hora: "09:30" },
  { tourId: 6, dia: 4, hora: "09:30" },
  { tourId: 6, dia: 6, hora: "09:30" },
  { tourId: 7, dia: 2, hora: "11:00" },
  { tourId: 7, dia: 5, hora: "11:00" },
  { tourId: 8, dia: 2, hora: "10:30" },
  { tourId: 8, dia: 4, hora: "10:30" },
  { tourId: 9, dia: 3, hora: "09:00" },
  { tourId: 9, dia: 6, hora: "09:00" },
  { tourId: 10, dia: 6, hora: "08:00" },

  // Tour 11 (Tapas): horario bajo petición — no forzamos hora automática aquí

  { tourId: 12, dia: 7, hora: "11:00" },
  { tourId: 12, dia: 1, hora: "11:00" },
  { tourId: 13, dia: 6, hora: "08:00" },
  { tourId: 14, dia: 6, hora: "09:00" },
  { tourId: 15, dia: 2, hora: "09:00" },
  { tourId: 15, dia: 3, hora: "09:00" },
  { tourId: 15, dia: 4, hora: "09:00" },
];

function getIsoDay(fecha: string): number {
  const jsDay = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

function pickAutoHora(tourId: number, fecha: string): string | null {
  const isoDay = getIsoDay(fecha);
  const options = TOUR_SCHEDULES
    .filter((schedule) => schedule.tourId === tourId && schedule.dia === isoDay)
    .map((schedule) => schedule.hora)
    .sort();

  return options[0] ?? null;
}

interface InsertedReservation {
  id: number;
  tour_id: number;
  guide_id: number | null;
  fecha: string;
  hora: string | null;
  num_personas: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string | null;
  precio_total: number;
  estado: string;
}

// Tool ADK: crea reservas confirmadas en Supabase.
// Información del tour viene de la Knowledge Base, validación de cupos contra Supabase
export default new Autonomous.Tool({
  name: "createReservation",
  description:
    "Crea una nueva reserva para un tour turístico. SIEMPRE verifica la disponibilidad con checkAvailability ANTES de usar esta herramienta. Necesitas los datos completos del cliente (nombre, email) y los detalles de la reserva.",
  input: z.object({
    tourId: z.number().describe("ID del tour a reservar."),
    guideId: z.number().optional().describe("ID del guía preferido (opcional)."),
    fecha: z.string().describe("Fecha de la reserva en formato YYYY-MM-DD."),
    numPersonas: z
      .number()
      .min(1)
      .describe("Número de personas para la reserva (mínimo 1)."),
    nombreCliente: z.string().describe("Nombre completo del cliente."),
    emailCliente: z.string().describe("Email de contacto del cliente."),
    telefonoCliente: z
      .string()
      .optional()
      .describe("Teléfono de contacto del cliente (opcional)."),
    notas: z
      .string()
      .optional()
      .describe("Notas adicionales del cliente, como alergias, necesidades especiales, etc."),
  }),
  output: z.object({
    exito: z.boolean(),
    reservationId: z.number().optional(),
    precioTotal: z.number().optional(),
    resumen: z.string(),
  }),
  handler: async ({
    tourId,
    guideId,
    fecha,
    numPersonas,
    nombreCliente,
    emailCliente,
    telefonoCliente,
    notas,
  }) => {
    try {
      // 1) Obtiene información del tour desde Knowledge Base para calcular precio y capacidad
      const tourKB = TOURS_KB.find((t) => t.id === tourId);

      if (!tourKB) {
        return {
          exito: false,
          resumen: `Error: No se encontró el tour con ID ${tourId}`,
        };
      }

      const hora = pickAutoHora(tourId, fecha);

      if (!hora) {
        return {
          exito: false,
          resumen: `❌ No hay horario disponible para "${tourKB.nombre}" el ${fecha}.`,
        };
      }

      // 2) Revalida disponibilidad justo antes de insertar contra Supabase.
      // Esto protege contra cambios concurrentes entre pasos del chat.
      let existing: Reservation[] = [];
      try {
        existing = await supabaseFetch<Reservation[]>(
          `/reservations?tour_id=eq.${tourId}&fecha=eq.${fecha}&estado=eq.confirmada&select=id,num_personas`
        );
      } catch {
        // Si Supabase falla, continuamos (mejor que fallar completamente)
        existing = [];
      }

      const plazasOcupadas = existing.reduce(
        (sum, r) => sum + r.num_personas,
        0
      );
      const plazasLibres = tourKB.maxPersonas - plazasOcupadas;

      if (numPersonas > plazasLibres) {
        return {
          exito: false,
          resumen: `❌ No hay suficientes plazas. Se solicitaron ${numPersonas} pero solo quedan ${plazasLibres} disponibles para "${tourKB.nombre}" el ${fecha}.`,
        };
      }


      // 3) Calcula precio total
      const precioTotal = tourKB.precio * numPersonas;

      // 4) Inserta la reserva en Supabase
      let insertedData: InsertedReservation[];
      try {
        insertedData = await supabaseFetch<InsertedReservation[]>(
          "/reservations",
          {
            method: "POST",
            body: {
              tour_id: tourId,
              guide_id: guideId || null,
              fecha,
              hora,
              num_personas: numPersonas,
              nombre_cliente: nombreCliente,
              email_cliente: emailCliente,
              telefono_cliente: telefonoCliente || null,
              precio_total: precioTotal,
              estado: "confirmada",
              notas: notas || null,
            },
          }
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          exito: false,
          resumen: `❌ Error al crear la reserva: ${message}`,
        };
      }

      if (!insertedData || insertedData.length === 0) {
        return {
          exito: false,
          resumen: "❌ Error: No se pudo crear la reserva en la base de datos.",
        };
      }

      const reservationId = insertedData[0]!.id;

      return {
        exito: true,
        reservationId,
        precioTotal,
        resumen: `✅ Reserva creada exitosamente!\n\n📋 **Detalles:**\n- **ID Reserva:** ${reservationId}\n- **Tour:** ${tourKB.nombre}\n- **Fecha:** ${fecha}\n- **Hora asignada automáticamente:** ${hora}\n- **Personas:** ${numPersonas}\n- **Precio Total:** €${precioTotal.toFixed(2)}\n- **Cliente:** ${nombreCliente}\n- **Email:** ${emailCliente}\n\n💌 Se ha enviado una confirmación por email. Recibirá los tickets en un email separado.\n\n📞 Si tiene preguntas, puede contactar a +34 616 501100`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        exito: false,
        resumen: `❌ Error inesperado al crear la reserva: ${message}`,
      };
    }
  },
});
