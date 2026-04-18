# Portal CFC — Guía Multi-Rol

## ¿Qué es?

El Portal CFC (`/connect/portal`) es un único portal privado que sirve a **múltiples perfiles** de la iglesia. Cada usuario ve únicamente el contenido que corresponde a su rol. Actualmente soporta:

| Rol | Qué ve al ingresar |
|-----|--------------------|
| `Líder` | Stats de su célula + tarjetas de menú (Reportes, Materiales, Miembros, Oración) |
| `Consolidación` | Formulario de registro de visitantes + listado de últimos registrados |

> En el futuro se pueden agregar más roles (Músico, Diácono, etc.) siguiendo el mismo patrón.

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
