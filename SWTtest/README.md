# SWT Asistente (Sevilla Walking Tours)

## ¿Qué hace este proyecto?

Este proyecto es un **Agente de IA transaccional** construido con **Botpress Agent Development Kit (ADK)** para Sevilla Walking Tours.

No es solo un bot de preguntas y respuestas; es un agente que **actúa**:

- Consulta datos reales en base de datos.
- Verifica plazas disponibles en tours.
- Registra reservas de clientes.
- Comparte ubicación de guías en tiempo real para clientes que llegan tarde.

## Estructura del proyecto

El sistema sigue una arquitectura modular donde cada carpeta tiene una responsabilidad clara:

### `src/conversations/` (la personalidad)

En `index.ts` se definen las instrucciones del agente:

- tono y comportamiento,
- reglas operativas,
- cuándo usar herramientas.

### `src/knowledge/` (el cerebro estático)

Contiene documentación en Markdown, por ejemplo:

- `tours-overview.md`
- `schedules.md`
- `faq.md`

El agente usa estos archivos para responder preguntas frecuentes sin necesidad de consultar la base de datos.

### `src/tools/` (las manos del agente)

Funciones TypeScript que el modelo puede ejecutar para operar con datos reales.

Ejemplos:

- `checkAvailability.ts`: revisa disponibilidad.
- `createReservation.ts`: crea reservas.
- `getGuideLocation.ts`: obtiene ubicación del guía.

### `src/lib/supabaseClient.ts` y `supabase_schema.sql` (persistencia)

Conectan el agente con Supabase y definen el esquema de datos (guías, tours, reservas, etc.).

### `.claude/` y `.opencode/` (entorno de desarrollo)

Configuraciones y utilidades para evaluación, debugging y soporte de desarrollo asistido.

## Flujo interno (ejemplo real)

Caso: *"Hola, somos 3 personas y queremos hacer el tour del Alcázar mañana a las 10:00. ¿Queda sitio?"*

1. **Recepción y contexto**
   - El mensaje entra por `src/conversations/index.ts`.
   - El agente aplica instrucciones y reglas del sistema.

2. **Búsqueda de conocimiento**
   - Consulta `src/knowledge/schedules.md` para validar horarios.

3. **Decisión de herramienta**
   - Detecta que necesita dato en tiempo real y llama a `checkAvailability.ts`.

4. **Consulta de datos**
   - `checkAvailability.ts` consulta Supabase usando `src/lib/supabaseClient.ts`.

5. **Respuesta**
   - El agente responde con disponibilidad real y propone continuar la reserva.

6. **Acción final**
   - Con confirmación del usuario, ejecuta `createReservation.ts` y guarda los datos.

## Cómo levantar el proyecto

### 1) Preparar base de datos

- Crea un proyecto en Supabase.
- Ejecuta `supabase_schema.sql` para crear tablas.

### 2) Configurar entorno local

- Descarga/clona el repositorio.
- Crea el archivo `.env` o `.env.local` con tus credenciales.
- Instala dependencias:

```bash
npm install
```

### 3) Ejecutar en desarrollo

```bash
npm run dev
```

### 4) Build

```bash
npm run build
```

### 5) Deploy

```bash
npm run deploy
```

Esto empaqueta y despliega el agente para integrarlo con webchat u otros canales soportados.
