-- =============================================================================
-- fix_leader_foto_update.sql
-- Permite al líder autenticado actualizar su propia foto_url en personas
--
-- Problema: sin esta política, el UPDATE en personas desde el portal falla
-- silenciosamente y la foto no se guarda en la base de datos.
-- =============================================================================

-- Política: el líder puede actualizar solo su propia foto_url
DROP POLICY IF EXISTS "leader_update_own_foto" ON public.personas;

CREATE POLICY "leader_update_own_foto"
  ON public.personas
  FOR UPDATE
  TO authenticated
  USING (
    email ILIKE auth.jwt() ->> 'email'
    AND rol = 'Líder'
    AND estado_aprobacion = 'aprobado'
  )
  WITH CHECK (
    email ILIKE auth.jwt() ->> 'email'
    AND rol = 'Líder'
    AND estado_aprobacion = 'aprobado'
  );

-- Verificación
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'personas' AND policyname = 'leader_update_own_foto';
