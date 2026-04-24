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
-- 0. Agregar columna acceso_consolidacion a personas (si no existe)
--    Permite que un Líder también pueda registrar visitantes
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS acceso_consolidacion boolean DEFAULT false;

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
        AND (
          rol = 'Consolidación'
          OR (rol = 'Líder' AND acceso_consolidacion = true)
        )
        AND church_id = visitors.church_id
    )
    OR
    -- Los admins CRM también pueden insertar
    EXISTS (
      SELECT 1 FROM public.church_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política RLS: el equipo de consolidación puede ver visitors de su iglesia
-- NOTA: NO usar my_leader_church_id() aquí — esa función solo funciona para
-- rol='Líder' con estado_aprobacion='aprobado'. Para Consolidación usamos
-- una subquery directa en personas que compara church_id del visitor.
DROP POLICY IF EXISTS "consolidacion_select_own_visitors" ON public.visitors;

CREATE POLICY "consolidacion_select_own_visitors"
  ON public.visitors
  FOR SELECT
  TO authenticated
  USING (
    -- Admin CRM ve todos los de su iglesia
    (
      church_id = public.my_church_id()
      AND EXISTS (
        SELECT 1 FROM public.church_users
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    OR
    -- Consolidación y Líderes con acceso: ven visitors de su misma iglesia
    (
      EXISTS (
        SELECT 1 FROM public.personas p
        WHERE p.email ILIKE auth.jwt() ->> 'email'
          AND (
            p.rol = 'Consolidación'
            OR (p.rol = 'Líder' AND p.acceso_consolidacion = true)
          )
          AND p.church_id = visitors.church_id
      )
    )
  );

-- Política RLS: el equipo de consolidación puede actualizar visitors de su iglesia
-- (para marcar contactado, cambiar follow_up_status, guardar contacted_by, etc.)
DROP POLICY IF EXISTS "consolidacion_update_visitors" ON public.visitors;

CREATE POLICY "consolidacion_update_visitors"
  ON public.visitors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personas p
      WHERE p.email ILIKE auth.jwt() ->> 'email'
        AND (
          p.rol = 'Consolidación'
          OR (p.rol = 'Líder' AND p.acceso_consolidacion = true)
        )
        AND p.church_id = visitors.church_id
    )
  )
  WITH CHECK (true);

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
