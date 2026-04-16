-- =============================================================================
-- material_views.sql
-- Registra qué materiales ya vio cada líder para mostrar el badge "nuevo".
--
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leader_material_views (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  material_id uuid REFERENCES public.leader_materials(id) ON DELETE CASCADE NOT NULL,
  viewed_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, material_id)
);

ALTER TABLE public.leader_material_views ENABLE ROW LEVEL SECURITY;

-- Cada líder solo puede ver y registrar sus propias vistas
CREATE POLICY "usuarios gestionan sus propias vistas"
  ON public.leader_material_views
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
