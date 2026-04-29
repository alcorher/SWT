/**
 * Helper de acceso a Supabase (PostgREST) para todo el bot.
 *
 * Centraliza la autenticación, serialización de body y validación de errores
 * para que los tools no repitan lógica HTTP.
 *
 * Las credenciales se leen de variables de entorno (.env.local)
 * para no exponer secretos en el código fuente.
 */
import { secrets } from "@botpress/runtime";


const SUPABASE_URL = secrets.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = secrets.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_KEY. " +
      "Asegúrate de configurarlas en .env.local"
  );
}

interface SupabaseFetchOptions {
  /** Método HTTP de la llamada */
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Payload opcional que se envía como JSON */
  body?: unknown;
  /** Headers extra para casos específicos */
  headers?: Record<string, string>;
  /** Si es true, PostgREST responde un objeto en vez de arreglo */
  single?: boolean;
}

/**
 * Ejecuta una petición REST contra Supabase y devuelve el JSON tipado.
 */
export async function supabaseFetch<T = unknown>(
  path: string,
  options: SupabaseFetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, single = false } = options;

  // Construye endpoint absoluto a partir de la ruta relativa del recurso.
  const url = `${SUPABASE_URL}/rest/v1${path}`;

  // Headers base requeridos por Supabase.
  const fetchHeaders: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...headers,
  };

  // Pide respuesta como objeto para consultas de una sola fila.
  if (single) {
    fetchHeaders["Accept"] = "application/vnd.pgrst.object+json";
  }

  // En inserciones, pide que retorne el registro creado.
  if (method === "POST") {
    fetchHeaders["Prefer"] = "return=representation";
  }

  // Envía body solo cuando existe para no forzar payload vacío.
  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Propaga errores HTTP con detalle para depuración de tools.
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Supabase error [${response.status}]: ${errorText}`
    );
  }

  // Devuelve JSON parseado y tipado según T.
  return response.json() as Promise<T>;
}
