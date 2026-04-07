--=============================================================================
-- Crear usuarios de autenticación para líderes existentes
-- 
-- Este script crea cuentas en auth.users para los líderes que ya están
-- en la tabla personas, usando email + contraseña
-- 
-- INSTRUCCIONES:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Los líderes podrán loguearse con email + password
-- 3. Password default: "Lider2024!" (cambiar después del primer login)
-- =============================================================================

-- NOTA: Supabase no permite crear usuarios directamente desde SQL por seguridad
-- Debés usar la API de Admin o el Dashboard

-- ═══════════════════════════════════════════════════════════════════════════
-- Opción 1: Ver lista de líderes para crear manualmente en Dashboard
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  email,
  nombre || ' ' || apellido as nombre_completo,
  rol,
  estado_aprobacion
FROM public.personas
WHERE rol = 'Líder'
ORDER BY nombre;

-- ═══════════════════════════════════════════════════════════════════════════
-- Instrucciones para crear usuarios manualmente:
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 1. Ve a Supabase Dashboard → Authentication → Users
-- 2. Click en "Add user" → "Create new user"
-- 3. Para cada líder de la lista arriba:
--    - Email: [copiar de la lista]
--    - Password: Lider2024! (o la que quieras)
--    - Auto Confirm User: ✅ ON (para que no tenga que confirmar email)
-- 4. Click "Create user"
--
-- IMPORTANTE: Los líderes deben estar en estado "aprobado" para acceder al portal
-- Ejecutá esto para aprobar un líder:
--
-- UPDATE personas 
-- SET estado_aprobacion = 'aprobado', fecha_aprobacion = now()
-- WHERE email = 'samuel.mena@cfccasanova.com';
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Lista de emails de líderes (copiar/pegar para crear usuarios):
SELECT email FROM public.personas WHERE rol = 'Líder' ORDER BY nombre;

-- Aprobar todos los líderes (SOLO PARA TESTING):
-- UPDATE public.personas 
-- SET estado_aprobacion = 'aprobado', fecha_aprobacion = now()
-- WHERE rol = 'Líder';
