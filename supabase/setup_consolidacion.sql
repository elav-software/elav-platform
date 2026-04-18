-- =============================================================================
-- setup_consolidacion.sql
-- Crea usuarios del equipo de Consolidación para acceso al portal
--
-- INSTRUCCIONES:
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Para cada miembro del equipo de consolidación:
--    a) Crear usuario en Auth: Supabase Dashboard → Auth → Users → Invite user
--    b) Ejecutar el INSERT de ejemplo abajo con sus datos reales
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Política RLS: el usuario de consolidación puede INSERT en visitors
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "consolidacion_insert_visitors" ON public.visitors;

CREATE POLICY "consolidacion_insert_visitors"
  ON public.visitors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.personas
      WHERE email ILIKE auth.jwt() ->> 'email'
        AND rol = 'Consolidación'
        AND church_id = visitors.church_id
    )
    OR
    -- Los admins CRM también pueden insertar
    EXISTS (
      SELECT 1 FROM public.church_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política RLS: el equipo de consolidación puede ver solo sus propios registros
DROP POLICY IF EXISTS "consolidacion_select_own_visitors" ON public.visitors;

CREATE POLICY "consolidacion_select_own_visitors"
  ON public.visitors
  FOR SELECT
  TO authenticated
  USING (
    -- Admin CRM ve todos
    (
      church_id = public.my_church_id()
      AND EXISTS (
        SELECT 1 FROM public.church_users
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    OR
    -- Consolidación ve solo los que registró (por email en invited_by)
    (
      invited_by ILIKE '%' || (auth.jwt() ->> 'email') || '%'
      AND church_id = public.my_leader_church_id()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Agregar usuarios de Consolidación a la tabla personas
--    Reemplazar con los datos reales de cada miembro
-- ─────────────────────────────────────────────────────────────────────────────
-- EJEMPLO — descomentar y completar con datos reales:
/*
INSERT INTO public.personas (
  nombre, apellido, email, telefono, rol, estado_aprobacion, church_id
) VALUES 
  ('Nombre1', 'Apellido1', 'consolidacion1@email.com', '1123456789', 'Consolidación', 'aprobado', '61e61e01-983a-4ea8-b479-2d9c38c47519'),
  ('Nombre2', 'Apellido2', 'consolidacion2@email.com', '1198765432', 'Consolidación', 'aprobado', '61e61e01-983a-4ea8-b479-2d9c38c47519')
ON CONFLICT (email) DO UPDATE SET rol = 'Consolidación', estado_aprobacion = 'aprobado';
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Verificación
-- ─────────────────────────────────────────────────────────────────────────────
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'visitors' 
ORDER BY policyname;
