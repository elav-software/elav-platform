--=============================================================================
-- Script de Limpieza y Datos de Prueba — CFC Casanova
-- 
-- Este script:
--   1. Verifica que las columnas del portal existan
--   2. Limpia datos duplicados
--   3. Genera líderes de prueba para testing
-- 
-- IMPORTANTE: Revisar ANTES de ejecutar en producción
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: VERIFICACIÓN DE COLUMNAS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  -- Verificar si existe estado_aprobacion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personas' AND column_name = 'estado_aprobacion'
  ) THEN
    RAISE NOTICE '❌ FALTA COLUMNA: estado_aprobacion - EJECUTAR portal_lideres.sql PRIMERO';
  ELSE
    RAISE NOTICE '✅ Columna estado_aprobacion existe';
  END IF;
  
  -- Verificar si existe fecha_aprobacion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personas' AND column_name = 'fecha_aprobacion'
  ) THEN
    RAISE NOTICE '❌ FALTA COLUMNA: fecha_aprobacion - EJECUTAR portal_lideres.sql PRIMERO';
  ELSE
    RAISE NOTICE '✅ Columna fecha_aprobacion existe';
  END IF;
  
  -- Verificar si existe aprobado_por
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personas' AND column_name = 'aprobado_por'
  ) THEN
    RAISE NOTICE '❌ FALTA COLUMNA: aprobado_por - EJECUTAR portal_lideres.sql PRIMERO';
  ELSE
    RAISE NOTICE '✅ Columna aprobado_por existe';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: MOSTRAR DUPLICADOS ANTES DE LIMPIAR
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 
  '====== DUPLICADOS POR EMAIL ======' AS info;

SELECT 
  email,
  COUNT(*) as cantidad,
  STRING_AGG(nombre || ' ' || apellido, ', ') as nombres,
  STRING_AGG(rol::text, ', ') as roles
FROM public.personas
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

SELECT 
  '====== DUPLICADOS POR TELÉFONO ======' AS info;

SELECT 
  telefono,
  COUNT(*) as cantidad,
  STRING_AGG(nombre || ' ' || apellido, ', ') as nombres
FROM public.personas
WHERE telefono IS NOT NULL AND telefono != ''
GROUP BY telefono
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: LIMPIEZA DE DUPLICADOS
-- ─────────────────────────────────────────────────────────────────────────────

