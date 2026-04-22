# Mapa del Proyecto — Dónde trabaja cada desarrollador

> Branch de prueba de integración: `landing-static-test`

---

## 🌐 Landing (Sitio público estático)

**Ruta en el repo:** `public/landing/`

| Archivo | Descripción |
|---|---|
| `public/landing/index.html` | Página principal / hero |
| `public/landing/soy-nuevo.html` | Página "Soy Nuevo" con historia, horarios y mapa |
| `public/landing/eventos.html` | Agenda de eventos |
| `public/landing/media.html` | Galería de fotos y videos |
| `public/landing/contacto.html` | Formulario de oración y redes sociales |
| `public/landing/style.css` | Estilos de toda la landing |
| `public/landing/componentes.js` | Navbar y footer compartidos (se inyectan vía JS) |
| `public/landing/logo.png` | Logo de la iglesia |
| `public/landing/img/` | Imágenes de la galería (1.jpg a 11.jpg) |

**URL local:** `http://localhost:3000/landing/index.html`

---

## 📋 Formulario de Líderes (Censo)

**Ruta en el repo:** `app/lider/`

| Archivo | Descripción |
|---|---|
| `app/lider/page.tsx` | Formulario de registro para líderes |
| `app/lider/layout.tsx` | Layout del formulario de líderes |

**URL local:** `http://localhost:3000/lider`

---

## 📋 Formulario de Miembros (Censo)

**Ruta en el repo:** `app/miembros/`

| Archivo | Descripción |
|---|---|
| `app/miembros/page.tsx` | Formulario de registro para miembros |
| `app/miembros/layout.tsx` | Layout del formulario de miembros |

**URL local:** `http://localhost:3000/miembros`

---

## 🔐 Portal de Líderes

**Ruta en el repo:** `app/connect/portal/`

| Archivo | Descripción |
|---|---|
| `app/connect/portal/login/page.tsx` | Login del portal (Google OAuth + Email) |
| `app/connect/portal/dashboard/page.tsx` | Dashboard principal del líder |
| `app/connect/portal/miembros/page.tsx` | Lista de miembros de la célula |
| `app/connect/portal/reportes/page.tsx` | Reportes y estadísticas |
| `app/connect/portal/materiales/page.tsx` | Materiales de capacitación |
| `app/connect/portal/consolidacion/page.tsx` | Seguimiento de consolidación |
| `app/connect/portal/oracion/page.tsx` | Pedidos de oración |
| `app/connect/portal/set-password/page.tsx` | Configuración de contraseña |
| `app/connect/portal/callback/page.tsx` | Callback de autenticación OAuth |
| `app/connect/portal/layout.tsx` | Layout del portal |
| `src/connect/pages/PortalLogin.jsx` | Componente React del login (lógica) |

**Componentes UI del portal:** `src/connect/components/`
**Hooks del portal:** `src/connect/hooks/`

**URL local:** `http://localhost:3000/connect/portal/login`

---

## 🌐 Connect (Web pública de la iglesia — app)

**Ruta en el repo:** `app/connect/`

| Archivo | Descripción |
|---|---|
| `app/connect/home/page.tsx` | Home pública |
| `app/connect/sermons/page.tsx` | Prédicas |
| `app/connect/events/page.tsx` | Eventos |
| `app/connect/live/page.tsx` | Transmisión en vivo |
| `app/connect/prayer/page.tsx` | Oración |
| `app/connect/bible/page.tsx` | Biblia |
| `app/connect/radio/page.tsx` | Radio |
| `app/connect/give/page.tsx` | Donaciones |
| `app/connect/devotionals/page.tsx` | Devocionales |
| `app/connect/announcements/page.tsx` | Anuncios |
| `app/connect/counseling/page.tsx` | Consejería |
| `app/connect/my-notes/page.tsx` | Mis notas |
| `app/connect/layout.tsx` | Layout de connect |
| `src/connect/` | Lógica, componentes y estilos de Connect |

---

## 🗂️ CRM (Panel administrativo interno)

**Ruta en el repo:** `app/crm/`

| Archivo | Descripción |
|---|---|
| `app/crm/login/page.tsx` | Login del CRM |
| `app/crm/dashboard/page.tsx` | Dashboard principal |
| `app/crm/members/page.tsx` | Gestión de miembros |
| `app/crm/leaders/page.tsx` | Gestión de líderes |
| `app/crm/leaders/approvals/page.tsx` | Aprobación de líderes |
| `app/crm/visitors/page.tsx` | Visitantes |
| `app/crm/events/page.tsx` | Eventos |
| `app/crm/donations/page.tsx` | Donaciones |
| `app/crm/prayer-requests/page.tsx` | Pedidos de oración |
| `app/crm/cell-submissions/page.tsx` | Reportes de células |
| `app/crm/communication/page.tsx` | Comunicación |
| `app/crm/demographics/page.tsx` | Demografía |
| `app/crm/materials/page.tsx` | Materiales |
| `app/crm/surveys/page.tsx` | Encuestas |
| `app/crm/service-areas/page.tsx` | Zonas de servicio |
| `app/crm/user-management/page.tsx` | Gestión de usuarios |
| `app/crm/layout.tsx` | Layout del CRM |
| `src/crm/` | Lógica, componentes y estilos del CRM |

**URL local:** `http://localhost:3000/crm/login`

---

## ⚙️ Superadmin

**Ruta en el repo:** `app/superadmin/`

| Archivo | Descripción |
|---|---|
| `app/superadmin/page.tsx` | Panel de superadmin (gestión de iglesias) |

**URL local:** `http://localhost:3000/superadmin`

---

## 🗄️ Base de Datos (Supabase)

**Ruta en el repo:** `supabase/`

Todos los scripts SQL de migración, RLS y seed están en esta carpeta.
Ver [README_SQL.md](README_SQL.md) para detalle de cada script.

**Configuración:** `lib/supabase.ts`

---

## 📁 Estructura general

```
public/landing/        ← Landing estática (HTML/CSS/JS puro)
app/                   ← Next.js App Router (React/TSX)
  lider/               ← Formulario de líderes
  miembros/            ← Formulario de miembros
  connect/portal/      ← Portal de líderes (requiere login)
  connect/             ← Web pública app
  crm/                 ← Panel administrativo
  superadmin/          ← Panel de superadmin
src/
  connect/             ← Componentes y lógica de Connect/Portal
  crm/                 ← Componentes y lógica del CRM
supabase/              ← Scripts SQL de base de datos
lib/                   ← Configuración compartida (Supabase, etc.)
```

---

## 🔑 Logo

`public/logo.png` — usado en toda la app Next.js (CRM, Portal, Connect, favicon)
`public/landing/logo.png` — usado en la landing estática (mismo archivo)
