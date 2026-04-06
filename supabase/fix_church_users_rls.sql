-- =============================================================================
-- fix_church_users_rls.sql
-- Arregla las políticas RLS de church_users para permitir login
-- =============================================================================

-- Habilitar RLS en church_users
ALTER TABLE public.church_users ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas viejas
DROP POLICY IF EXISTS "public_read_own_church_user" ON public.church_users;
DROP POLICY IF EXISTS "authenticated_read_own_church_user" ON public.church_users;

-- Permitir que usuarios autenticados lean su propio registro
-- (necesario para el login y verificación de permisos)
CREATE POLICY "authenticated_read_own_church_user" 
ON public.church_users
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Los admins pueden leer todos los usuarios de su iglesia
CREATE POLICY "admin_read_church_users"
ON public.church_users
FOR SELECT
TO authenticated
USING (
  church_id IN (
    SELECT church_id FROM public.church_users 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Los admins pueden insertar nuevos usuarios en su iglesia
CREATE POLICY "admin_insert_church_users"
ON public.church_users
FOR INSERT
TO authenticated
WITH CHECK (
  church_id IN (
    SELECT church_id FROM public.church_users 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Los admins pueden actualizar usuarios de su iglesia
CREATE POLICY "admin_update_church_users"
ON public.church_users
FOR UPDATE
TO authenticated
USING (
  church_id IN (
    SELECT church_id FROM public.church_users 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Verificación
SELECT 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'church_users';
