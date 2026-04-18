-- fix_cell_submissions_rls.sql
-- Permite que admins y superadmins actualicen el status de reportes de célula
-- El caso superadmin usa JWT metadata en lugar de church_users

DROP POLICY IF EXISTS "admin_update_cell_submissions" ON public.leader_cell_submissions;

CREATE POLICY "admin_update_cell_submissions"
  ON public.leader_cell_submissions
  FOR UPDATE
  TO authenticated
  USING (
    church_id = public.my_church_id()
    AND (
      EXISTS (
        SELECT 1 FROM public.church_users
        WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin') AND is_active = true
      )
      OR
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
    )
  );
