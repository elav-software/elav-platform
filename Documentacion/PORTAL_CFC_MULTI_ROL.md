# Portal CFC — Arquitectura Multi-Área

> Última actualización: Abril 2026

---

## Concepto central

El Portal CFC (`/connect/portal`) es un único portal privado que sirve a **múltiples perfiles** de la iglesia. El acceso y el contenido que cada usuario ve depende de **dos cosas**:

1. Si tiene `rol = 'Líder'` y `estado_aprobacion = 'aprobado'`
2. Si tiene en `area_servicio_actual` alguna área registrada en `AREA_PORTAL_SECTIONS`

> **No existe más el campo `acceso_consolidacion`** ni el rol `'Consolidación'`. El acceso se deriva automáticamente de las áreas de servicio.

---

## Rutas del portal

| Ruta | Descripción |
|------|-------------|
| `/connect/portal/login` | Login único para todos los perfiles |
| `/connect/portal/dashboard` | Panel principal — contenido según perfil |
| `/connect/portal/reportes` | Solo Líderes |
| `/connect/portal/materiales` | Solo Líderes |
| `/connect/portal/miembros` | Solo Líderes |
| `/connect/portal/oracion` | Solo Líderes |
| `/connect/portal/callback` | Callback tras aceptar invitación por email |
| `/connect/portal/set-password` | Crear/resetear contraseña |

---

## Quién puede entrar al portal

```
¿Es Líder aprobado?
  SI → entra con dashboard completo (stats + menú + tarjetas de áreas)

¿Tiene algún área en area_servicio_actual que esté en AREA_PORTAL_SECTIONS?
  SI → entra con vista reducida (solo sus tarjetas de área)

Ninguno → acceso denegado, se lo redirige a /login
```

---

## AREA_PORTAL_SECTIONS — el registro central

Ubicación: `src/connect/pages/PortalDashboard.jsx`

```js
const AREA_PORTAL_SECTIONS = {
  'Consolidación': {
    key: 'consolidacion',
    title: 'Registrar Visitante',
    description: 'Anotar datos de nuevos visitantes',
    icon: UserPlus,
    color: 'from-orange-500 to-orange-600',
  },
  // Para agregar una nueva área: una entrada acá + un componente de vista
};
```

**Para agregar una nueva área con portal:**
1. Agregar la entrada en `AREA_PORTAL_SECTIONS` con `key`, `title`, `description`, `icon` y `color`
2. Crear el componente de vista correspondiente (similar a `ConsolidacionView`)
3. Agregar el `case` en la función `renderAreaView()` del dashboard
4. Agregar el área en el array `PORTAL_AREAS` de `/app/api/connect/invite-member/route.ts`

---

## Vistas por perfil

### Perfil: Líder aprobado

**Requisitos en `personas`:**
- `rol = 'Líder'`
- `estado_aprobacion = 'aprobado'`
- Usuario en Supabase Auth con el mismo email

**Contenido:**
- Stats: reportes del último mes, miembros de célula, pedidos de oración activos
- Tarjetas: Cargar Reporte, Materiales, Mis Miembros, Pedidos de Oración
- Tarjeta **"Accesos de Célula"** — para invitar a sus miembros de servicio al portal
- Tarjeta extra por cada área portal que tenga en `area_servicio_actual`

---

### Perfil: Miembro de servicio (sin rol Líder)

**Requisitos en `personas`:**
- `area_servicio_actual` contiene al menos un área de `AREA_PORTAL_SECTIONS`
- Usuario en Supabase Auth con el mismo email (creado por invitación del líder)

**Contenido:**
- Solo las tarjetas de sus áreas (ej: "Registrar Visitante" para Consolidación)
- Sin stats, sin materiales, sin reportes

**Alta:**
El líder los invita desde la tarjeta "Accesos de Célula" en su portal. Ver [FLUJO_ACCESO_MIEMBROS_SERVICIO.md](./FLUJO_ACCESO_MIEMBROS_SERVICIO.md).

---

## Campos de BD relevantes

### `personas`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `rol` | text | `'Líder'`, `'Miembro'`, `'Visitante'`, etc. Solo `'Líder'` da acceso al portal completo |
| `estado_aprobacion` | text | `'aprobado'` requerido para que un Líder entre al portal |
| `area_servicio_actual` | text | CSV con las áreas: `"Consolidación, Alabanza"`. Determina qué secciones del portal ve |
| `lider_id` | uuid | FK a `personas.id` del líder de su célula. Necesario para el flujo de invitación |
| `foto_url` | text | Foto de perfil, editable desde el portal |

### `visitors` — registros de Consolidación

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre del visitante |
| `phone` / `whatsapp` | Contacto |
| `email` | Email (opcional) |
| `visit_date` | Fecha de la visita |
| `invited_by` | Nombre del consolidador que lo registró |
| `notes` | Observaciones |
| `follow_up_status` | Estado de seguimiento (`Pending` por defecto) |
| `church_id` | ID de la iglesia |

