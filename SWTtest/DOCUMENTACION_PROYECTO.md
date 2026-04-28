# Documentacion del Proyecto - SWT Asistente

## 1) Descripcion general

Este proyecto implementa un agente conversacional con **Botpress ADK** para **Sevilla Walking Tours**.
El asistente responde en espanol y cubre dos objetivos principales:

- Atencion al cliente (horarios, puntos de encuentro, guias, reservas, protocolo de retrasos).
- Operaciones transaccionales (consultar disponibilidad, crear reservas, consultar reservas y compartir ubicacion de guias).

El comportamiento del agente combina:

- **Conocimiento estatico** en archivos Markdown.
- **Herramientas** que leen/escriben datos reales.
- **Instrucciones conversacionales** con reglas operativas estrictas.

---

## 2) Stack tecnico

- Runtime: `@botpress/runtime`
- Lenguaje: `TypeScript`
- Modulo: `ESM` (`"type": "module"`)
- Integracion activa: `webchat@0.3.0`
- Scripts principales:
  - `npm run dev` -> `adk dev`
  - `npm run build` -> `adk build`
  - `npm run deploy` -> `adk deploy`

---

## 3) Estructura del proyecto

### Configuracion base

- `agent.config.ts`: define nombre, descripcion, estado del bot/usuario e integraciones.
- `agent.json` y `agent.local.json`: configuraciones del agente para entorno.

### Logica conversacional

- `src/conversations/index.ts`: punto central de la conversacion.
  - Define el rol y reglas del asistente.
  - Registra herramientas disponibles para tool calling.
  - Conecta la base de conocimiento (`SevillaKB`).

### Herramientas (tool calling)

En `src/tools/`:

- `listTours.ts`: lista tours disponibles.
- `getTourDetails.ts`: obtiene detalle de un tour.
- `checkAvailability.ts`: verifica plazas antes de reservar.
- `createReservation.ts`: crea una reserva.
- `getMyReservations.ts`: consulta reservas por email.
- `setGuideLocation.ts`: guarda ubicacion compartida por guias.
- `getGuideLocation.ts`: recupera ubicacion en tiempo real para clientes.

### Conocimiento estatico

En `src/knowledge/`:

- `tours-overview.md`
- `schedules.md`
- `faq.md`
- `booking-guide.md`
- `contact-info.md`
- `index.ts` (registro de la base de conocimiento en el runtime)

### Persistencia e integraciones de datos

- `src/lib/supabaseClient.ts`: cliente de acceso a Supabase.
- `supabase_schema.sql`: esquema de base de datos (tablas y estructura).
- `src/tables/`: definiciones de tablas del agente.

### Otras capas

- `src/actions/`: logica de negocio reutilizable.
- `src/workflows/`: procesos de larga duracion.
- `src/triggers/`: eventos y disparadores.

---

## 4) Flujo funcional principal

1. El usuario envia un mensaje al canal (`*`).
2. El handler de `src/conversations/index.ts` carga contexto e instrucciones.
3. El modelo responde usando:
   - Base de conocimiento para preguntas informativas.
   - Herramientas para operaciones con datos reales.
4. En reservas, el flujo esperado es:
   - `checkAvailability` (obligatorio antes de reservar).
   - Confirmacion de datos con el usuario.
   - `createReservation`.
5. Si el cliente llega tarde:
   - Se intenta `getGuideLocation` primero.
   - Si no hay enlace, se aplica protocolo de seguimiento (segun knowledge).

---

## 5) Reglas de negocio destacadas

- No inventar informacion fuera de knowledge o resultados de herramientas.
- Verificar disponibilidad antes de crear una reserva.
- Usar siempre espanol en la conversacion.
- Derivar reservas a `sevillawalkingtours.com` cuando corresponda.
- Aplicar protocolo de retrasos con prioridad a ubicacion en tiempo real.

---

## 6) Estado y datos de usuario

En `agent.config.ts`, el estado de usuario incluye:

- `userName` (opcional)
- `email` (opcional)

Se usa para personalizar la conversacion y facilitar flujos como consulta de reservas.

---

## 7) Variables de entorno esperadas

Existe un `.env.local` en la raiz del proyecto. Normalmente debe contener credenciales y configuracion de servicios (por ejemplo, Supabase).

Recomendaciones:

- No commitear secretos.
- Mantener llaves separadas por entorno (local/dev/prod).

---

## 8) Ejecucion local

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar entorno de desarrollo:

```bash
npm run dev
```

3. Validar/build:

```bash
npm run build
```

4. Desplegar:

```bash
npm run deploy
```

---

## 9) Siguientes mejoras sugeridas

- Añadir una seccion de arquitectura de datos (tablas y relaciones principales).
- Documentar ejemplos de payload/response por herramienta en `src/tools/`.
- Incluir pruebas de regresion para flujos criticos:
  - Reserva completa.
  - Cliente que llega tarde con/sin ubicacion activa.
  - Consulta de reservas por email.

