--=============================================================================
-- Portal de Líderes — Extensión multi-tenant
-- 
-- Nuevas funcionalidades:
--   1. Estado de aprobación de líderes (pendiente/aprobado/rechazado)
--   2. Materiales exclusivos para líderes
--   3. Reportes de célula que envían los líderes
--   4. Pedidos de oración gestionados por líderes
-- 
-- Ejecutar DESPUÉS de multitenant_migration.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Agregar estado de aprobación a la tabla personas
-- ─────────────────────────────────────────────────────────────────────────────

-- Agregar columna si no existe
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS estado_aprobacion text DEFAULT 'pendiente'
    CHECK (estado_aprobacion IN ('pendiente', 'aprobado', 'rechazado'));

ALTER TABLE public.personas  
  ADD COLUMN IF NOT EXISTS fecha_aprobacion timestamptz;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS aprobado_por uuid REFERENCES auth.users(id);

-- Índice para búsquedas rápidas de líderes pendientes
CREATE INDEX IF NOT EXISTS idx_personas_estado_aprobacion 
  ON public.personas (church_id, rol, estado_aprobacion) 
  WHERE rol = 'Líder';

COMMENT ON COLUMN public.personas.estado_aprobacion IS 
  'Estado de aprobación para líderes. Valores: pendiente (default), aprobado (puede acceder portal), rechazado';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabla de materiales para líderes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leader_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Información del material
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('pdf', 'video', 'link', 'document')),
  url text NOT NULL,  -- URL del archivo en Supabase Storage o link externo
  
  -- Control de acceso
  is_active boolean NOT NULL DEFAULT true,
  category text,  -- 'capacitacion', 'recursos', 'liturgia', etc.
  
  -- Quién lo creó
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_leader_materials_church 
  ON public.leader_materials (church_id, is_active);

COMMENT ON TABLE public.leader_materials IS 
  'Materiales exclusivos para líderes aprobados (PDFs, videos, links)';

-- RLS: Solo admins pueden crear/editar, líderes aprobados pueden ver
ALTER TABLE public.leader_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_materials" ON public.leader_materials
  FOR ALL TO authenticated
  USING (church_id = public.my_church_id())
  WITH CHECK (church_id = public.my_church_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tabla de reportes de célula enviados por líderes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leader_cell_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Quién envía el reporte (líder)
  leader_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  leader_email text NOT NULL,  -- Email con el que se loguea (Google)
  
  -- Fecha del reporte
  report_date date NOT NULL,
  
  -- Datos del reporte
  attendance_count int NOT NULL DEFAULT 0,
  new_visitors int DEFAULT 0,
  offering_amount decimal(10,2),
  testimonies text,
  prayer_requests text,
  observations text,
  
  -- Estado del reporte
  status text NOT NULL DEFAULT 'submitted' 
    CHECK (status IN ('submitted', 'reviewed', 'archived')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_leader_submissions_church 
  ON public.leader_cell_submissions (church_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_leader_submissions_leader 
  ON public.leader_cell_submissions (leader_id, report_date DESC);

COMMENT ON TABLE public.leader_cell_submissions IS 
  'Reportes de célula enviados por líderes desde el portal';

-- RLS: Líderes ven solo los suyos, admins ven todos de su iglesia
ALTER TABLE public.leader_cell_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_own_submissions" ON public.leader_cell_submissions
  FOR ALL TO authenticated
  USING (
    church_id = public.my_church_id() AND
    (leader_email = auth.jwt()->>'email' OR  -- El líder ve los suyos
     EXISTS (SELECT 1 FROM public.church_users WHERE user_id = auth.uid() AND role = 'admin'))  -- Admins ven todos
  )
  WITH CHECK (
    church_id = public.my_church_id() AND
    leader_email = auth.jwt()->>'email'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Tabla de pedidos de oración del portal de líderes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leader_prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Quién carga el pedido (líder)
  submitted_by_leader uuid REFERENCES public.personas(id),
  leader_email text NOT NULL,
  
  -- Información del pedido
  prayer_for text NOT NULL,  -- Nombre de la persona por quien se ora
  request_text text NOT NULL,
  category text,  -- 'salud', 'familia', 'trabajo', 'ministerio', etc.
  
  -- Estado
  status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'answered', 'archived')),
  answered_testimony text,
  
  -- Privacidad
  is_urgent boolean DEFAULT false,
  is_confidential boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_leader_prayers_church 
  ON public.leader_prayer_requests (church_id, status, created_at DESC);

COMMENT ON TABLE public.leader_prayer_requests IS 
  'Pedidos de oración cargados por líderes desde el portal';

-- RLS: Líderes ven solo los suyos (y los no confidenciales), admins ven todos
ALTER TABLE public.leader_prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_prayer_access" ON public.leader_prayer_requests
  FOR ALL TO authenticated
  USING (
    church_id = public.my_church_id() AND
    (
      leader_email = auth.jwt()->>'email' OR  -- El líder ve los suyos
      is_confidential = false OR  -- Todos ven los no confidenciales
      EXISTS (SELECT 1 FROM public.church_users WHERE user_id = auth.uid() AND role = 'admin')  -- Admins ven todos
    )
  )
  WITH CHECK (
    church_id = public.my_church_id() AND
    leader_email = auth.jwt()->>'email'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Función helper para verificar si un usuario es líder aprobado
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_approved_leader(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.personas
    WHERE email = user_email
      AND rol = 'Líder'
      AND estado_aprobacion = 'aprobado'
      AND church_id = public.my_church_id()
  );
$$;

COMMENT ON FUNCTION public.is_approved_leader IS 
  'Verifica si un email pertenece a un líder aprobado de la iglesia actual';

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 
  'personas.estado_aprobacion' AS modificacion,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personas' AND column_name = 'estado_aprobacion'
  ) THEN '✓ Columna agregada' ELSE '✗ Falta columna' END AS status
UNION ALL
SELECT 
  'leader_materials',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leader_materials')
  THEN '✓ Tabla creada' ELSE '✗ Falta tabla' END
UNION ALL
SELECT 
  'leader_cell_submissions',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leader_cell_submissions')
  THEN '✓ Tabla creada' ELSE '✗ Falta tabla' END
UNION ALL
SELECT 
  'leader_prayer_requests',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leader_prayer_requests')
  THEN '✓ Tabla creada' ELSE '✗ Falta tabla' END;
