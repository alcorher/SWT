# Horarios oficiales (extraídos de sevillawalkingtours.com)

Esta nota recoge los horarios publicados en la web para que el bot pueda
asignar horas reales cuando cree reservas.

## Convención de días
- 1 = Lunes
- 2 = Martes
- 3 = Miércoles
- 4 = Jueves
- 5 = Viernes
- 6 = Sábado
- 7 = Domingo

## Horarios por tour (resumen y texto oficial)

- Sevilla City Intro (tour 1): Lunes a Sábado a las 10:30. En Julio y Agosto la
	salida es a las 10:00.
- Cathedral Tour (sin/tickets incluidos, tours 2 y 3): Lunes, Miércoles y
	Viernes (excepto festivos) a las 12:45 o 13:15 según el mes. Duración aprox.
	70 minutos. (La web indica comprar la entrada para 12:45 o 13:15 según la
	salida reservada.)
- Alcázar Tour (tickets incluidos / no incluidos, tours 4 y 5):
	- Martes, Jueves y Sábado: salida principal 13:15 (en verano pueden salir a
		las 12:45).
	- Lunes, Miércoles y Viernes (primavera/otoño): puede estar disponible la
		salida de 15:15.
	(La web explica variaciones estacionales; las entradas deben comprarse a la
	hora correspondiente: 13:00 para 13:15, 15:00 para 15:15, etc.)
- Cathedral, Alcázar and Santa Cruz Quarter (tour 6): consultar página del
	tour para horarios concretos (combinados, variable).
- City Intro + 1 Monument / combinados (tours 7-9): consultar página del
	tour; algunos combinados usan la salida de 10:30 o 11:00 según el paquete.
- Triana to Plaza de España (tour 10): suele salir los sábados a las 08:00.
- Tapas Tour Off the Beaten Path (tour 11): horario bajo petición / formulario
	(la página ofrece contacto y selección de hora en el formulario, no un
	horario recurrente fijo en la web pública).
- Family Tour (tour 12): consultar la página del tour para días concretos
	(la web documenta salidas de fin de semana y mañanas).
- Day Trip to Ronda (tour 13): excursión de día completo, duración 9 horas,
	salida a las 08:00.
- Day Trip to Cádiz y Jerez (tour 14): excursión de día completo, salida a las
	09:00 (según la página del tour).
- Private Custom Tour (tour 15): horarios flexibles (mañanas, bajo petición).

## Regla para el bot

Al crear una reserva el bot debe:
- identificar el tour y buscar horarios en `tour_schedules` (DB) si existen;
- si no hay rows en DB, usar el texto de la Knowledge Base (`schedules.md` /
	página del tour) para decidir la hora; si el texto indica múltiples horas
	para un día, elegir la primera disponible para ese día;
- si no hay horarios recurrentes (ej. tours bajo petición), pedir al cliente
	que indique la hora preferida.

Si necesitas que convierta estas reglas en lógica automática dentro de
`src/tools/createReservation.ts`, dímelo y lo actualizo.