--=============================================================================
-- Solución: Ocultar líderes pendientes/rechazados de las consultas normales
-- 
-- Este script crea VIEWSque automáticamente filtran líderes no aprobados.
-- De esta manera, las queries existentes seguirán funcionando pero NO verán
-- líderes pendientes o rechazados.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- OPCIÓN 1: Crear una VIEW para miembros aprobados (RECOMENDADO)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.personas_aprobadas AS
SELECT *
FROM public.personas
WHERE 
  -- Miembros normales (que no son líderes) → se ven siempre
  (rol != 'Líder' OR rol IS NULL)
  OR
  -- Líderes SOLO si están aprobados
  (rol = 'Líder' AND estado_aprobacion = 'aprobado');

COMMENT ON VIEW public.personas_aprobadas IS 
  'Vista de personas que excluye líderes pendientes o rechazados. Usar esta vista en vez de la tabla personas para queries del CRM.';

-- ─────────────────────────────────────────────────────────────────────────────
-- OPCIÓN 2: Función para actualizar el comportamiento DEFAULT
-- ─────────────────────────────────────────────────────────────────────────────

-- Asegurarse que cuando se inserta un líder nuevo, SIqueda cómo 'pendiente'
ALTER TABLE public.personas 
  ALTER COLUMN estado_aprobacion SET DEFAULT 'pendiente';

-- Verificar
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personas' 
  AND column_name = 'estado_aprobacion';

-- ─────────────────────────────────────────────────────────────────────────────
-- OPCIÓN 3: Row Level Security (RLS) Policy — Más automático
-- ─────────────────────────────────────────────────────────────────────────────

-- Primero, verificar si RLS ya está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'personas';

-- Si rowsecurity = false, habilitar RLS:
-- ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- Crear policy que oculta líderes no aprobados para usuarios normales
-- (Los admins los ven todos)
-- Nota: SOLO descomentar si querés usar RLS
/*
CREATE POLICY "hide_pending_leaders" ON public.personas
  FOR SELECT
  TO authenticated
  USING (
    -- Miembros normales → siempre visibles
    (rol != 'Líder' OR rol IS NULL)
    OR
    -- Líderes → solo si están aprobados
    (rol = 'Líder' AND estado_aprobacion = 'aprobado')
    OR
    -- Admins ven TODO (incluyendo pendientes)
    EXISTS (
      SELECT 1 FROM public.church_users 
      WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
  );
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- Testing: Verificar que funciona
-- ─────────────────────────────────────────────────────────────────────────────

-- Ver diferencia entre la tabla completa y la vista filtrada
SELECT '===== TABLA COMPLETA (personas) =====' AS info;
SELECT 
  rol,
  estado_aprobacion,
  COUNT(*) as cantidad
FROM public.personas
GROUP BY rol, estado_aprobacion
ORDER BY rol, estado_aprobacion;

SELECT '===== VISTA FILTRADA (personas_aprobadas) =====' AS info;
SELECT 
  rol,
  COALESCE(estado_aprobacion, 'N/A') as estado_aprobacion,
  COUNT(*) as cantidad
FROM public.personas_aprobadas
GROUP BY rol, estado_aprobacion
ORDER BY rol, estado_aprobacion;

-- Ejemplo: ¿Cuántos líderes se ven en cada caso?
SELECT 
  '📊 TABLA personas' AS origen,
  COUNT(*) as total_lideres,
  SUM(CASE WHEN estado_aprobacion = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN estado_aprobacion = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
  SUM(CASE WHEN estado_aprobacion = 'rechazado' THEN 1 ELSE 0 END) as rechazados
FROM public.personas
WHERE rol = 'Líder'

UNION ALL

SELECT 
  '✅ VIEW personas_aprobadas' AS origen,
  COUNT(*) as total_lideres,
  SUM(CASE WHEN estado_aprobacion = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN estado_aprobacion = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
  SUM(CASE WHEN estado_aprobacion = 'rechazado' THEN 1 ELSE 0 END) as rechazados
FROM public.personas_aprobadas
WHERE rol = 'Líder';

-- ─────────────────────────────────────────────────────────────────────────────
-- 📋 INSTRUCCIONES DE USO
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 
  '✅ VIEW personas_aprobadas creada' AS resultado,
  'Ahora podés usar esta vista en vez de la tabla personas en tus queries del CRM.' AS como_usar,
  'Ejemplo: SELECT * FROM personas_aprobadas WHERE email = ''...'';' AS ejemplo,
  'Los líderes pendientes/rechazados NO aparecerán en esta vista.' AS beneficio;
