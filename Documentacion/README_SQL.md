# Documentación de Scripts SQL — Supabase

Todos los archivos están en la carpeta `/supabase/`. Se ejecutan en el **SQL Editor** de Supabase.

---

## Orden de ejecución inicial (setup desde cero)

```
1. crm_tables.sql
2. connect_tables.sql
3. secure_tables.sql
4. multitenant_migration.sql
5. portal_lideres.sql
```

---

## Archivos principales

### `crm_tables.sql`
**Propósito:** Crea todas las tablas del CRM.

Tablas que crea:
| Tabla | Descripción |
|-------|-------------|
| `visitors` | Visitantes registrados en la iglesia |
| `donations` | Donaciones y diezmos |
| `events` | Eventos de la iglesia |
| `event_attendance` | Asistencia a eventos |
| `leaders` | Líderes de célula aprobados |
| `cell_members` | Miembros de cada célula |
| `cell_reports` | Reportes legacy de células |
| `ministries` | Ministerios de la iglesia |
| `volunteers` | Voluntarios por ministerio |
| `prayer_requests` | Pedidos de oración del CRM |
| `surveys` | Encuestas de satisfacción |

---

### `connect_tables.sql`
**Propósito:** Crea las tablas de contenido para la app pública Connect.

Tablas que crea:
| Tabla | Descripción |
|-------|-------------|
| `connect_services` | Cultos (live y grabados) |
| `connect_sermons` | Sermones con link a YouTube |
| `connect_devotionals` | Devocionales diarios |
| `connect_events` | Eventos públicos de la iglesia |
| `connect_announcements` | Anuncios y noticias |
| `connect_daily_verses` | Versículo del día |
| `connect_prayer_requests` | Pedidos de oración públicos |
| `connect_counseling_requests` | Solicitudes de consejería |
| `connect_event_registrations` | Registros a eventos |

---

### `secure_tables.sql`
**Propósito:** Habilita RLS (Row Level Security) en las tablas originales.

> ⚠️ **OBSOLETO parcialmente** — Las políticas que aplica son `using (true)` sin filtro de `church_id`. Fue reemplazado por las políticas en `multitenant_migration.sql`. No ejecutar sobre una BD ya migrada.

Lo que hace:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en personas, cells, churches, users, etc.
- Crea políticas básicas: insert público, read/update/delete solo autenticados

---

### `multitenant_migration.sql`
**Propósito:** Migración principal a arquitectura multi-iglesia (SaaS). Es el script más importante.

Pasos que ejecuta:
1. Crea tabla `churches` con todos los campos (nombre, slug, dominio, colores, plan, módulos)
2. Inserta **CFC Isidro Casanova** como primer tenant
3. Agrega columna `church_id` a todas las tablas existentes
4. Migra todos los datos existentes al `church_id` de CFC
5. Crea tabla `church_users` (vincula admins con su iglesia)
6. Crea función `my_church_id()` — devuelve el church_id del usuario logueado
7. Actualiza todas las políticas RLS para aislamiento por iglesia
8. Vincula admins de CFC (`developing@cfccasanova.com`, `jonapereda@cfccasanova.com`)

> ✅ Este script ya fue ejecutado. La función `my_church_id()` es SECURITY DEFINER y es la base de toda la seguridad multi-tenant.

---

### `portal_lideres.sql`
**Propósito:** Extiende la BD con funcionalidades del Portal de Líderes.

Lo que hace:
1. Agrega a `personas`: `estado_aprobacion`, `fecha_aprobacion`, `aprobado_por`
2. Crea tabla `leader_materials` — materiales exclusivos para líderes
3. Crea tabla `leader_cell_submissions` — reportes de célula enviados por líderes
4. Crea tabla `leader_prayer_requests` — pedidos de oración del portal

---

## Archivos de utilidad / fixes

### `vincular_usuarios.sql`
**Propósito:** Script de testing — inserta 10 líderes pendientes + 20 miembros ya vinculados para probar el flujo completo de aprobación.

Úsalo cuando necesites datos de prueba. Detecta automáticamente el `church_id` de CFC.

---

### `seed_personas.sql`
**Propósito:** Script de seed alternativo para poblar la tabla `personas` con datos de prueba.

---

### `cleanup_and_test_data.sql`
**Propósito:** Limpia datos de prueba y/o inserta nuevos datos de test. Usar antes de hacer demostraciones.

---

### `fix_church_users_rls.sql`
**Propósito:** Fix específico para el error de recursión infinita en las políticas de `church_users`.

> ✅ Ya aplicado. El problema era que las políticas de `church_users` hacían subquery a `church_users` causando recursión. La solución fue usar `my_church_id()` que es SECURITY DEFINER.

---

### `fix_duplicates_quick.sql`
**Propósito:** Elimina registros duplicados en tablas que puedan tenerlos.

---

### `fix_insert_church_users.sql`
**Propósito:** Fix para problemas al insertar en `church_users` cuando el usuario ya existe.

---

### `fix_vincular_usuarios.sql`
**Propósito:** Corrige vínculos rotos entre `personas` y `leaders` (cuando `member_id` no está seteado).

---

### `debug_church_users.sql`
**Propósito:** Queries de diagnóstico para verificar qué usuarios están vinculados a qué iglesia.

```sql
-- Ver todos los admins vinculados
SELECT cu.*, u.email, c.name AS church_name
FROM church_users cu
JOIN auth.users u ON u.id = cu.user_id
JOIN churches c ON c.id = cu.church_id;
```

---

### `diagnostico_crm.sql`
**Propósito:** Queries de diagnóstico general del CRM — verifica conteos por tabla, RLS activo, datos huérfanos.

---

### `get_user_role.sql`
**Propósito:** Obtiene el rol de un usuario específico en su iglesia.

```sql
-- Ver rol de un usuario
SELECT role, is_active FROM church_users 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@iglesia.com');
```

---

### `set_user_role.sql`
**Propósito:** Cambia el rol de un usuario (admin / staff).

```sql
-- Cambiar rol
UPDATE church_users SET role = 'staff' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario@iglesia.com');
```

---

### `hide_pending_leaders.sql`
**Propósito:** Oculta líderes pendientes de aprobación en ciertas vistas del CRM.

---

### `crear_usuarios_auth.sql`
**Propósito:** Instrucciones y queries para crear usuarios en Supabase Auth. Útil para crear cuentas de admin de nuevas iglesias.

---

## Estructura de seguridad (resumen)

```
churches           → RLS: lectura pública (solo activas), edición solo admins
church_users       → RLS: cada usuario ve lo suyo; admins ven su iglesia (via my_church_id())
personas           → INSERT público (church_id válido), CRUD solo mismo church_id
leaders/visitors/
donations/events   → Solo mismo church_id (via my_church_id())
leader_*           → Líderes ven lo suyo, admins ven todo de su iglesia
connect_*          → Lectura pública filtrada por iglesias activas
```

---

## Función clave: `my_church_id()`

```sql
-- Ver su definición
SELECT prosrc FROM pg_proc WHERE proname = 'my_church_id';

-- Probar manualmente (logueado como admin)
SELECT public.my_church_id();
```

Esta función:
- Es `SECURITY DEFINER` → bypasea RLS cuando consulta `church_users`
- Devuelve el `church_id` del usuario autenticado actual
- Es usada en TODAS las políticas RLS de las tablas del CRM
