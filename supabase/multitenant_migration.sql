-- =============================================================================
-- multitenant_migration.sql
-- Convierte la app de single-tenant (CFC) a multi-iglesia (SaaS).
--
-- EJECUTAR EN ORDEN en Supabase → SQL Editor.
--
-- Pasos que hace este script:
--   1. Crea/actualiza la tabla `churches` con todos sus campos
--   2. Inserta CFC Isidro Casanova como primer tenant (church #1)
--   3. Agrega `church_id` a todas las tablas existentes
--   4. Rellena church_id en los datos existentes (todos son de CFC)
--   5. Actualiza las políticas RLS para aislamiento por iglesia
--
-- Para limpiar solo los datos de seed de otra iglesia de prueba:
--   DELETE FROM public.churches WHERE slug = 'iglesia-prueba';
-- =============================================================================


-- =============================================================================
-- PASO 1 — Tabla `churches` (tenants maestros)
-- =============================================================================

-- Limpiar tabla vieja si existe con esquema diferente
DROP TABLE IF EXISTS public.church_users CASCADE;
DROP TABLE IF EXISTS public.churches CASCADE;

CREATE TABLE IF NOT EXISTS public.churches (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- Identidad
  name              text    NOT NULL,                    -- "CFC Isidro Casanova"
  slug              text    UNIQUE NOT NULL,             -- "cfc" → cfc.iglesiasos.com
  short_name        text,                               -- "CFC CASA"
  description       text,

  -- Branding
  logo_url          text,
  primary_color     text    NOT NULL DEFAULT '#dc2626', -- rojo CFC por defecto
  secondary_color   text    NOT NULL DEFAULT '#1e293b',

  -- Dominio y acceso
  custom_domain     text    UNIQUE,                     -- "cfccasanova.com" (opcional)
  -- Si custom_domain es NULL → accede por slug.iglesiasos.com
  -- Si custom_domain está seteado → ese dominio también funciona

  -- Contacto de la iglesia
  contact_email     text,
  contact_phone     text,
  address           text,
  city              text,
  country           text    NOT NULL DEFAULT 'Argentina',
  timezone          text    NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',

  -- Plan SaaS
  plan              text    NOT NULL DEFAULT 'basic',   -- basic | pro | enterprise
  plan_expires_at   timestamptz,                        -- NULL = sin vencimiento / free
  is_active         boolean NOT NULL DEFAULT true,

  -- Módulos habilitados (control por plan)
  module_crm        boolean NOT NULL DEFAULT true,
  module_connect    boolean NOT NULL DEFAULT true,
  module_census     boolean NOT NULL DEFAULT true,
  module_donations  boolean NOT NULL DEFAULT false,     -- Pro+
  module_reports    boolean NOT NULL DEFAULT false      -- Pro+
);

COMMENT ON TABLE public.churches IS
  'Tabla maestra de tenants. Cada fila = una iglesia cliente.';


-- =============================================================================
-- PASO 2 — Insertar CFC Isidro Casanova como primer tenant
-- =============================================================================

INSERT INTO public.churches (
  name, slug, short_name, description,
  logo_url, primary_color, secondary_color,
  custom_domain, contact_email, city, country,
  plan, is_active,
  module_crm, module_connect, module_census,
  module_donations, module_reports
) VALUES (
  'CFC Isidro Casanova',
  'cfc',
  'CFC CASA',
  'Centro Familiar Cristiano Isidro Casanova',
  '/logo.png',
  '#dc2626',
  '#1e293b',
  'cfccasanova.com',
  NULL,
  'Isidro Casanova',
  'Argentina',
  'pro',
  true,
  true, true, true, true, true
)
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- PASO 3 — Agregar church_id a todas las tablas
--          Se agrega como nullable primero, se rellena, luego se hace NOT NULL
-- =============================================================================

-- ── personas (censo + CRM members) ─────────────────────────────────────────
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

-- ── tablas CRM ──────────────────────────────────────────────────────────────
ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.event_attendance
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.leaders
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.cell_members
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.cell_reports
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.ministries
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.volunteers
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

-- ── tablas Connect (web pública) ─────────────────────────────────────────────
ALTER TABLE public.connect_services
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_sermons
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_devotionals
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_events
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_announcements
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_prayer_requests
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_counseling_requests
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_event_registrations
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.connect_daily_verses
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE;


-- =============================================================================
-- PASO 4 — Rellenar church_id en todos los datos existentes (todos son CFC)
-- =============================================================================

DO $$
DECLARE
  cfc_id uuid;
BEGIN
  SELECT id INTO cfc_id FROM public.churches WHERE slug = 'cfc';

  IF cfc_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la iglesia CFC. Verificar el INSERT del paso 2.';
  END IF;

  -- personas
  UPDATE public.personas            SET church_id = cfc_id WHERE church_id IS NULL;

  -- CRM
  UPDATE public.visitors            SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.donations           SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.events              SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.event_attendance    SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.leaders             SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.cell_members        SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.cell_reports        SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.ministries          SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.volunteers          SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.prayer_requests     SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.surveys             SET church_id = cfc_id WHERE church_id IS NULL;

  -- Connect
  UPDATE public.connect_services            SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_sermons             SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_devotionals         SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_events              SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_announcements       SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_prayer_requests     SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_counseling_requests SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_event_registrations SET church_id = cfc_id WHERE church_id IS NULL;
  UPDATE public.connect_daily_verses        SET church_id = cfc_id WHERE church_id IS NULL;

  RAISE NOTICE 'church_id de CFC (%) asignado a todos los registros existentes.', cfc_id;
END $$;


-- =============================================================================
-- PASO 5 — Hacer church_id NOT NULL (ahora que todos los datos están rellenos)
-- =============================================================================

ALTER TABLE public.personas                   ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.visitors                   ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.donations                  ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.events                     ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.event_attendance           ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.leaders                    ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.cell_members               ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.cell_reports               ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.ministries                 ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.volunteers                 ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.prayer_requests            ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.surveys                    ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_services           ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_sermons            ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_devotionals        ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_events             ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_announcements      ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_prayer_requests    ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_counseling_requests ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_event_registrations ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.connect_daily_verses       ALTER COLUMN church_id SET NOT NULL;


-- =============================================================================
-- PASO 6 — Índices de performance (church_id es el filtro más frecuente)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_personas_church                    ON public.personas (church_id);
CREATE INDEX IF NOT EXISTS idx_visitors_church                    ON public.visitors (church_id);
CREATE INDEX IF NOT EXISTS idx_donations_church                   ON public.donations (church_id);
CREATE INDEX IF NOT EXISTS idx_events_church                      ON public.events (church_id);
CREATE INDEX IF NOT EXISTS idx_leaders_church                     ON public.leaders (church_id);
CREATE INDEX IF NOT EXISTS idx_ministries_church                  ON public.ministries (church_id);
CREATE INDEX IF NOT EXISTS idx_connect_services_church            ON public.connect_services (church_id);
CREATE INDEX IF NOT EXISTS idx_connect_sermons_church             ON public.connect_sermons (church_id);
CREATE INDEX IF NOT EXISTS idx_connect_devotionals_church         ON public.connect_devotionals (church_id);
CREATE INDEX IF NOT EXISTS idx_connect_events_church              ON public.connect_events (church_id);
CREATE INDEX IF NOT EXISTS idx_connect_announcements_church       ON public.connect_announcements (church_id);


-- =============================================================================
-- PASO 7 — Tabla de usuarios CRM (vincula auth.users con su iglesia y rol)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.church_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  church_id   uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'admin',   -- 'admin' | 'staff' (futuro)
  is_active   boolean NOT NULL DEFAULT true,
  UNIQUE (church_id, user_id)
);

