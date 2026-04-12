-- =============================================================================
-- fix_rls_all_tables.sql
-- Ejecutar en Supabase → SQL Editor
--
-- Diagnóstico y corrección del aviso de Supabase:
--   "Table publicly accessible – RLS not enabled"
--
-- Causa: multitenant_migration.sql hace DROP TABLE ... CASCADE y recrea
--   `churches` (y otras tablas), borrando el RLS habilitado previamente
--   por secure_tables.sql. Tampoco re-habilita RLS en `churches`.
-- =============================================================================


-- =============================================================================
-- PASO 1 — DIAGNÓSTICO: ver qué tablas en public NO tienen RLS habilitado
-- =============================================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled, tablename;


-- =============================================================================
-- PASO 2 — HABILITAR RLS en todas las tablas que pueden estar sin él
-- =============================================================================

-- Tablas de configuración / auth
ALTER TABLE public.churches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_users ENABLE ROW LEVEL SECURITY;

-- Tablas de censo / CRM
ALTER TABLE public.personas     ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.visitors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys          ENABLE ROW LEVEL SECURITY;

-- Tablas Connect (web pública)
ALTER TABLE public.connect_services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_sermons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_devotionals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_prayer_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_counseling_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_event_registrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_daily_verses         ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- PASO 3 — POLÍTICAS para `churches`
--   Solo la service_role (backend) puede leer/escribir.
--   El middleware lee `churches` desde el servidor usando la service key,
--   así que usuarios anónimos y autenticados regulares no necesitan acceso.
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_read_churches"  ON public.churches;
DROP POLICY IF EXISTS "authenticated_full_access"    ON public.churches;
DROP POLICY IF EXISTS "service_role_full_access"     ON public.churches;

-- Usuarios autenticados pueden leer SU iglesia (para mostrar nombre/logo en UI)
-- Nota: la service_role siempre bypasea RLS, por eso no necesita política propia.
CREATE POLICY "authenticated_read_own_church"
ON public.churches
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT church_id FROM public.church_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- El anon puede leer iglesias (necesario para middleware de subdominios en el servidor
-- cuando el request todavía no tiene sesión). Si no querés esto, comentá la línea.
-- IMPORTANTE: solo expone nombre/slug/logo, no datos sensibles.
CREATE POLICY "anon_read_churches"
ON public.churches
FOR SELECT
TO anon
USING (is_active = true);


-- =============================================================================
-- PASO 4 — VERIFICACIÓN FINAL
--   Todas las filas deben mostrar rls_enabled = true
-- =============================================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled, tablename;
