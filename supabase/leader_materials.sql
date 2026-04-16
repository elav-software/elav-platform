-- Tabla de materiales para líderes
CREATE TABLE IF NOT EXISTS public.leader_materials (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id     uuid REFERENCES public.churches(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  category      text,         -- 'estudio', 'planilla', 'recurso', etc.
  type          text,         -- 'pdf', 'document', 'link', 'other'
  url           text NOT NULL, -- URL firmada o URL externa
  file_path     text,         -- path en Storage (ej: church_id/filename.pdf)
  file_size     bigint,       -- tamaño en bytes
  uploaded_by   uuid REFERENCES auth.users(id),
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.leader_materials ENABLE ROW LEVEL SECURITY;

-- Admin del CRM puede hacer todo
CREATE POLICY "admin puede gestionar materiales"
  ON public.leader_materials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.church_users
      WHERE user_id = auth.uid()
        AND church_id = leader_materials.church_id
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Líderes aprobados pueden leer materiales de su iglesia
CREATE POLICY "lideres aprobados pueden ver materiales"
  ON public.leader_materials
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.personas
      WHERE church_id = leader_materials.church_id
        AND email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid())
        AND rol = 'Líder'
        AND estado_aprobacion = 'aprobado'
    )
  );

-- RLS del Storage bucket "materiales"
-- Ejecutar en SQL Editor (las policies de storage van en storage.objects)

-- Admin puede subir/borrar archivos
CREATE POLICY "admin puede subir materiales"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'materiales' AND
    EXISTS (
      SELECT 1 FROM public.church_users
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "admin puede borrar materiales"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'materiales' AND
    EXISTS (
      SELECT 1 FROM public.church_users
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Líderes aprobados pueden descargar (SELECT = leer el objeto)
CREATE POLICY "lideres pueden descargar materiales"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'materiales' AND
    EXISTS (
      SELECT 1 FROM public.personas p
      JOIN auth.users u ON u.email ILIKE p.email
      WHERE u.id = auth.uid()
        AND p.rol = 'Líder'
        AND p.estado_aprobacion = 'aprobado'
    )
  );
