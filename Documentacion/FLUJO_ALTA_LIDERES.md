# Alta de Líderes — Documentación del flujo actual

> Última actualización: Abril 2026

---

## Flujo completo paso a paso

```
1. Líder llena formulario      /lider
           ↓
2. Se guarda en Supabase       personas (estado_aprobacion = 'pendiente')
           ↓
3. Pastor revisa en CRM        /crm/leaders/approvals  (tab "Pendientes")
           ↓
4. Pastor hace click "Aprobar" personas (estado_aprobacion = 'aprobado')
                               leaders  (se crea registro con geocodificación)
           ↓
5. Pastor hace click "Enviar   Supabase Auth crea el usuario en auth.users
   Invitación" en tab          Le llega al líder un email con link para
   "Aprobados"                 crear su contraseña
           ↓
6. Líder hace click en el      /connect/portal/set-password
   link del email              Crea su contraseña
           ↓
7. Líder entra al portal       /connect/portal/login
           ↓
8. Login con email + contraseña
           ↓
9. PortalLogin verifica        personas WHERE email ILIKE :email
                                              AND rol = 'Líder'
                                              AND estado_aprobacion = 'aprobado'
           ↓
10. Acceso al dashboard        /connect/portal/dashboard
```

---

## Detalle de cada paso

### Paso 1 — Formulario del líder (`/lider`)

- Formulario público de 5 pasos (Personales, Iglesia, Servicio, Célula, Familia)
- El campo **email** es el que se usará para autenticarse después
- Al enviar inserta en `public.personas` con:
  - `rol = 'Líder'`
  - `estado_aprobacion = 'pendiente'` (default de BD)
  - `church_id` resuelto desde el dominio/slug

### Paso 3 — Aprobación en CRM (`/crm/leaders/approvals`)

- Solo accesible para usuarios con `church_users.role = 'admin'`
- Muestra tres tabs: **Pendientes / Aprobados / Rechazados**

### Paso 4 — Qué hace el botón "Aprobar"

1. Actualiza `personas.estado_aprobacion = 'aprobado'`
2. Geocodifica la dirección de reunión (via Nominatim/OpenStreetMap)
3. Crea un registro en la tabla `leaders` con nombre, teléfono, célula, coordenadas

> ⚠️ Aprobar NO crea la cuenta en Supabase Auth ni envía ningún email. Son pasos separados.

### Paso 5 — Botón "Enviar Invitación" (tab Aprobados)

Llama al endpoint `/api/crm/invite-leader` con el email del líder. Este endpoint:

- Si el usuario **NO existe** en `auth.users` → usa `inviteUserByEmail` → Supabase manda email con link para crear contraseña, redirige a `/connect/portal/callback`
- Si el usuario **YA existe** en `auth.users` → usa `resetPasswordForEmail` → manda email para restablecer contraseña, redirige a `/connect/portal/set-password`

> También existe "Enviar a todos" que invita a todos los líderes aprobados de una vez.

### Paso 8-9 — Login al portal

El portal usa **únicamente email + contraseña** (Google OAuth fue descartado por limitaciones con los correos Gmail).

Verificación tras el login:
```sql
SELECT id FROM personas
WHERE email ILIKE :email
  AND rol = 'Líder'
  AND estado_aprobacion = 'aprobado'
  AND church_id = :church_id
```

Si no pasa esta verificación → se hace signOut y se muestra "Tu cuenta aún no está aprobada como líder".

---

## Tabla `personas` — columnas relevantes

| Columna | Valor | Significado |
|---------|-------|-------------|
| `rol` | `'Líder'` | Es un líder (vs Miembro, Visitante) |
| `estado_aprobacion` | `'pendiente'` / `'aprobado'` / `'rechazado'` | Estado de revisión |
| `email` | correo personal | Se usa para matchear el login (ILIKE) |
| `fecha_aprobacion` | timestamp | Cuándo fue aprobado |
| `aprobado_por` | uuid → auth.users | Qué admin aprobó |

## Tabla `auth.users` (Supabase Auth)

| Campo | Significado |
|-------|-------------|
| `email` | Debe coincidir exactamente con `personas.email` |
| `raw_user_meta_data` | No debe tener `role: superadmin` (reservado para admins CRM) |

## Tabla `church_users`

| Campo | Valor para admins CRM |
|-------|-----------------------|
| `role` | `'admin'` |
| `church_id` | UUID de la iglesia |
| `is_active` | `true` |

> Los líderes del portal **NO están en `church_users`**. Solo los admins del CRM.

---

## Acceso a los dos sistemas

| Usuario | CRM | Portal de Líderes |
|---------|-----|-------------------|
| Admin CRM | ✅ Requiere fila en `church_users` con `role = admin` | ❌ No aplica |
| Líder aprobado | ❌ No aplica (salvo que también sea admin) | ✅ Requiere `personas` con `rol = Líder` y `estado_aprobacion = aprobado` |
| Líder que también es admin | ✅ Por `church_users` | ✅ Por `personas` |

---

## Archivos clave

| Archivo | Qué hace |
|---------|----------|
| [app/lider/page.tsx](../app/lider/page.tsx) | Formulario público de registro de líderes |
| [src/crm/pages/LeaderApprovals.jsx](../src/crm/pages/LeaderApprovals.jsx) | Pantalla de aprobación + botón invitar en el CRM |
| [app/api/crm/invite-leader/route.ts](../app/api/crm/invite-leader/route.ts) | API que crea usuario en auth y manda email |
| [app/api/crm/invite-all-leaders/route.ts](../app/api/crm/invite-all-leaders/route.ts) | API que invita a todos los líderes aprobados |
| [src/connect/pages/PortalLogin.jsx](../src/connect/pages/PortalLogin.jsx) | Login del portal (email + contraseña) |
| [src/connect/pages/PortalSetPassword.jsx](../src/connect/pages/PortalSetPassword.jsx) | Pantalla para crear/cambiar contraseña |
| [supabase/portal_lideres.sql](../supabase/portal_lideres.sql) | Schema: columnas estado_aprobacion, RLS |
| [supabase/fix_portal_leader_rls.sql](../supabase/fix_portal_leader_rls.sql) | Fix RLS: función my_leader_church_id() |
