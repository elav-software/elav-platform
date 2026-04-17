-- =============================================================================
-- superadmin.sql
-- Configura el rol superadmin que puede acceder a todos los CRM.
--
-- PASO 1: Ejecutar este script
-- PASO 2: Insertar el registro del superadmin con el UUID de tu usuario
-- =============================================================================

-- 1. Agregar "superadmin" como rol válido en church_users
--    (Si la columna ya tiene un CHECK constraint, lo ampliamos)
ALTER TABLE public.church_users
  DROP CONSTRAINT IF EXISTS church_users_role_check;

ALTER TABLE public.church_users
  ADD CONSTRAINT church_users_role_check
  CHECK (role IN ('admin', 'user', 'superadmin'));

-- 2. Insertar el superadmin (reemplazar UUID con el id de auth.users)
--    church_id puede ser NULL — el superadmin no pertenece a una sola iglesia
INSERT INTO public.church_users (user_id, church_id, role, is_active)
VALUES (
  'REEMPLAZAR-CON-UUID-DEL-SUPERADMIN',  -- id de auth.users
  NULL,                                   -- sin iglesia fija
  'superadmin',
  true
)
ON CONFLICT (user_id, church_id) DO UPDATE SET role = 'superadmin', is_active = true;

-- NOTA: Si la tabla tiene un UNIQUE(user_id, church_id), el NULL en church_id
-- puede fallar. En ese caso usar:
-- INSERT INTO public.church_users (user_id, role, is_active)
-- VALUES ('UUID', 'superadmin', true);


-- =============================================================================
-- 3. Ajustar RLS de tablas clave para permitir acceso al superadmin
--    (sin estas excepciones el superadmin no puede leer datos de otras iglesias)
-- =============================================================================

-- Helper: función para verificar si el usuario es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_users
    WHERE user_id = auth.uid()
      AND role = 'superadmin'
      AND is_active = true
  );
$$;

-- personas
DROP POLICY IF EXISTS "superadmin puede ver todas las personas" ON public.personas;
CREATE POLICY "superadmin puede ver todas las personas"
  ON public.personas FOR SELECT
  USING (public.is_superadmin());

DROP POLICY IF EXISTS "superadmin puede modificar personas" ON public.personas;
CREATE POLICY "superadmin puede modificar personas"
  ON public.personas FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- churches
DROP POLICY IF EXISTS "superadmin puede ver todas las iglesias" ON public.churches;
CREATE POLICY "superadmin puede ver todas las iglesias"
  ON public.churches FOR SELECT
  USING (public.is_superadmin());

-- church_users
DROP POLICY IF EXISTS "superadmin puede ver todos los users" ON public.church_users;
CREATE POLICY "superadmin puede ver todos los users"
  ON public.church_users FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- leader_materials
DROP POLICY IF EXISTS "superadmin puede gestionar todos los materiales" ON public.leader_materials;
CREATE POLICY "superadmin puede gestionar todos los materiales"
  ON public.leader_materials FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- leader_cell_submissions
DROP POLICY IF EXISTS "superadmin puede ver todas las submissions" ON public.leader_cell_submissions;
CREATE POLICY "superadmin puede ver todas las submissions"
  ON public.leader_cell_submissions FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());


-- =============================================================================
-- 4. VERIFICACIÓN
-- =============================================================================
-- SELECT user_id, church_id, role, is_active FROM public.church_users WHERE role = 'superadmin';
