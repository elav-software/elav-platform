-- =============================================================================
-- dev-setup.sql
-- GUÍA PARA CONFIGURAR EL ENTORNO DE DESARROLLO LOCAL
--
-- Abrir esta guía en VS Code y seguir los pasos.
-- Cada bloque SQL se pega y ejecuta individualmente en el SQL Editor de Supabase.
--
-- ⚠️  NO ejecutar en producción.
-- =============================================================================
--
-- PRE-REQUISITO: Ya creaste el proyecto "censo-iglesia-dev" en supabase.com
--
-- FLUJO GENERAL:
--   1. Crear el proyecto dev en Supabase
--   2. Configurar .env.local con las credenciales dev
--   3. Ejecutar los SQL en el SQL Editor (en orden)
--   4. Crear el bucket de Storage
--   5. Crear usuario de prueba
--   6. Correr la app: npm run dev
--
-- =============================================================================


-- =============================================================================
-- PASO A — Configurar .env.local
-- =============================================================================
-- (No es SQL — es configuración)
--
-- En Supabase Dashboard del proyecto DEV:
--   → Settings → API → copiá "Project URL" y "anon public"
--
-- En tu editor, abrir .env.local y reemplazar los valores:
--
--   NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto-dev>.supabase.co
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-dev>
--   SUPABASE_SERVICE_ROLE_KEY=<service-role-key-dev>
--   NEXT_PUBLIC_DEFAULT_CHURCH_SLUG=cfc
--   SUPERADMIN_SECRET=<cualquier-string-largo-para-dev>
--
-- Los valores de producción están guardados en el dashboard de Vercel.
-- No hace falta hacer nada con ellos.


-- =============================================================================
-- PASO 1 — Tabla base: personas
-- Supabase SQL Editor → New query → pegar 00_personas_table.sql → Run
-- =============================================================================
-- (ver archivo: supabase/00_personas_table.sql)


-- =============================================================================
-- PASO 2 — Tablas del CRM (visitors, events, leaders, etc.)
-- Supabase SQL Editor → New query → pegar crm_tables.sql → Run
-- =============================================================================
-- (ver archivo: supabase/crm_tables.sql)


-- =============================================================================
-- PASO 3 — Tablas de Connect (web pública)
-- Supabase SQL Editor → New query → pegar connect_tables.sql → Run
-- =============================================================================
-- (ver archivo: supabase/connect_tables.sql)


-- =============================================================================
-- PASO 4 — Multi-tenant: churches, church_users, church_id en todas las tablas
-- Supabase SQL Editor → New query → pegar multitenant_migration.sql → Run
-- =============================================================================
-- (ver archivo: supabase/multitenant_migration.sql)
-- ⚠️  Este script crea la iglesia "cfc" automáticamente.


-- =============================================================================
-- PASO 5 — Portal de líderes (aprobación, materiales, reportes de célula)
-- Supabase SQL Editor → New query → pegar portal_lideres.sql → Run
-- =============================================================================
-- (ver archivo: supabase/portal_lideres.sql)


-- =============================================================================
-- PASO 6 — Materiales para líderes
-- Supabase SQL Editor → New query → pegar leader_materials.sql → Run
-- =============================================================================
-- (ver archivo: supabase/leader_materials.sql)


-- =============================================================================
-- PASO 7 — Consolidación (columna acceso_consolidacion + políticas RLS)
-- Supabase SQL Editor → New query → pegar setup_consolidacion.sql → Run
-- =============================================================================
-- (ver archivo: supabase/setup_consolidacion.sql)


-- =============================================================================
-- PASO 8 — Seguridad base (RLS en personas y otras tablas)
-- Supabase SQL Editor → New query → pegar secure_tables.sql → Run
-- =============================================================================
-- (ver archivo: supabase/secure_tables.sql)


-- =============================================================================
-- PASO 9 — Foto de perfil: columna foto_url en personas
-- Supabase SQL Editor → New query → pegar add_foto_url.sql → Run
-- =============================================================================
-- (ver archivo: supabase/add_foto_url.sql)