---

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/connect/pages/PortalDashboard.jsx` | Dashboard principal + `AREA_PORTAL_SECTIONS` + todos los componentes de vista |
| `src/connect/pages/PortalLogin.jsx` | Login — verifica acceso vía rol o área portal |
| `app/api/connect/invite-member/route.ts` | API que el líder llama para invitar a un miembro al portal |
| `app/api/crm/invite-leader/route.ts` | API que el admin del CRM llama para invitar a un líder |


---

## Rutas del portal

| Ruta | Descripción |
|------|-------------|
| `/connect/portal/login` | Login único para todos los roles |
| `/connect/portal/dashboard` | Panel principal (contenido según rol) |
| `/connect/portal/reportes` | Solo Líderes |
| `/connect/portal/materiales` | Solo Líderes |
| `/connect/portal/miembros` | Solo Líderes |
| `/connect/portal/oracion` | Solo Líderes |

> La ruta `/connect/portal/consolidacion` ya no se usa. Todo pasa por `/dashboard`.

---

## Lógica de acceso

```
1. Usuario ingresa email + contraseña en /connect/portal/login
2. Sistema busca en tabla `personas` WHERE email = X AND rol IN ('Líder', 'Consolidación')
3. Si es Líder → verifica estado_aprobacion = 'aprobado'
4. Si es Consolidación → no requiere aprobación adicional
5. Ambos casos redirigen a /connect/portal/dashboard
6. El dashboard lee el campo `rol` y renderiza la vista correspondiente
```

---

## Rol: Líder

### Requisitos en `personas`
- `rol = 'Líder'`
- `estado_aprobacion = 'aprobado'`
- Usuario creado en **Supabase Auth** con el mismo email

### Contenido que ve
- Stats: reportes del último mes, miembros de célula, pedidos de oración activos
- Tarjetas de menú: Cargar Reporte, Materiales, Mis Miembros, Pedidos de Oración
- (Opcional) Tarjeta extra naranja "Registrar Visitante" si `acceso_consolidacion = true`

### Dar acceso a un Líder que también hace Consolidación
En Supabase → tabla `personas` → buscar al líder → cambiar `acceso_consolidacion` a `true`.
Eso le agrega la tarjeta "Registrar Visitante" en su menú sin cambiarle el rol.

---

## Rol: Consolidación

### Requisitos en `personas`
- `rol = 'Consolidación'`
- `estado_aprobacion = 'aprobado'` (requerido para consistencia, aunque no se valida en código)
- Usuario creado en **Supabase Auth** con el mismo email

### Contenido que ve
- Formulario de registro de visitante (nombre*, teléfono, whatsapp, email, fecha, invitado por, notas)
- Listado de los últimos 8 visitantes registrados por él/ella

### Cómo crear un usuario de Consolidación

**Paso 1 — Crear usuario en Auth:**
```
Supabase Dashboard → Authentication → Users → Add user
Email: consolidacion1@ejemplo.com
Password: (temporal, el usuario puede cambiarla)
```

**Paso 2 — Registrar en `personas`:**
```sql
INSERT INTO public.personas (
  nombre, apellido, email, telefono, rol, estado_aprobacion, church_id
) VALUES (
  'Nombre', 'Apellido', 'consolidacion1@ejemplo.com', '1123456789',
  'Consolidación', 'aprobado', '61e61e01-983a-4ea8-b479-2d9c38c47519'
)
ON CONFLICT (email) DO UPDATE SET rol = 'Consolidación', estado_aprobacion = 'aprobado';
```

---

## Tabla de base de datos relevante

### `personas` — campos del portal

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `rol` | text | `'Líder'` o `'Consolidación'` (u otros futuros) |
| `estado_aprobacion` | text | `'aprobado'` requerido para Líderes |
| `acceso_consolidacion` | boolean | `true` = el Líder también puede registrar visitantes |
| `foto_url` | text | Foto de perfil, editable desde el portal |

### `visitors` — registros de consolidación

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre del visitante |
| `phone` / `whatsapp` | Contacto |
| `email` | Email (opcional) |
| `visit_date` | Fecha de la visita |
| `invited_by` | Nombre del consolidador que lo registró |
| `notes` | Observaciones |
| `follow_up_status` | Estado de seguimiento (`Pending` por defecto) |
| `church_id` | ID de la iglesia |

---

## Políticas RLS en `visitors`

| Política | Operación | Quién puede |
|----------|-----------|-------------|
| `church_full_access` | ALL | Admins CRM (`church_users.role = 'admin'`) |
| `consolidacion_insert_visitors` | INSERT | Usuario con `rol = 'Consolidación'` en `personas` |
| `consolidacion_select_own_visitors` | SELECT | Admin CRM (todos) o Consolidación (solo los que registró) |

---

## Agregar un nuevo rol en el futuro

1. Agregar el valor al campo `rol` en `personas` (es texto libre, no enum)
2. En `PortalLogin.jsx` → agregar el rol al `.in('rol', [...])` del query
3. En `PortalDashboard.jsx` → agregar un bloque `{leader?.rol === 'NuevoRol' && (...)}` en el JSX del main
4. Si necesita acceso a tablas nuevas, crear las políticas RLS correspondientes

---

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/connect/pages/PortalLogin.jsx` | Login, verifica rol y redirige al dashboard |
| `src/connect/pages/PortalDashboard.jsx` | Panel principal, renderiza según `leader.rol` |
| `supabase/setup_consolidacion.sql` | SQL para columna `acceso_consolidacion` + políticas RLS |
