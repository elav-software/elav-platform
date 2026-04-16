-- =============================================================================
-- convertir_a_admin.sql
-- Da acceso de administrador del CRM a un usuario existente en auth.users.
--
-- USO:
--   1. Ejecutá la consulta de búsqueda para encontrar el usuario
--   2. Copiá el `id` del usuario y el `id` de la iglesia
--   3. Ejecutá el INSERT o UPDATE según corresponda
-- =============================================================================


-- =============================================================================
-- PASO 1 — Encontrar el usuario por email
-- =============================================================================

SELECT id, email, created_at
FROM auth.users
WHERE email ILIKE 'REEMPLAZAR-CON-EMAIL@ejemplo.com';


-- =============================================================================
-- PASO 2 — Encontrar el church_id de tu iglesia
-- =============================================================================

SELECT id, name, slug, custom_domain
FROM public.churches
WHERE is_active = true;


-- =============================================================================
-- PASO 3A — Dar acceso admin (si el usuario NO está todavía en church_users)
-- =============================================================================

INSERT INTO public.church_users (user_id, church_id, role, is_active)
VALUES (
  'REEMPLAZAR-CON-UUID-DEL-USUARIO',   -- id de auth.users
  'REEMPLAZAR-CON-UUID-DE-LA-IGLESIA', -- id de churches
  'admin',
  true
);


-- =============================================================================
-- PASO 3B — Actualizar rol a admin (si el usuario YA está en church_users)
-- =============================================================================

-- UPDATE public.church_users
-- SET role = 'admin', is_active = true
-- WHERE user_id = 'REEMPLAZAR-CON-UUID-DEL-USUARIO'
--   AND church_id = 'REEMPLAZAR-CON-UUID-DE-LA-IGLESIA';


-- =============================================================================
-- PASO 3C — Revocar acceso admin (dejar sin acceso al CRM)
-- =============================================================================

-- UPDATE public.church_users
-- SET is_active = false
-- WHERE user_id = 'REEMPLAZAR-CON-UUID-DEL-USUARIO'
--   AND church_id = 'REEMPLAZAR-CON-UUID-DE-LA-IGLESIA';


-- =============================================================================
-- VERIFICACIÓN — Ver todos los admins de una iglesia
-- =============================================================================

-- SELECT u.email, cu.role, cu.is_active, cu.created_at
-- FROM public.church_users cu
-- JOIN auth.users u ON u.id = cu.user_id
-- WHERE cu.church_id = 'REEMPLAZAR-CON-UUID-DE-LA-IGLESIA'
-- ORDER BY cu.role, u.email;

-- Convierte personas existentes (Miembro / Visitante / sin rol) a Líder.
--
-- USO:
--   1. Buscá el email o nombre de la persona en la tabla personas
--   2. Copiá su `id` (uuid)
--   3. Reemplazá el valor en la variable de abajo
--   4. Ejecutá en Supabase → SQL Editor
--
-- NOTA: Este script solo cambia el rol y estado_aprobacion en `personas`.
--       No crea ni modifica usuarios en auth.users.
--       Para invitar al portal, usá el botón "Invitar al Portal" en el CRM.
-- =============================================================================


-- =============================================================================
-- OPCIÓN A: Convertir UNA persona específica por ID
-- =============================================================================

-- 1. Primero verificá quién es:
SELECT id, nombre, apellido, email, rol, estado_aprobacion, church_id
FROM public.personas
WHERE id = 'REEMPLAZAR-CON-UUID-DE-LA-PERSONA';

-- 2. Convertir a líder pendiente de aprobación (el pastor la aprueba desde el CRM):
UPDATE public.personas
SET
  rol               = 'Líder',
  estado_aprobacion = 'pendiente'
WHERE id = 'REEMPLAZAR-CON-UUID-DE-LA-PERSONA';

-- 3. O convertir directamente a líder aprobado (sin pasar por aprobación):
-- UPDATE public.personas
-- SET
--   rol               = 'Líder',
--   estado_aprobacion = 'aprobado',
--   fecha_aprobacion  = now()
-- WHERE id = 'REEMPLAZAR-CON-UUID-DE-LA-PERSONA';


-- =============================================================================
-- OPCIÓN B: Convertir UNA persona por email
-- =============================================================================

-- UPDATE public.personas
-- SET
--   rol               = 'Líder',
--   estado_aprobacion = 'aprobado',
--   fecha_aprobacion  = now()
-- WHERE email ILIKE 'correo@ejemplo.com'
--   AND church_id = 'REEMPLAZAR-CON-UUID-DE-LA-IGLESIA';


-- =============================================================================
-- OPCIÓN C: Convertir VARIOS de una lista de emails
-- =============================================================================

-- UPDATE public.personas
-- SET
--   rol               = 'Líder',
--   estado_aprobacion = 'aprobado',
--   fecha_aprobacion  = now()
-- WHERE email ILIKE ANY(ARRAY[
--   'lider1@gmail.com',
--   'lider2@hotmail.com',
--   'lider3@outlook.com'
-- ])
-- AND church_id = 'REEMPLAZAR-CON-UUID-DE-LA-IGLESIA';


-- =============================================================================
-- CÓMO OBTENER EL church_id DE TU IGLESIA
-- =============================================================================

-- SELECT id, name, slug, custom_domain
-- FROM public.churches
-- WHERE is_active = true;


-- =============================================================================
-- VERIFICACIÓN FINAL: ver todos los líderes de tu iglesia
-- =============================================================================

-- SELECT nombre, apellido, email, estado_aprobacion, fecha_aprobacion
-- FROM public.personas
-- WHERE rol = 'Líder'
--   AND church_id = 'REEMPLAZAR-CON-UUID-DE-LA-IGLESIA'
-- ORDER BY estado_aprobacion, apellido;
