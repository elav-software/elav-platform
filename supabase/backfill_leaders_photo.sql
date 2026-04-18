-- =============================================================================
-- backfill_leaders_photo.sql
-- Rellena leaders.photo con personas.foto_url para líderes ya aprobados
-- que fueron registrados antes de que se implementara la feature de fotos.
--
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor.
-- =============================================================================

UPDATE public.leaders l
SET photo = p.foto_url
FROM public.personas p
WHERE p.foto_url IS NOT NULL
  AND p.foto_url <> ''
  AND l.photo IS NULL
  AND p.email ILIKE l.email;

-- Verificación: ver líderes con foto después del backfill
SELECT l.full_name, l.email, l.photo
FROM public.leaders l
WHERE l.photo IS NOT NULL
ORDER BY l.full_name;
