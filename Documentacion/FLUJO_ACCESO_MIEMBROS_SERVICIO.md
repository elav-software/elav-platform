# Acceso al Portal para Miembros de Servicio

> Última actualización: Abril 2026

---

## ¿De qué se trata?

Los miembros que sirven en áreas como **Consolidación** necesitan acceder al portal para registrar visitantes, pero no son líderes y no pasan por el flujo de aprobación pastoral. El flujo de acceso lo gestiona su propio **líder de célula** directamente desde el portal.

---

## Flujo completo

```
1. Miembro llena la planilla    /miembros
   - Selecciona su líder
   - Marca su área de servicio (ej: "Consolidación")
          ↓
2. Se guarda en Supabase        personas
   - lider_id = ID del líder seleccionado
   - area_servicio_actual = "Consolidación" (u otras)
          ↓
3. Líder entra al portal        /connect/portal/dashboard
   - Ve la tarjeta "Accesos de Célula" (teal/verde azulado)
   - El badge muestra cuántos miembros tienen áreas con portal
          ↓
4. Líder abre "Accesos de Célula"
   - Ve la lista de sus miembros con áreas portal
   - Cada fila muestra: nombre, email, áreas habilitadas
          ↓
5. Líder presiona "Dar acceso"  /api/connect/invite-member
   - Supabase envía email de invitación al miembro
          ↓
6. Miembro recibe el email
   - Hace clic en el link → /connect/portal/callback
   - Crea su contraseña → /connect/portal/set-password
          ↓
7. Miembro entra al portal      /connect/portal/login
   - Ve solo las tarjetas de sus áreas de servicio
   - Ej: "Registrar Visitante" para Consolidación
```

---

## Detalle de cada paso

### Paso 1 — Planilla de Miembros (`/miembros`)

La planilla pública tiene una sección **"Iglesia y Líder"** con:
- **"Tu Líder"** — dropdown que lista los líderes aprobados de la iglesia. Al seleccionar uno, se guarda el `lider_id` en `personas`
- **"¿Servis en algún área?"** — chips multisselección. Los valores se guardan como CSV en `area_servicio_actual`

El miembro **no necesita ser aprobado** por el pastor para este flujo. La autorización la da su propio líder.

---

### Paso 3–4 — Portal del Líder: tarjeta "Accesos de Célula"

- Aparece **solo para Líderes aprobados**
- Lista a todos los miembros con `lider_id = leader.id` y al menos un área en `AREA_PORTAL_SECTIONS`
- Si un miembro no tiene email registrado, el botón "Dar acceso" aparece deshabilitado con mensaje explicativo

---

### Paso 5 — API `/api/connect/invite-member`

**Validaciones de seguridad:**
1. El token de sesión del portal debe corresponder a un Líder aprobado
2. El `lider_id` del miembro invitado debe ser igual al id del líder que llama
3. El miembro debe tener al menos un área de `PORTAL_AREAS` en `area_servicio_actual`

**Comportamiento:**
- Si el miembro **no tiene cuenta** en Supabase Auth → `inviteUserByEmail()` → email con link para crear contraseña
- Si el miembro **ya tiene cuenta** → `resetPasswordForEmail()` → email para resetear contraseña
- En ambos casos el link redirige a `/connect/portal/callback` o `/connect/portal/set-password`

---

### Paso 7 — Qué ve el miembro en el portal

El dashboard detecta que el usuario **no es Líder** pero tiene áreas portal en `area_servicio_actual`:

```
isServicio = !isLider && userPortalAreas.length > 0
```

Muestra **solo las tarjetas de sus áreas**. No ve stats, reportes, materiales ni pedidos de oración.

---

## Cómo agregar un área nueva al circuito

Hoy está implementado: **Consolidación**

Para agregar, por ejemplo, **Alabanza**:

1. Agregar en `AREA_PORTAL_SECTIONS` (`src/connect/pages/PortalDashboard.jsx`):
```js
'Alabanza': {
  key: 'alabanza',
  title: 'Gestión Alabanza',
  description: 'Recursos y coordinación del equipo',
  icon: Music,
  color: 'from-yellow-500 to-yellow-600',
},
```

2. Crear componente `AlabanzaView` en el mismo archivo

3. Agregar el case en `renderAreaView()`:
```js
if (activeView === 'alabanza') return <AlabanzaView leader={user} onBack={...} />;
```

4. Agregar `'Alabanza'` al array `PORTAL_AREAS` en:
`app/api/connect/invite-member/route.ts`

---

## Requisitos en base de datos

Para que el flujo funcione, el miembro debe tener en `personas`:

| Campo | Valor requerido |
|-------|-----------------|
| `email` | Dirección de email válida (sin esto no se puede invitar) |
| `lider_id` | UUID del líder de su célula |
| `area_servicio_actual` | Incluye al menos un área de `AREA_PORTAL_SECTIONS` |

---

## Diferencias con el flujo de alta de Líderes

| | Miembros de servicio | Líderes |
|---|---|---|
| **Aprobación pastoral** | No requerida | Sí, el pastor aprueba en CRM |
| **Quién envía la invitación** | El líder de célula desde el portal | El admin del CRM desde `/crm/leaders/approvals` |
| **API** | `/api/connect/invite-member` | `/api/crm/invite-leader` |
| **Acceso al portal** | Solo sus áreas de servicio | Dashboard completo + área de servicio si tiene |
| **Flujo de llenado** | Planilla `/miembros` | Formulario `/lider` |
