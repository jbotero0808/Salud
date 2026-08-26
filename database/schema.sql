-- ============================================================
-- Base de datos: salud
-- Arquitectura: Multitenant por esquema (schema-per-tenant)
-- ============================================================
-- Ejecutar como: psql -U <usuario> -d salud -f schema.sql

-- ------------------------------------------------------------
-- ESQUEMA PUBLIC: catálogo global y administración
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.medicos (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(150) NOT NULL,
    correo              VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    celular             VARCHAR(30),
    foto_logo_url       TEXT,
    documento_identidad VARCHAR(50) NOT NULL UNIQUE,
    empresa             VARCHAR(150),
    color_primario      VARCHAR(20) NOT NULL DEFAULT 'azul',
    schema_name         VARCHAR(63) NOT NULL UNIQUE,
    fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migración progresiva: agrega la columna si la tabla ya existía de una versión anterior.
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS empresa VARCHAR(150);

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

-- ------------------------------------------------------------
-- FUNCIÓN: crear_esquema_medico
-- Aprovisiona dinámicamente el esquema privado de un médico
-- y sus tablas base (pacientes, citas, historias_clinicas).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crear_esquema_medico(
    p_medico_id   INT,
    p_schema_name TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_schema_name !~ '^[a-z_][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'Nombre de esquema inválido: %', p_schema_name;
    END IF;

    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);

    EXECUTE format($f$
        CREATE TABLE IF NOT EXISTS %I.pacientes (
            id              SERIAL PRIMARY KEY,
            nombre          VARCHAR(150) NOT NULL,
            cedula          VARCHAR(50) NOT NULL UNIQUE,
            celular         VARCHAR(30),
            correo          VARCHAR(150),
            genero          VARCHAR(20),
            fecha_nacimiento DATE,
            direccion       TEXT,
            activo          CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n')),
            fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    $f$, p_schema_name);

    EXECUTE format($f$
        CREATE TABLE IF NOT EXISTS %I.citas (
            id           SERIAL PRIMARY KEY,
            paciente_id  INTEGER NOT NULL REFERENCES %I.pacientes(id) ON DELETE CASCADE,
            fecha_inicio TIMESTAMPTZ NOT NULL,
            fecha_fin    TIMESTAMPTZ NOT NULL,
            estado       VARCHAR(30) NOT NULL DEFAULT 'programada',
            notas        TEXT,
            activo       CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n'))
        )
    $f$, p_schema_name, p_schema_name);

    EXECUTE format($f$
        CREATE TABLE IF NOT EXISTS %I.historias_clinicas (
            id               SERIAL PRIMARY KEY,
            paciente_id      INTEGER NOT NULL REFERENCES %I.pacientes(id) ON DELETE CASCADE,
            fecha            TIMESTAMPTZ NOT NULL DEFAULT now(),
            tipo_consulta    VARCHAR(100),
            motivo_consulta  TEXT,
            diagnostico      TEXT,
            tratamiento      TEXT,
            observaciones    TEXT,
            imagen_url       TEXT,
            activo           CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n'))
        )
    $f$, p_schema_name, p_schema_name);

    EXECUTE format($f$
        CREATE TABLE IF NOT EXISTS %I.tabla_maestra (
            id      SERIAL PRIMARY KEY,
            nombre  VARCHAR(150) NOT NULL,
            tipo    VARCHAR(100) NOT NULL,
            activo  CHAR(1) NOT NULL DEFAULT 's' CHECK (activo IN ('s','n')),
            UNIQUE (nombre, tipo)
        )
    $f$, p_schema_name);

    -- Migración progresiva: si el esquema ya existía de una versión anterior
    -- de esta función, se le agregan las columnas nuevas sin perder datos.
    EXECUTE format('ALTER TABLE %I.pacientes ADD COLUMN IF NOT EXISTS activo CHAR(1) NOT NULL DEFAULT ''s''', p_schema_name);
    EXECUTE format('ALTER TABLE %I.citas ADD COLUMN IF NOT EXISTS activo CHAR(1) NOT NULL DEFAULT ''s''', p_schema_name);
    EXECUTE format('ALTER TABLE %I.historias_clinicas ADD COLUMN IF NOT EXISTS tipo_consulta VARCHAR(100)', p_schema_name);
    EXECUTE format('ALTER TABLE %I.historias_clinicas ADD COLUMN IF NOT EXISTS imagen_url TEXT', p_schema_name);
    EXECUTE format('ALTER TABLE %I.historias_clinicas ADD COLUMN IF NOT EXISTS activo CHAR(1) NOT NULL DEFAULT ''s''', p_schema_name);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_citas_fecha ON %I.citas (fecha_inicio)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_historias_paciente ON %I.historias_clinicas (paciente_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_tabla_maestra_tipo ON %I.tabla_maestra (tipo)', p_schema_name, p_schema_name);

    -- Catálogo inicial de "Tipo Consulta" para la tabla maestra del médico
    EXECUTE format($f$
        INSERT INTO %I.tabla_maestra (nombre, tipo, activo) VALUES
            ('Primera vez', 'tipoConsulta', 's'),
            ('Seguimiento', 'tipoConsulta', 's'),
            ('Control', 'tipoConsulta', 's'),
            ('Urgencia', 'tipoConsulta', 's')
        ON CONFLICT (nombre, tipo) DO NOTHING
    $f$, p_schema_name);

    -- Activar módulos gratuitos por defecto para el nuevo médico
    INSERT INTO public.permisos_medicos (medico_id, modulo_id, activo)
    SELECT p_medico_id, m.id, true
    FROM public.modulos m
    WHERE m.es_pago = false
    ON CONFLICT (medico_id, modulo_id) DO NOTHING;
END;
$$;
