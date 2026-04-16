-- =============================================================================
-- ver_iglesias_y_datos.sql
-- Visión completa del estado multi-iglesia para el administrador de Supabase.
--
-- Ejecutar secciones individualmente según lo que querés ver.
-- =============================================================================


-- =============================================================================
-- 1. TODAS LAS IGLESIAS REGISTRADAS
-- =============================================================================

SELECT
  id,
  name                                      AS "Nombre",
  slug                                      AS "Slug",
  custom_domain                             AS "Dominio propio",
  city                                      AS "Ciudad",
  plan,
  is_active                                 AS "Activa",
  created_at::date                          AS "Registrada"
FROM public.churches
ORDER BY created_at;


-- =============================================================================
-- 2. ADMINS DEL CRM POR IGLESIA
-- =============================================================================

SELECT
  c.name                                    AS "Iglesia",
  u.email                                   AS "Email admin",
  cu.role                                   AS "Rol",
  cu.is_active                              AS "Activo"
FROM public.church_users cu
JOIN auth.users u ON u.id = cu.user_id
JOIN public.churches c ON c.id = cu.church_id
ORDER BY c.name, cu.role;


-- =============================================================================
-- 3. RESUMEN DE PERSONAS POR IGLESIA
-- =============================================================================

SELECT
  c.name                                    AS "Iglesia",
  COUNT(*)                                  AS "Total personas",
  COUNT(*) FILTER (WHERE p.rol = 'Líder')   AS "Líderes",
  COUNT(*) FILTER (WHERE p.rol = 'Miembro') AS "Miembros",
  COUNT(*) FILTER (WHERE p.rol = 'Visitante') AS "Visitantes",
  COUNT(*) FILTER (
    WHERE p.rol = 'Líder'
    AND p.estado_aprobacion = 'pendiente'
  )                                         AS "Líderes pendientes"
FROM public.personas p
JOIN public.churches c ON c.id = p.church_id
GROUP BY c.name
ORDER BY c.name;


-- =============================================================================
-- 4. LÍDERES APROBADOS CON ACCESO AL PORTAL (tienen cuenta en Auth)
-- =============================================================================

SELECT
  c.name                                    AS "Iglesia",
  p.nombre || ' ' || p.apellido             AS "Líder",
  p.email                                   AS "Email",
  p.estado_aprobacion                       AS "Estado",
  CASE WHEN u.id IS NOT NULL THEN 'Sí' ELSE 'No' END AS "Tiene cuenta portal"
FROM public.personas p
JOIN public.churches c ON c.id = p.church_id
LEFT JOIN auth.users u ON u.email ILIKE p.email
WHERE p.rol = 'Líder'
ORDER BY c.name, p.estado_aprobacion, p.apellido;


-- =============================================================================
-- 5. VERIFICAR AISLAMIENTO: personas SIN church_id (problema de integridad)
-- =============================================================================

SELECT id, nombre, apellido, email, rol
FROM public.personas
WHERE church_id IS NULL;

-- Si devuelve filas, asignarles la iglesia correspondiente:
-- UPDATE public.personas
-- SET church_id = 'UUID-DE-LA-IGLESIA'
-- WHERE church_id IS NULL;


-- =============================================================================
-- 6. MATERIALES POR IGLESIA
-- =============================================================================

SELECT
  c.name                                    AS "Iglesia",
  lm.title                                  AS "Material",
  lm.category                               AS "Categoría",
  lm.type                                   AS "Tipo",
  lm.is_active                              AS "Visible",
  lm.created_at::date                       AS "Subido"
FROM public.leader_materials lm
JOIN public.churches c ON c.id = lm.church_id
ORDER BY c.name, lm.created_at DESC;
