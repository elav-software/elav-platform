-- =============================================================================
-- Fix: RLS para líderes del portal
--
-- Problema: my_church_id() solo funciona para usuarios CRM (en church_users).
-- Los líderes se autentican vía Google y no están en church_users, por lo que
-- my_church_id() retorna NULL y el INSERT/SELECT queda bloqueado.
--
-- Solución: nueva función helper que resuelve church_id desde personas,
-- y actualización de las políticas de leader_cell_submissions y
-- leader_prayer_requests.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Función helper: church_id del líder autenticado (busca en personas)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_leader_church_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT church_id
  FROM public.personas
  WHERE email ILIKE auth.jwt() ->> 'email'
    AND rol = 'Líder'
    AND estado_aprobacion = 'aprobado'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.my_leader_church_id IS
  'Devuelve el church_id del líder autenticado buscando en personas por email. Usado en políticas RLS del portal de líderes.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fix: política RLS de leader_cell_submissions
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "leaders_own_submissions" ON public.leader_cell_submissions;

CREATE POLICY "leaders_own_submissions" ON public.leader_cell_submissions
  FOR ALL TO authenticated
  USING (
    -- El líder ve sus propios reportes (resuelve church_id desde personas)
    (
      leader_email ILIKE auth.jwt() ->> 'email'
      AND church_id = public.my_leader_church_id()
    )
    OR
    -- Los admins CRM ven todos los reportes de su iglesia
    (
      church_id = public.my_church_id()
      AND EXISTS (
        SELECT 1 FROM public.church_users
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Solo el propio líder puede insertar/actualizar sus reportes
    leader_email ILIKE auth.jwt() ->> 'email'
    AND church_id = public.my_leader_church_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix: política RLS de leader_prayer_requests
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "leaders_prayer_access" ON public.leader_prayer_requests;

CREATE POLICY "leaders_prayer_access" ON public.leader_prayer_requests
  FOR ALL TO authenticated
  USING (
    -- El líder ve sus propios pedidos y los no confidenciales de su iglesia
    (
      church_id = public.my_leader_church_id()
      AND (
        leader_email ILIKE auth.jwt() ->> 'email'
        OR is_confidential = false
      )
    )
    OR
    -- Los admins CRM ven todos de su iglesia
    (
      church_id = public.my_church_id()
      AND EXISTS (
        SELECT 1 FROM public.church_users
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Solo el propio líder puede insertar/actualizar
    leader_email ILIKE auth.jwt() ->> 'email'
    AND church_id = public.my_leader_church_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificación rápida
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 'fix_portal_leader_rls aplicado correctamente' AS status;
