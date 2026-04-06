-- =============================================================================
-- fix_vincular_usuarios.sql
-- Vincula manualmente los usuarios de CFC en church_users
-- =============================================================================

-- Obtener el church_id de CFC e insertar usuarios
DO $$
DECLARE
  cfc_id uuid;
  dev_user_id uuid;
  jona_user_id uuid;
BEGIN
  -- Buscar la iglesia CFC
  SELECT id INTO cfc_id FROM public.churches WHERE slug = 'cfc';
  
  IF cfc_id IS NULL THEN
    RAISE EXCEPTION 'No existe la iglesia CFC. Ejecutar multitenant_migration.sql primero.';
  END IF;

  RAISE NOTICE 'Iglesia CFC encontrada: %', cfc_id;

  -- Buscar el usuario developing@cfccasanova.com
  SELECT id INTO dev_user_id FROM auth.users WHERE email = 'developing@cfccasanova.com';
  
  IF dev_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe el usuario developing@cfccasanova.com en auth.users';
  END IF;

  -- Insertar/actualizar en church_users
  INSERT INTO public.church_users (church_id, user_id, role, is_active)
  VALUES (cfc_id, dev_user_id, 'admin', true)
  ON CONFLICT (church_id, user_id) 
  DO UPDATE SET role = 'admin', is_active = true;

  RAISE NOTICE 'Usuario developing@cfccasanova.com vinculado correctamente';

  -- Intentar con jonapereda también
  SELECT id INTO jona_user_id FROM auth.users WHERE email = 'jonapereda@cfccasanova.com';
  
  IF jona_user_id IS NOT NULL THEN
    INSERT INTO public.church_users (church_id, user_id, role, is_active)
    VALUES (cfc_id, jona_user_id, 'admin', true)
    ON CONFLICT (church_id, user_id) 
    DO UPDATE SET role = 'admin', is_active = true;
    
    RAISE NOTICE 'Usuario jonapereda@cfccasanova.com vinculado correctamente';
  ELSE
    RAISE NOTICE 'Usuario jonapereda@cfccasanova.com no existe en auth.users (crearlo manualmente si lo necesitás)';
  END IF;

END $$;

-- Verificar que se insertó correctamente
SELECT 
  cu.role,
  cu.is_active,
  u.email,
  c.name as iglesia,
  c.slug
FROM church_users cu
JOIN auth.users u ON u.id = cu.user_id
JOIN churches c ON c.id = cu.church_id
ORDER BY u.email;