COMMENT ON TABLE public.church_users IS
  'Vincula usuarios de Supabase Auth con una iglesia y su rol dentro de ella.';

CREATE INDEX IF NOT EXISTS idx_church_users_user ON public.church_users (user_id);
CREATE INDEX IF NOT EXISTS idx_church_users_church ON public.church_users (church_id);

-- Habilitar RLS en church_users
ALTER TABLE public.church_users ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden leer su propio registro (necesario para login)
CREATE POLICY "authenticated_read_own_church_user" 
ON public.church_users
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Los admins pueden leer todos los usuarios de su iglesia
CREATE POLICY "admin_read_church_users"
ON public.church_users
FOR SELECT
TO authenticated
USING (
  church_id IN (
    SELECT church_id FROM public.church_users 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Los admins pueden insertar nuevos usuarios en su iglesia
CREATE POLICY "admin_insert_church_users"
ON public.church_users
FOR INSERT
TO authenticated
WITH CHECK (
  church_id IN (
    SELECT church_id FROM public.church_users 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Los admins pueden actualizar usuarios de su iglesia
CREATE POLICY "admin_update_church_users"
ON public.church_users
FOR UPDATE
TO authenticated
USING (
  church_id IN (
    SELECT church_id FROM public.church_users 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  )
);


-- =============================================================================
-- PASO 8 — Migrar admin de CFC: vincular el usuario admin existente
--          Reemplazar el email con el real de tu cuenta admin de CFC
-- =============================================================================

DO $$
DECLARE
  cfc_id    uuid;
  admin_uid uuid;
  admin_email text;
BEGIN
  SELECT id INTO cfc_id FROM public.churches WHERE slug = 'cfc';

  -- Vincular múltiples admins de CFC
  -- Agregá o quitá emails según necesites
  FOR admin_email IN 
    SELECT unnest(ARRAY[
      'developing@cfccasanova.com',
      'jonapereda@cfccasanova.com'
      -- Agregá más emails aquí si querés
    ])
  LOOP
    SELECT id INTO admin_uid
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_uid IS NOT NULL AND cfc_id IS NOT NULL THEN
      INSERT INTO public.church_users (church_id, user_id, role, is_active)
      VALUES (cfc_id, admin_uid, 'admin', true)
      ON CONFLICT (church_id, user_id) DO NOTHING;
      RAISE NOTICE 'Admin vinculado: %', admin_email;
    ELSE
      RAISE NOTICE 'No existe usuario con email: % (crear en Supabase Auth primero)', admin_email;
    END IF;
  END LOOP;
END $$;


-- =============================================================================
-- PASO 9 — Actualizar RLS para aislamiento por iglesia
--
-- Estrategia:
--   • Para la web pública (connect_*): cualquiera puede leer filtrando por church_id
--   • Para el CRM y personas: solo usuarios autenticados que pertenezcan a esa iglesia
-- =============================================================================

-- Función helper: devuelve el church_id del usuario autenticado actual
CREATE OR REPLACE FUNCTION public.my_church_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT church_id
  FROM public.church_users
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.my_church_id IS
  'Devuelve el church_id del usuario CRM autenticado. Usado en políticas RLS.';


-- ── personas ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_insert_personas"        ON public.personas;
DROP POLICY IF EXISTS "authenticated_read_personas"   ON public.personas;
DROP POLICY IF EXISTS "authenticated_update_personas" ON public.personas;
DROP POLICY IF EXISTS "authenticated_delete_personas" ON public.personas;

-- Cualquiera puede insertar (formulario censo público), pero con church_id correcto
CREATE POLICY "public_insert_personas" ON public.personas
  FOR INSERT
  WITH CHECK (true);

-- Solo el CRM de la misma iglesia puede leer/editar/borrar
CREATE POLICY "church_read_personas" ON public.personas
  FOR SELECT TO authenticated
  USING (church_id = public.my_church_id());

CREATE POLICY "church_update_personas" ON public.personas
  FOR UPDATE TO authenticated
  USING (church_id = public.my_church_id());

CREATE POLICY "church_delete_personas" ON public.personas
  FOR DELETE TO authenticated
  USING (church_id = public.my_church_id());


-- ── CRM tables (visitors, donations, events, leaders, etc.) ──────────────────
DO $$
DECLARE
  tbl text;
  crm_tables text[] := ARRAY[
    'visitors','donations','events','event_attendance',
    'leaders','cell_members','cell_reports',
    'ministries','volunteers','prayer_requests','surveys'
  ];
BEGIN
  FOREACH tbl IN ARRAY crm_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_full_access" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "church_full_access" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "church_full_access" ON public.%I
       FOR ALL TO authenticated
       USING (church_id = public.my_church_id())
       WITH CHECK (church_id = public.my_church_id())',
      tbl
    );
  END LOOP;
END $$;


-- ── connect_* (web pública): acceso público filtrado por church_id ────────────
-- Cualquier visitante puede leer el contenido de SU iglesia
-- El church_id se pasa desde el frontend como filtro en la query

DO $$
DECLARE
  tbl text;
  pub_tables text[] := ARRAY[
    'connect_services','connect_sermons','connect_devotionals',
    'connect_events','connect_announcements','connect_daily_verses'
  ];
BEGIN
  FOREACH tbl IN ARRAY pub_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_read_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "public_read_%s" ON public.%I
       FOR SELECT USING (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Prayer requests connect: insertar con church_id del formulario
DROP POLICY IF EXISTS "public_insert_prayer_requests"  ON public.connect_prayer_requests;
DROP POLICY IF EXISTS "public_update_prayer_count"     ON public.connect_prayer_requests;
CREATE POLICY "public_insert_prayer_requests" ON public.connect_prayer_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_connect_prayer_requests" ON public.connect_prayer_requests
  FOR SELECT USING (is_public = true AND status = 'active');
CREATE POLICY "public_update_prayer_count" ON public.connect_prayer_requests
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_counseling" ON public.connect_counseling_requests;
CREATE POLICY "public_insert_counseling" ON public.connect_counseling_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_registrations" ON public.connect_event_registrations;
CREATE POLICY "public_insert_registrations" ON public.connect_event_registrations
  FOR INSERT WITH CHECK (true);


-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================

SELECT
  'churches'  AS tabla, count(*) AS registros FROM public.churches
UNION ALL
SELECT 'church_users', count(*) FROM public.church_users
UNION ALL
SELECT 'personas con church_id', count(*) FROM public.personas WHERE church_id IS NOT NULL
UNION ALL
SELECT 'connect_sermons con church_id', count(*) FROM public.connect_sermons WHERE church_id IS NOT NULL;