-- =============================================================================
-- PASO 10 — Rol superadmin (estructura)
-- Supabase SQL Editor → New query → ejecutar este bloque:
-- =============================================================================

ALTER TABLE public.church_users
  DROP CONSTRAINT IF EXISTS church_users_role_check;

ALTER TABLE public.church_users
  ADD CONSTRAINT church_users_role_check
  CHECK (role IN ('admin', 'user', 'superadmin', 'consolidacion'));

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_users
    WHERE user_id = auth.uid()
      AND role = 'superadmin'
      AND is_active = true
  );
$$;

-- ⚠️  Eliminar la política recursiva que causa error 42P17:
--     admin_read_church_users consulta church_users dentro de una policy de church_users → loop infinito.
--     La política authenticated_read_own_church_user es suficiente para el login.
DROP POLICY IF EXISTS "admin_read_church_users" ON public.church_users;


-- =============================================================================
-- PASO 11 — Bucket de Storage para fotos de líderes
-- =============================================================================
-- (No es SQL — hacerlo en el Dashboard)
--
-- Supabase Dashboard → Storage → New bucket
--   Nombre:  leader-photos
--   Public:  ✅ ON
--
-- Después, pegar y ejecutar las políticas de storage de add_foto_url.sql


-- =============================================================================
-- PASO 12 — Datos de prueba (opcional pero recomendado)
-- Supabase SQL Editor → New query → pegar seed_personas.sql → Run
-- =============================================================================
-- (ver archivo: supabase/seed_personas.sql)
-- Crea 10 líderes + 30 miembros de prueba.
-- Para borrarlos: DELETE FROM public.personas WHERE email LIKE '%@seed.test';


-- =============================================================================
-- PASO 13 — Crear usuario de prueba (admin del CRM)
-- =============================================================================
-- (No es SQL — hacerlo en el Dashboard)
--
-- Supabase Dashboard → Auth → Users → "Add user" / "Invite user"
--   Email: admin@test.com
--   Password: cualquier contraseña de prueba
--
-- Copiar el UUID que Supabase genera para ese usuario y ejecutar:

-- INSERT INTO public.church_users (user_id, church_id, role, is_active)
-- SELECT
--   'REEMPLAZAR-CON-UUID-DEL-USUARIO',   -- ← pegar aquí el UUID de Auth
--   id,
--   'admin',
--   true
-- FROM public.churches
-- WHERE slug = 'cfc';


-- =============================================================================
-- ✅ ¡LISTO! El entorno de desarrollo está configurado.
-- =============================================================================
-- 
-- Iniciá la app:
--   npm run dev
--
-- URLs disponibles en local:
--   → http://localhost:3000/landing/index.html   ← Landing pública
--   → http://localhost:3000/crm/login            ← CRM (admin)
--   → http://localhost:3000/lider                ← Formulario de líderes
--   → http://localhost:3000/miembros             ← Formulario de miembros
--   → http://localhost:3000/connect/portal/login ← Portal de líderes
--
-- =============================================================================
-- FLUJO DE TRABAJO: DEV → PRODUCCIÓN
-- =============================================================================
--
-- 1. Trabajás en tu rama local (dev/portal u otra)
--    → La app apunta al proyecto Supabase "desarrollo" (via .env.local)
--    → Podés crear, borrar y modificar datos sin afectar a nadie
--
-- 2. Cuando terminás, hacés un Pull Request a main en GitHub
--    → NO tenés que cambiar nada en el .env.local
--    → NO tenés que tocar las variables de Vercel
--
-- 3. Vercel detecta el merge a main y despliega automáticamente
--    → Vercel usa sus propias variables de entorno (las de producción)
--    → .env.local NUNCA se sube al repo (está en .gitignore)
--    → La app en producción apunta al Supabase real de CFC
--
-- Resumen:
--   local   → .env.local         → Supabase "desarrollo" (datos de prueba)
--   Vercel  → env vars de Vercel → Supabase "cfc" (datos reales)
--
-- =============================================================================

