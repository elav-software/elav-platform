# Alta de Líderes — Documentación del flujo actual

> Estado: Abril 2026

---

## Flujo completo paso a paso

```
1. Líder llena formulario      /lider
           ↓
2. Se guarda en Supabase       personas (estado_aprobacion = 'pendiente')
           ↓
3. Pastor revisa en CRM        /crm/leaders/approvals
           ↓
4. Pastor aprueba              personas (estado_aprobacion = 'aprobado')
                               leaders  (se crea registro con geocodificación)
           ↓
5. (manual) Pastor le avisa al líder que fue aprobado  ← GAP ACTUAL
           ↓
6. Líder entra al portal       /connect/portal/login
           ↓
7. Login con Google (o email/pass)
           ↓
8. PortalCallback verifica     personas WHERE email = ? AND rol = 'Líder'
                                              AND estado_aprobacion = 'aprobado'
           ↓
9. Acceso al dashboard         /connect/portal/dashboard
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

### Paso 6-8 — Login al portal

El portal acepta **dos métodos** de login:

| Método | Cómo funciona |
|--------|---------------|
| **Google OAuth** | El líder hace click en "Continuar con Google", Supabase redirige a `/connect/portal/callback` que verifica el email en `personas` |
| **Email + contraseña** | El líder ingresa email y contraseña. La cuenta de Supabase Auth debe existir previamente (creación manual o invitación) |

**Verificación en ambos casos:**
```sql
SELECT * FROM personas
WHERE email ILIKE :email
  AND rol = 'Líder'
  AND estado_aprobacion = 'aprobado'
  AND church_id = :church_id
```

Si no pasa esta verificación → se hace signOut y se muestra mensaje de error.

---

## GAP actual: notificación manual

Hoy no existe ningún email automático cuando el pastor aprueba a un líder.
El pastor tiene que avisarle por WhatsApp/teléfono que:
1. Fue aprobado
2. Puede acceder a `/connect/portal/login`
3. Debe usar el mismo email que registró en el formulario

---

## Tabla `personas` — columnas relevantes para el flujo

| Columna | Valor | Significado |
|---------|-------|-------------|
| `rol` | `'Líder'` | Es un líder (vs Miembro, Visitante) |
| `estado_aprobacion` | `'pendiente'` / `'aprobado'` / `'rechazado'` | Estado de revisión |
| `email` | correo personal | Se usa para matchear el login |
| `fecha_aprobacion` | timestamp | Cuándo fue aprobado |
| `aprobado_por` | uuid → auth.users | Qué admin aprobó |

---

## Lo que falta (próximos pasos)

### Prioritario
- [ ] **Email automático de aprobación** — cuando el pastor aprueba, el sistema envía un email al correo del líder con el link al portal

### Futuro (por iglesia)
- [ ] **Alta en Google Workspace** — para iglesias con dominio propio (ej: @cfccasanova.com), generar `nombre.apellido@dominio.com` y crear la cuenta automáticamente via Google Admin API. La columna `workspace_email` quedaría guardada en `personas` y el portal la reconocería como método de login adicional.

---

## Archivos clave

| Archivo | Qué hace |
|---------|----------|
| [app/lider/page.tsx](../app/lider/page.tsx) | Formulario público de registro de líderes |
| [src/crm/pages/LeaderApprovals.jsx](../src/crm/pages/LeaderApprovals.jsx) | Pantalla de aprobación en el CRM |
| [src/connect/pages/PortalLogin.jsx](../src/connect/pages/PortalLogin.jsx) | Login del portal (Google + email/pass) |
| [src/connect/pages/PortalCallback.jsx](../src/connect/pages/PortalCallback.jsx) | Verifica el líder tras OAuth de Google |
| [supabase/portal_lideres.sql](../supabase/portal_lideres.sql) | Schema: columnas estado_aprobacion, función is_approved_leader |
