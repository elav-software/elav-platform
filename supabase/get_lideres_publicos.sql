-- =============================================================================
-- get_lideres_publicos.sql
-- Ejecutar en Supabase → SQL Editor
--
-- Expone una función RPC para que el formulario público de miembros
-- (/miembros) pueda obtener la lista de líderes aprobados sin necesitar
-- acceso directo a la tabla `personas`.
--
-- Ventajas sobre una política RLS anon en personas:
--   ✓ Solo devuelve los 3 campos necesarios (id, nombre, apellido)
--   ✓ Solo líderes aprobados del church_id correcto
--   ✓ La tabla personas sigue completamente cerrada para anon
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_lideres_publicos(p_church_id uuid)
RETURNS TABLE(id uuid, nombre text, apellido text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.nombre, p.apellido
  FROM public.personas p
  WHERE p.church_id       = p_church_id
    AND p.rol              = 'Líder'
    AND p.estado_aprobacion = 'aprobado'
  ORDER BY p.apellido, p.nombre;
$$;

-- Permitir que usuarios no autenticados (anon) llamen a esta función
GRANT EXECUTE ON FUNCTION public.get_lideres_publicos(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_lideres_publicos(uuid) TO authenticated;

-- Verificar
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_lideres_publicos';
