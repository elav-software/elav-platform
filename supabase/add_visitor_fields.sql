-- =============================================================================
-- add_visitor_fields.sql
-- Agrega campos adicionales a la tabla visitors:
--   edad, estado_civil, barrio, contacted_by
--
-- Ejecutar en: DEV y PRODUCCIÓN
-- Seguro para correr múltiples veces (IF NOT EXISTS por cada columna).
-- =============================================================================

ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS edad         integer,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS barrio       text,
  ADD COLUMN IF NOT EXISTS contacted_by text;  -- nombre de quien contactó (equipo consolidación)
