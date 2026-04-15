--=============================================================================
-- Fix Rápido: Eliminar Duplicados y Prevenir Futuros
-- 
-- Este script:
--   1. Muestra los duplicados actuales
--   2. Los elimina (mantiene el más reciente)
--   3. Agrega constraint UNIQUE para prevenir duplicados futuros
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Ver duplicados actuales
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 
  '====== DUPLICADOS ACTUALES ======' AS info;

SELECT 
  email,
  COUNT(*) as veces_duplicado,
  STRING_AGG(nombre || ' ' || apellido, ' | ') as nombres,
  STRING_AGG(id::text, ', ') as ids
FROM public.personas
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Reasignar referencias de lider_id antes de eliminar
-- ─────────────────────────────────────────────────────────────────────────────

-- Primero, actualizar lider_id para que apunte al registro que vamos a mantener
WITH duplicates AS (
  SELECT 
    id as old_id,
    email,
    FIRST_VALUE(id) OVER (
      PARTITION BY email 
      ORDER BY created_at DESC, id DESC  -- El más reciente
    ) as new_id,
    ROW_NUMBER() OVER (
      PARTITION BY email 
      ORDER BY created_at DESC, id DESC
    ) as row_num
  FROM public.personas
  WHERE email IS NOT NULL AND email != ''
)
UPDATE public.personas
SET lider_id = d.new_id
FROM duplicates d
WHERE personas.lider_id = d.old_id
  AND d.row_num > 1  -- Solo actualizar si el líder actual es un duplicado que será eliminado
  AND d.old_id != d.new_id;

SELECT '✓ Referencias de lider_id actualizadas' AS paso_2a;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: Eliminar duplicados (mantiene el registro MÁS RECIENTE)
-- ─────────────────────────────────────────────────────────────────────────────

-- Ahora sí, eliminar los duplicados
WITH duplicates AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (
      PARTITION BY email 
      ORDER BY created_at DESC, id DESC  -- El más reciente primero
    ) as row_num
  FROM public.personas
  WHERE email IS NOT NULL AND email != ''
)
DELETE FROM public.personas
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1  -- Eliminar todos excepto el primero (más reciente)
);

-- Mostrar resultado
SELECT 
  '✅ Duplicados eliminados' AS resultado,
  COUNT(*) AS total_personas_restantes
FROM public.personas;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: Agregar constraint UNIQUE para prevenir duplicados futuros
-- ─────────────────────────────────────────────────────────────────────────────

-- Primero eliminar el constraint si ya existe (por si ejecutás esto múltiples veces)
ALTER TABLE public.personas 
  DROP CONSTRAINT IF EXISTS unique_email_per_church;

-- Agregar constraint: email debe ser único dentro de cada iglesia
ALTER TABLE public.personas
  ADD CONSTRAINT unique_email_per_church 
  UNIQUE (church_id, email);

SELECT 
  '✅ Constraint agregado: emails ahora son únicos por iglesia' AS resultado;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: Verificación final
-- ─────────────────────────────────────────────────────────────────────────────

-- Mostrar que ya no hay duplicados
SELECT 
  '====== VERIFICACIÓN: ¿Quedan duplicados? ======' AS info;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM public.personas 
      WHERE email IS NOT NULL 
      GROUP BY email 
      HAVING COUNT(*) > 1
    )
    THEN '❌ Todavía hay duplicados'
    ELSE '✅ No hay duplicados'
  END AS estado_duplicados;

-- Mostrar conteo por estado de aprobación
SELECT 
  '====== RESUMEN DE LÍDERES ======' AS info;

SELECT 
  estado_aprobacion,
  COUNT(*) as cantidad
FROM public.personas
WHERE rol = 'Líder'
GROUP BY estado_aprobacion
ORDER BY 
  CASE estado_aprobacion
    WHEN 'pendiente' THEN 1
    WHEN 'aprobado' THEN 2
    WHEN 'rechazado' THEN 3
  END;

-- ─────────────────────────────────────────────────────────────────────────────
-- ℹ️ NOTA IMPORTANTE
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 
  '⚠️ NOTA IMPORTANTE' AS titulo,
  'Ahora si intentás cargar el censo con un email que ya existe, va a dar error.' AS mensaje,
  'Esto es BUENO porque previene duplicados.' AS razon,
  'Si necesitás actualizar datos de alguien que ya existe, usar UPDATE en vez de INSERT.' AS solucion;
