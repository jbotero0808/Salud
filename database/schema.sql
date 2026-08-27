-- ============================================================
-- Base de datos: una por cliente (arquitectura database-per-tenant)
-- Cada cliente tiene su propia base de datos (ej. un proyecto Neon
-- distinto) y su propia URL/despliegue de Vercel. No hay separación
-- por esquemas: todas las tablas viven en "public".
-- ============================================================
-- Ejecutar como: psql "<DATABASE_URL_DEL_CLIENTE>" -f schema.sql

CREATE TABLE IF NOT EXISTS public.medicos (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(150) NOT NULL,
    correo              VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    celular             VARCHAR(30),
    foto_logo_url       TEXT,
    documento_identidad VARCHAR(50) NOT NULL UNIQUE,
    empresa             VARCHAR(150),
    profesion           VARCHAR(100),
    color_primario      VARCHAR(20) NOT NULL DEFAULT 'azul',
    fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migración progresiva: agrega la columna si la tabla ya existía de una versión anterior.
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS profesion VARCHAR(100);

CREATE TABLE IF NOT EXISTS public.modulos (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    es_pago     BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.permisos_medicos (
    id          SERIAL PRIMARY KEY,
    medico_id   INTEGER NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
    modulo_id   INTEGER NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
    activo      BOOLEAN NOT NULL DEFAULT true,
    fecha_activacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (medico_id, modulo_id)
);

-- Catálogo base de módulos (idempotente)
INSERT INTO public.modulos (nombre, descripcion, es_pago) VALUES
    ('citas',              'Agenda y calendario de citas',            false),
    ('pacientes',          'Gestión de pacientes',                    false),
    ('historias_clinicas', 'Historias clínicas y evoluciones',        false),
    ('reportes',           'Reportes y estadísticas avanzadas',       true),
    ('recordatorios_sms',  'Recordatorios de citas por SMS/WhatsApp', true)
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pacientes (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    cedula          VARCHAR(50) NOT NULL UNIQUE,
    celular         VARCHAR(30),
    correo          VARCHAR(150),
    genero          VARCHAR(20),
    fecha_nacimiento DATE,
    direccion       TEXT,
    foto_url        TEXT,
    activo          CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n')),
    fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migración progresiva: agrega la columna si la tabla ya existía de una versión anterior.
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS foto_url TEXT;

CREATE TABLE IF NOT EXISTS public.citas (
    id           SERIAL PRIMARY KEY,
    paciente_id  INTEGER NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin    TIMESTAMPTZ NOT NULL,
    estado       VARCHAR(30) NOT NULL DEFAULT 'programada',
    notas        TEXT,
    activo       CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n'))
);

CREATE TABLE IF NOT EXISTS public.historias_clinicas (
    id               SERIAL PRIMARY KEY,
    paciente_id      INTEGER NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    fecha            TIMESTAMPTZ NOT NULL DEFAULT now(),
    tipo_consulta    VARCHAR(100),
    motivo_consulta  TEXT,
    diagnostico      TEXT,
    tratamiento      TEXT,
    observaciones    TEXT,
    imagen_url       TEXT,
    proxima_revision TIMESTAMPTZ,
    activo           CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n'))
);

-- Migración progresiva: agrega la columna si la tabla ya existía de una versión anterior.
ALTER TABLE public.historias_clinicas ADD COLUMN IF NOT EXISTS proxima_revision TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.tabla_maestra (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(150) NOT NULL,
    tipo    VARCHAR(100) NOT NULL,
    activo  CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n')),
    UNIQUE (nombre, tipo)
);

-- Catálogo inicial de "Tipo Consulta" para la tabla maestra
INSERT INTO public.tabla_maestra (nombre, tipo, activo) VALUES
    ('Primera vez', 'tipoConsulta', 's'),
    ('Seguimiento', 'tipoConsulta', 's'),
    ('Control', 'tipoConsulta', 's'),
    ('Urgencia', 'tipoConsulta', 's')
ON CONFLICT (nombre, tipo) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas (fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_historias_paciente ON public.historias_clinicas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_tabla_maestra_tipo ON public.tabla_maestra (tipo);

-- El médico (usuario) de esta base de datos se crea con:
--   node backend/scripts/crear-medico.js
-- No hay registro público: cada cliente tiene un único médico,
-- provisionado por el administrador junto con la base de datos.
