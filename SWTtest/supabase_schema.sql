-- ============================================================================
-- SEVILLA WALKING TOURS - Esquema de Base de Datos Supabase
-- ============================================================================
-- Este esquema almacena datos transaccionales: reservas, guías y ubicaciones.
-- La información de tours (nombres, horarios, precios, descripciones) viene de
-- la Knowledge Base, no de esta base de datos.
-- ============================================================================

-- Tabla: guides (Guías disponibles)
-- Almacena información de los guías turísticos.
CREATE TABLE IF NOT EXISTS guides (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  idiomas TEXT[] DEFAULT ARRAY['Spanish', 'English'],
  especialidad TEXT DEFAULT 'General tours',
  experiencia INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: tours (Referencia de tours para FK)
-- Nota: Los datos principales de tours (nombre, descripción, horarios, precios)
-- vienen de la Knowledge Base. Esta tabla solo sirve como referencia FK.
CREATE TABLE IF NOT EXISTS tours (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  ubicacion TEXT DEFAULT 'Sevilla',
  descripcion TEXT,
  precio_base DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: tour_guides (Relación N:N entre tours y guías)
-- Define qué guías pueden guiar qué tours.
CREATE TABLE IF NOT EXISTS tour_guides (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  guide_id BIGINT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_tour_guide UNIQUE(tour_id, guide_id)
);

-- Tabla: reservations (Reservas de clientes)
-- Almacena todas las reservas de tours realizadas por clientes.
CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  guide_id BIGINT REFERENCES guides(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME,
  num_personas INT NOT NULL CHECK (num_personas > 0),
  nombre_cliente TEXT NOT NULL,
  email_cliente TEXT NOT NULL,
  telefono_cliente TEXT,
  precio_total DECIMAL(10, 2) NOT NULL CHECK (precio_total >= 0),
  estado TEXT DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada', 'completada', 'pendiente')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: guide_live_locations (Ubicaciones en tiempo real de guías)
-- Almacena enlaces de ubicación compartidos por guías para tours específicos.
CREATE TABLE IF NOT EXISTS guide_live_locations (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  guide_name TEXT NOT NULL,
  location_url TEXT NOT NULL,
  fecha DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: tour_schedules (Horarios por tour y día)
-- Almacena los horarios recurrentes por día de la semana para cada tour.
CREATE TABLE IF NOT EXISTS tour_schedules (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  -- dia: número ISO de día de la semana (1 = Lunes, 7 = Domingo)
  dia SMALLINT NOT NULL CHECK (dia >= 1 AND dia <= 7),
  hora TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_tour_schedule UNIQUE (tour_id, dia, hora)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email_cliente);
CREATE INDEX IF NOT EXISTS idx_reservations_tour_fecha ON reservations(tour_id, fecha);
CREATE INDEX IF NOT EXISTS idx_reservations_tour_fecha_hora ON reservations(tour_id, fecha, hora);
CREATE INDEX IF NOT EXISTS idx_reservations_estado ON reservations(estado);
CREATE INDEX IF NOT EXISTS idx_guide_live_locations_tour_fecha ON guide_live_locations(tour_id, fecha);
CREATE INDEX IF NOT EXISTS idx_guide_live_locations_active ON guide_live_locations(active);

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Insertar guías (información confirmada de la web)
INSERT INTO guides (nombre, idiomas, especialidad, experiencia, activo) VALUES
  ('Marina', ARRAY['Spanish', 'English'], 'Sevilla Walking Tours', 5, true),
  ('Mercedes', ARRAY['Spanish', 'English'], 'Sevilla Walking Tours', 7, true),
  ('Concepción', ARRAY['Spanish', 'English'], 'Sevilla Walking Tours', 6, true)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tours (id, nombre, ubicacion, descripcion) VALUES
  (1, 'Sevilla City Intro Tour', 'Plaza Nueva', 'Una introducción completa a las principales atracciones de Sevilla'),
  (2, 'Cathedral Tour (sin tickets)', 'Plaza del Triunfo', 'Visita la Catedral de Sevilla (sin tickets incluidos)'),
  (3, 'Cathedral Tour (tickets incluidos)', 'Plaza del Triunfo', 'Visita la Catedral de Sevilla con entrada incluida'),
  (4, 'Alcázar Tour (sin tickets)', 'Plaza del Triunfo', 'Visita el Alcázar de Sevilla (sin tickets incluidos)'),
  (5, 'Alcázar Tour (tickets incluidos)', 'Plaza del Triunfo', 'Visita el Alcázar de Sevilla con entrada incluida'),
  (6, 'Cathedral, Alcázar and Santa Cruz Quarter', 'Plaza del Triunfo', 'Tour completo incluyendo el barrio de Santa Cruz'),
  (7, 'City Intro Tour + 1 Monument', 'Plaza Nueva', 'Tour de introducción más acceso a un monumento'),
  (8, 'City Intro, Cathedral and Alcázar', 'Plaza Nueva', 'Combinación de tour introductorio y monumentos'),
  (9, 'City Intro, Cathedral, Alcázar and Santa Cruz', 'Plaza Nueva', 'Tour combinado completo'),
  (10, 'Triana to Plaza de España', 'Triana', 'Recorrido por Triana hasta la Plaza de España'),
  (11, 'Tapas Tour Off the Beaten Path', 'Centro', 'Tour gastronómico por tabernas locales'),
  (12, 'Family Tour', 'Plaza Nueva', 'Tour diseñado para familias con niños'),
  (13, 'Day Trip to Ronda', 'Sevilla', 'Excursión de día completo a Ronda'),
  (14, 'Day Trip to Cádiz y Jerez', 'Sevilla', 'Excursión de día completo a Cádiz y Jerez'),
  (15, 'Private Custom Tour', 'Ubicación flexible', 'Tour privado personalizado')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tour_guides (tour_id, guide_id) VALUES
  (1, 1), (1, 2), (1, 3),  -- Marina, Mercedes, Concepción para City Intro
  (2, 2), (2, 3),          -- Mercedes, Concepción para Cathedral (sin tickets)
  (3, 2), (3, 3),          -- Mercedes, Concepción para Cathedral (tickets incluidos)
  (4, 2), (4, 3),          -- Mercedes, Concepción para Alcázar (sin tickets)
  (5, 2), (5, 3),          -- Mercedes, Concepción para Alcázar (tickets incluidos)
  (6, 2), (6, 3),          -- Mercedes, Concepción para Cathedral+Alcázar+Santa Cruz
  (15, 1), (15, 2), (15, 3) -- Todos para tours privados
ON CONFLICT (tour_id, guide_id) DO NOTHING;

-- Insertar horarios de ejemplo para tours (dia: 1=Lunes ... 7=Domingo)
-- Estos horarios se pueden refinar desde la Knowledge Base o desde scrapy.
INSERT INTO tour_schedules (tour_id, dia, hora) VALUES
  -- Sevilla City Intro: Lunes a Sábado 10:30 (nota: en Julio/Agosto 10:00)
  (1, 1, '10:30'), (1, 2, '10:30'), (1, 3, '10:30'), (1, 4, '10:30'), (1, 5, '10:30'), (1, 6, '10:30'),

  -- Cathedral Tours (mon/wed/fri) 12:45 y 13:15 según mes (ambas opciones se insertan)
  (2, 1, '12:45'), (2, 3, '12:45'), (2, 5, '12:45'),
  (2, 1, '13:15'), (2, 3, '13:15'), (2, 5, '13:15'),
  (3, 1, '12:45'), (3, 3, '12:45'), (3, 5, '12:45'),
  (3, 1, '13:15'), (3, 3, '13:15'), (3, 5, '13:15'),

  -- Alcázar Tours: Tue/Thu/Sat 13:15 (12:45 en verano). Mon/Wed/Fri 15:15 en
  -- primavera/otoño (insertamos las opciones conocidas)
  (4, 2, '13:15'), (4, 4, '13:15'), (4, 6, '13:15'),
  (4, 2, '12:45'), (4, 4, '12:45'), (4, 6, '12:45'),
  (4, 1, '15:15'), (4, 3, '15:15'), (4, 5, '15:15'),
  (5, 2, '13:15'), (5, 4, '13:15'), (5, 6, '13:15'),
  (5, 2, '12:45'), (5, 4, '12:45'), (5, 6, '12:45'),
  (5, 1, '15:15'), (5, 3, '15:15'), (5, 5, '15:15'),

  -- Combined / other tours (keep previous known seeds where applicable)
  (6, 2, '09:30'), (6, 4, '09:30'), (6, 6, '09:30'),
  (7, 2, '11:00'), (7, 5, '11:00'),
  (8, 2, '10:30'), (8, 4, '10:30'),
  (9, 3, '09:00'), (9, 6, '09:00'),
  (10, 6, '08:00'),

  -- Tapas: horario bajo petición (no insertar horarios recurrentes por defecto)

  -- Family / Day trips
  (12, 7, '11:00'), (12, 1, '11:00'),
  (13, 6, '08:00'),
  (14, 6, '09:00'),
  (15, 2, '09:00'), (15, 3, '09:00'), (15, 4, '09:00')
ON CONFLICT (tour_id, dia, hora) DO NOTHING;

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para reservations
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para guide_live_locations
DROP TRIGGER IF EXISTS update_guide_live_locations_updated_at ON guide_live_locations;
CREATE TRIGGER update_guide_live_locations_updated_at
BEFORE UPDATE ON guide_live_locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para guides
DROP TRIGGER IF EXISTS update_guides_updated_at ON guides;
CREATE TRIGGER update_guides_updated_at
BEFORE UPDATE ON guides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ============================================================================

-- Habilitar RLS en tablas públicas
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_live_locations ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer guías públicas
CREATE POLICY "guides_read_all" ON guides FOR SELECT TO authenticated USING (true);

-- Política: Todos pueden leer tours
CREATE POLICY "tours_read_all" ON tours FOR SELECT TO authenticated USING (true);

-- Política: Todos pueden leer tour_guides
CREATE POLICY "tour_guides_read_all" ON tour_guides FOR SELECT TO authenticated USING (true);

-- Política: Solo el bot puede crear/actualizar/eliminar reservations
CREATE POLICY "reservations_full_access_bot" ON reservations 
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Política: Solo el bot puede crear/actualizar guide_live_locations
CREATE POLICY "guide_live_locations_bot_access" ON guide_live_locations 
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- VISTAS ÚTILES (Opcional)
-- ============================================================================

-- Vista: Reservas con detalles de tour y guía
CREATE OR REPLACE VIEW reservation_details AS
SELECT 
  r.id,
  r.tour_id,
  t.nombre as tour_nombre,
  r.hora,
  r.guide_id,
  g.nombre as guide_nombre,
  r.fecha,
  r.num_personas,
  r.nombre_cliente,
  r.email_cliente,
  r.telefono_cliente,
  r.precio_total,
  r.estado,
  r.notas,
  r.created_at,
  r.updated_at
FROM reservations r
LEFT JOIN tours t ON r.tour_id = t.id
LEFT JOIN guides g ON r.guide_id = g.id
ORDER BY r.fecha DESC;

-- Vista: Disponibilidad de guías por tour y fecha
CREATE OR REPLACE VIEW guide_availability AS
SELECT 
  t.id as tour_id,
  t.nombre as tour_nombre,
  g.id as guide_id,
  g.nombre as guide_nombre,
  COUNT(CASE WHEN r.estado = 'confirmada' THEN 1 END) as tours_confirmados
FROM tours t
CROSS JOIN guides g
LEFT JOIN tour_guides tg ON t.id = tg.tour_id AND g.id = tg.guide_id
LEFT JOIN reservations r ON t.id = r.tour_id AND g.id = r.guide_id AND r.estado = 'confirmada'
WHERE tg.id IS NOT NULL
GROUP BY t.id, t.nombre, g.id, g.nombre;
