-- =============================================================================
-- debug_church_users.sql
-- Verificar el estado de church_users y permisos
-- =============================================================================

-- 1. Ver todos los usuarios en church_users
SELECT 
  cu.id,
  cu.role,
  cu.is_active,
  u.email,
  c.name as iglesia,
  c.slug
FROM church_users cu
JOIN auth.users u ON u.id = cu.user_id
JOIN churches c ON c.id = cu.church_id
ORDER BY u.email;

-- 2. Ver políticas RLS de church_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'church_users'
ORDER BY policyname;

-- 3. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'church_users';

-- 4. Buscar el usuario developing@cfccasanova.com específicamente
SELECT 
  u.id as user_id,
  u.email,
  u.confirmed_at,
  u.email_confirmed_at,
  cu.church_id,
  cu.role,
  cu.is_active
FROM auth.users u
LEFT JOIN church_users cu ON cu.user_id = u.id
WHERE u.email = 'developing@cfccasanova.com';
