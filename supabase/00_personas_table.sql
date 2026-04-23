-- =============================================================================
-- 00_personas_table.sql
-- Tabla base de personas (miembros, líderes, visitantes del censo).
--
-- ⚠️  Ejecutar PRIMERO, antes de cualquier otro script.
--
-- La tabla crm_tables.sql y multitenant_migration.sql asumen que esta
-- tabla ya existe.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.personas (
  id                         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                 timestamptz NOT NULL DEFAULT now(),

  -- Datos personales
  nombre                     text,
  apellido                   text,
  email                      text,
  telefono                   text,
  whatsapp                   text,
  edad                       integer,
  fecha_nacimiento           date,
  genero                     text,
  estado_civil               text,
  direccion                  text,
  barrio_zona                text,

  -- Datos socioeconómicos
  ocupacion                  text,
  nivel_educacion            text,
  conyuge                    text,
  hijos                      text,
  tamano_hogar               integer,
  vinculos_familiares_iglesia text,

  -- Rol y formación espiritual
  rol                        text,          -- 'Miembro', 'Líder', 'Visitante', etc.
  ano_conversion             text,
  fecha_llegada_cfc          date,
  bautizado                  text,
  ano_bautismo               text,
  fue_encuentro              text,
  nivel_formacion            text,
  como_conociste             text,
  quien_te_invito            text,

  -- Servicio
  habilidades_tecnicas       text,
  disponibilidad_horaria     text,
  area_servicio_actual       text,
  ministerio                 text,

  -- Célula / grupo
  grupo_celula               text,
  dia_reunion                text,
  hora_reunion               text,
  lugar_reunion              text,

  -- FK al líder de la célula (auto-referencia)
  lider_id                   uuid REFERENCES public.personas(id) ON DELETE SET NULL

  -- Las siguientes columnas son agregadas por scripts posteriores:
  --   foto_url              → add_foto_url.sql
  --   church_id             → multitenant_migration.sql
  --   estado_aprobacion     → portal_lideres.sql
  --   acceso_consolidacion  → setup_consolidacion.sql
);

-- Índices básicos (índices sobre church_id se agregan en multitenant_migration.sql)
CREATE INDEX IF NOT EXISTS idx_personas_rol      ON public.personas (rol);
CREATE INDEX IF NOT EXISTS idx_personas_lider_id ON public.personas (lider_id);

COMMENT ON TABLE public.personas IS
  'Tabla maestra: miembros, líderes y visitantes registrados por el censo.';
