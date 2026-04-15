--=============================================================================
-- DIAGNÓSTICO RÁPIDO — ¿Por qué no aparece la aprobación en CRM?
-- 
-- Ejecutar este script en Supabase → SQL Editor
-- Te va a decir exactamente qué falta
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- TEST 1: ¿Existen las columnas necesarias?
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'TEST 1: Verificación de columnas' AS test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'estado_aprobacion') 
    THEN '✅ estado_aprobacion existe'
    ELSE '❌ FALTA estado_aprobacion - EJECUTAR portal_lideres.sql'
  END AS resultado_1,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'fecha_aprobacion') 
    THEN '✅ fecha_aprobacion existe'
    ELSE '❌ FALTA fecha_aprobacion - EJECUTAR portal_lideres.sql'
  END AS resultado_2,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'aprobado_por') 
    THEN '✅ aprobado_por existe'
    ELSE '❌ FALTA aprobado_por - EJECUTAR portal_lideres.sql'
  END AS resultado_3;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEST 2: ¿Hay líderes en la base de datos?
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'TEST 2: Total de personas por rol' AS test,
  rol,
  COUNT(*) as cantidad
FROM public.personas
GROUP BY rol
ORDER BY cantidad DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEST 3: ¿La columna estado_aprobacion tiene datos?
--         (Este query solo funciona si la columna existe)
-- ═══════════════════════════════════════════════════════════════════════════

-- Primero verificamos si existe la columna
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personas' AND column_name = 'estado_aprobacion'
  ) THEN
    RAISE NOTICE '✅ Columna estado_aprobacion existe - continuando con TEST 3...';
  ELSE
    RAISE EXCEPTION '❌ DETENER: estado_aprobacion NO existe. Ejecutar portal_lideres.sql primero.';
  END IF;
END $$;

-- Si llegaste acá, la columna existe. Ahora veamos los datos:
SELECT 
  'TEST 3: Líderes por estado de aprobación' AS test,
  COALESCE(estado_aprobacion, '⚠️ NULL (sin estado)') as estado,
  COUNT(*) as cantidad
FROM public.personas
WHERE rol = 'Líder'
GROUP BY estado_aprobacion
ORDER BY cantidad DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEST 4: ¿Qué líderes hay y cuál es su estado?
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'TEST 4: Detalle de todos los líderes' AS test;

SELECT 
  nombre || ' ' || apellido as nombre_completo,
  email,
  COALESCE(estado_aprobacion, '⚠️ NULL') as estado,
  created_at::date as fecha_registro,
  CASE 
    WHEN estado_aprobacion = 'pendiente' THEN '🟡 ESTE DEBERÍA APARECER EN CRM'
    WHEN estado_aprobacion = 'aprobado' THEN '🟢 Ya aprobado'
    WHEN estado_aprobacion = 'rechazado' THEN '🔴 Rechazado'
    WHEN estado_aprobacion IS NULL THEN '⚠️ SIN ESTADO - Actualizar a "pendiente"'
    ELSE '❓ Estado desconocido'
  END as nota
FROM public.personas
WHERE rol = 'Líder'
ORDER BY created_at DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEST 5: ¿Cuántos líderes DEBERÍAN aparecer en el badge?
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'TEST 5: Líderes pendientes (los que deberían aparecer en badge)' AS test,
  COUNT(*) as cantidad_badge
FROM public.personas
WHERE rol = 'Líder' AND estado_aprobacion = 'pendiente';

-- ⚠️ Si este número es 0, entonces NO aparecerá ningún badge en CRM
-- ⚠️ Necesitás tener al menos 1 líder con estado_aprobacion='pendiente'

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 SOLUCIONES AUTOMÁTICAS (descomenta según el problema)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- SOLUCIÓN A: Si las columnas NO existen
-- ───────────────────────────────────────────────────────────────────────────
-- Ejecutar portal_lideres.sql (todo el archivo)

-- ───────────────────────────────────────────────────────────────────────────
-- SOLUCIÓN B: Si los líderes existen pero tienen estado_aprobacion NULL
-- ───────────────────────────────────────────────────────────────────────────
/*
UPDATE public.personas
SET estado_aprobacion = 'pendiente'
WHERE rol = 'Líder' 
  AND estado_aprobacion IS NULL;

-- Verificar cuántos se actualizaron:
SELECT 
  'Líderes actualizados a pendiente' AS resultado,
  COUNT(*) as cantidad
FROM public.personas
WHERE rol = 'Líder' AND estado_aprobacion = 'pendiente';
*/

-- ───────────────────────────────────────────────────────────────────────────
-- SOLUCIÓN C: Si NO hay ningún líder, crear uno de prueba
-- ───────────────────────────────────────────────────────────────────────────
/*
-- Obtener church_id de CFC Casanova
WITH church_info AS (
  SELECT id as church_id 
  FROM public.churches 
  WHERE domain = 'cfccasanova.com' OR name ILIKE '%casanova%'
  LIMIT 1
)
INSERT INTO public.personas (
  church_id,
  nombre,
  apellido,
  email,
  telefono,
  fecha_nacimiento,
  genero,
  direccion,
  ciudad,
  provincia,
  codigo_postal,
  rol,
  estado_aprobacion,
  celula,
  ministerio
)
SELECT 
  church_id,
  'Samuel',
  'Mena',
  'samuelmena@cfccasanova.com',
  '3512345678',
  '1985-03-15',
  'Masculino',
  'Av. Colón 1234',
  'Córdoba',
  'Córdoba',
  '5000',
  'Líder',
  'pendiente',
  'Célula Norte',
  'Evangelismo'
FROM church_info
ON CONFLICT (email) DO NOTHING;

SELECT 
  '✅ Líder de prueba creado' AS resultado,
  'Email: samuelmena@cfccasanova.com' AS email,
  'Estado: pendiente' AS estado,
  'Deberías ver badge "1" en CRM ahora' AS nota;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 RESUMEN
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  '====== RESUMEN FINAL ======' AS info;

SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'estado_aprobacion')
    THEN '🔴 PROBLEMA: Falta columna estado_aprobacion'
    WHEN NOT EXISTS (SELECT 1 FROM public.personas WHERE rol = 'Líder')
    THEN '🟡 ADVERTENCIA: No hay líderes en la base de datos'
    WHEN NOT EXISTS (SELECT 1 FROM public.personas WHERE rol = 'Líder' AND estado_aprobacion = 'pendiente')
    THEN '🟡 ADVERTENCIA: No hay líderes pendientes (badge será 0)'
    ELSE '✅ TODO OK: Deberías ver el badge en CRM'
  END as diagnostico,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'estado_aprobacion')
    THEN '→ Ejecutar portal_lideres.sql'
    WHEN NOT EXISTS (SELECT 1 FROM public.personas WHERE rol = 'Líder')
    THEN '→ Ejecutar cleanup_and_test_data.sql (PASO 5)'
    WHEN NOT EXISTS (SELECT 1 FROM public.personas WHERE rol = 'Líder' AND estado_aprobacion = 'pendiente')
    THEN '→ Descomentar SOLUCIÓN B arriba'
    ELSE '→ Revisar deployment de Vercel (commit 941d91b) y hacer refresh en navegador'
  END as solucion;