-- ⚠️ DESCOMENTA SOLO DESPUÉS DE REVISAR LOS DUPLICADOS ARRIBA ⚠️
/*
-- Mantener solo el registro más reciente por email
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY email 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM public.personas
  WHERE email IS NOT NULL AND email != ''
)
DELETE FROM public.personas
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Mostrar cuántos se eliminaron
SELECT 
  '✅ Duplicados eliminados' AS resultado,
  COUNT(*) AS registros_restantes
FROM public.personas;
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: BORRAR TODOS LOS DATOS DE PRUEBA (OPCIONAL)
-- ─────────────────────────────────────────────────────────────────────────────

-- ⚠️ DESCOMENTA SOLO SI QUERÉS EMPEZAR DE CERO ⚠️
/*
-- Borrar reportes de célula
DELETE FROM public.leader_cell_submissions;

-- Borrar pedidos de oración
DELETE FROM public.leader_prayer_requests;

-- Borrar todas las personas
DELETE FROM public.personas;

SELECT '🗑️ Todos los datos de prueba borrados' AS resultado;
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: GENERAR LÍDERES DE PRUEBA
-- ─────────────────────────────────────────────────────────────────────────────

-- Obtener el church_id de CFC Casanova
DO $$
DECLARE
  v_church_id uuid;
BEGIN
  -- Buscar el church_id
  SELECT id INTO v_church_id 
  FROM public.churches 
  WHERE domain = 'cfccasanova.com' OR name ILIKE '%casanova%'
  LIMIT 1;
  
  IF v_church_id IS NULL THEN
    RAISE EXCEPTION '❌ No se encontró la iglesia CFC Casanova. Verificar tabla churches.';
  END IF;
  
  RAISE NOTICE '✅ Church ID encontrado: %', v_church_id;
  
  -- Insertar 10 líderes de prueba
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
    ministerio,
    fecha_bautismo_agua,
    created_at
  ) VALUES
  -- Líder 1 - Ya aprobado
  (v_church_id, 'Samuel', 'Mena', 'samuelmena@cfccasanova.com', '3512345001', 
   '1985-03-15', 'Masculino', 'Av. Colón 1234', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'aprobado', 'Célula Norte', 'Evangelismo', '2015-06-20', NOW() - INTERVAL '30 days'),
  
  -- Líder 2 - Pendiente aprobación
  (v_church_id, 'María', 'González', 'mariagonzalez@cfccasanova.com', '3512345002',
   '1990-07-22', 'Femenino', 'Bv. San Juan 567', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'pendiente', 'Célula Centro', 'Alabanza', '2018-03-10', NOW() - INTERVAL '2 days'),
  
  -- Líder 3 - Pendiente aprobación
  (v_church_id, 'Carlos', 'Rodríguez', 'carlosrodriguez@cfccasanova.com', '3512345003',
   '1988-11-05', 'Masculino', 'Calle Caseros 890', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'pendiente', 'Célula Sur', 'Jóvenes', '2016-09-25', NOW() - INTERVAL '1 day'),
  
  -- Líder 4 - Aprobado
  (v_church_id, 'Ana', 'Martínez', 'anamartinez@cfccasanova.com', '3512345004',
   '1992-02-18', 'Femenino', 'Av. Vélez Sarsfield 456', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'aprobado', 'Célula Este', 'Misiones', '2017-11-30', NOW() - INTERVAL '60 days'),
  
  -- Líder 5 - Pendiente aprobación
  (v_church_id, 'Pedro', 'Fernández', 'pedrofernandez@cfccasanova.com', '3512345005',
   '1987-09-12', 'Masculino', 'Calle Duarte Quirós 234', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'pendiente', 'Célula Oeste', 'Intercesión', '2019-04-15', NOW() - INTERVAL '5 hours'),
  
  -- Líder 6 - Rechazado (ejemplo)
  (v_church_id, 'Laura', 'Gómez', 'lauragomez@cfccasanova.com', '3512345006',
   '1995-05-30', 'Femenino', 'Bv. Illia 678', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'rechazado', NULL, NULL, NULL, NOW() - INTERVAL '10 days'),
  
  -- Líder 7 - Pendiente
  (v_church_id, 'Jorge', 'López', 'jorgelopez@cfccasanova.com', '3512345007',
   '1983-12-08', 'Masculino', 'Av. Rafael Núñez 901', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'pendiente', 'Célula Alto Alberdi', 'Varones', '2014-08-05', NOW() - INTERVAL '3 hours'),
  
  -- Líder 8 - Pendiente
  (v_church_id, 'Silvia', 'Ramírez', 'silviaramirez@cfccasanova.com', '3512345008',
   '1991-04-25', 'Femenino', 'Calle Oncativo 345', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'pendiente', 'Célula Nueva Córdoba', 'Damas', '2020-01-12', NOW() - INTERVAL '1 hour'),
  
  -- Miembro 9 - No es líder (para comparar)
  (v_church_id, 'Roberto', 'Díaz', 'robertodiaz@cfccasanova.com', '3512345009',
   '1989-06-14', 'Masculino', 'Av. Circunvalación 567', 'Córdoba', 'Córdoba', '5000',
   'Miembro', NULL, NULL, 'Evangelismo', '2021-07-20', NOW() - INTERVAL '15 days'),
  
  -- Líder 10 - Aprobado
  (v_church_id, 'Patricia', 'Torres', 'patriciatorres@cfccasanova.com', '3512345010',
   '1986-10-03', 'Femenino', 'Calle Ituzaingó 789', 'Córdoba', 'Córdoba', '5000',
   'Líder', 'aprobado', 'Célula Cerro', 'Niños', '2015-12-18', NOW() - INTERVAL '90 days')
  
  ON CONFLICT (email) DO NOTHING;
  
  RAISE NOTICE '✅ Líderes de prueba insertados';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────────────────────────────────────

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

SELECT 
  '====== LÍDERES PENDIENTES ======' AS info;

SELECT 
  nombre || ' ' || apellido as nombre_completo,
  email,
  celula,
  ministerio,
  created_at,
  CASE 
    WHEN created_at > NOW() - INTERVAL '1 hour' THEN '🔥 Reciente (<1h)'
    WHEN created_at > NOW() - INTERVAL '1 day' THEN '📅 Hoy'
    WHEN created_at > NOW() - INTERVAL '7 days' THEN '📆 Esta semana'
    ELSE '📋 Antiguo'
  END as antiguedad
FROM public.personas
WHERE rol = 'Líder' AND estado_aprobacion = 'pendiente'
ORDER BY created_at DESC;

SELECT 
  '====== TOTAL DE PERSONAS ======' AS info;

SELECT 
  rol,
  COUNT(*) as cantidad
FROM public.personas
GROUP BY rol
ORDER BY cantidad DESC;
