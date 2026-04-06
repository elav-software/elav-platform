-- =============================================================================
-- fix_insert_church_users.sql
-- Inserta manualmente los usuarios en church_users
-- =============================================================================

-- Primero verificar si ya existen los registros
SELECT 
  cu.*,
  u.email,
  c.name as iglesia
FROM church_users cu
JOIN auth.users u ON u.id = cu.user_id
JOIN churches c ON c.id = cu.church_id;

-- Si la query anterior NO muestra filas, ejecutar esto:

DO $$
DECLARE
  cfc_id    uuid;
  admin_uid uuid;
  admin_email text;
BEGIN
  -- Obtener el ID de CFC
  SELECT id INTO cfc_id FROM public.churches WHERE slug = 'cfc';

  IF cfc_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la iglesia CFC. Ejecutar multitenant_migration.sql primero.';
  END IF;

  RAISE NOTICE 'Iglesia CFC encontrada: %', cfc_id;

  -- Vincular los admins uno por uno
  FOR admin_email IN 
    SELECT unnest(ARRAY[
      'developing@cfccasanova.com',
      'jonapereda@cfccasanova.com'
    ])
  LOOP
    -- Buscar el usuario en auth.users
    SELECT id INTO admin_uid
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_uid IS NOT NULL THEN
      -- Insertar en church_users
      INSERT INTO public.church_users (church_id, user_id, role, is_active)
      VALUES (cfc_id, admin_uid, 'admin', true)
      ON CONFLICT (church_id, user_id) DO UPDATE
        SET role = 'admin', is_active = true;
      
      RAISE NOTICE 'Admin vinculado: % (user_id: %)', admin_email, admin_uid;
    ELSE
      RAISE WARNING 'No existe usuario en auth.users con email: %', admin_email;
      RAISE NOTICE 'Crear el usuario manualmente en Supabase Auth → Authentication → Add user';
    END IF;
  END LOOP;
END $$;

-- Verificar que se insertaron correctamente
SELECT 
  cu.role,
  cu.is_active,
  u.email,
  c.name as iglesia
FROM church_users cu
JOIN auth.users u ON u.id = cu.user_id
JOIN churches c ON c.id = cu.church_id
ORDER BY u.email;
