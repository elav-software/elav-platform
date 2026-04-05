# CFC CASA — Plataforma Digital de la Iglesia

Sistema unificado de **CFC Isidro Casanova** que integra en un solo repositorio:

- 🌐 **Web pública de la iglesia** (cfccasanova.com)
- 📋 **Planilla de censo** de líderes y miembros
- 🗂️ **CRM interno** de gestión pastoral

Todo corre sobre **Next.js 16**, **Supabase** como base de datos y autenticación, y **Tailwind CSS** para el diseño.

---

## Tabla de contenidos

1. [Objetivo](#objetivo)
2. [Arquitectura general](#arquitectura-general)
3. [Submódulos de la aplicación](#submódulos-de-la-aplicación)
   - [Connect — Web pública](#connect--web-pública)
   - [Censo — Planilla de registro](#censo--planilla-de-registro)
   - [CRM — Sistema de gestión](#crm--sistema-de-gestión)
4. [Base de datos (Supabase)](#base-de-datos-supabase)
5. [Estructura de archivos](#estructura-de-archivos)
6. [Variables de entorno](#variables-de-entorno)
7. [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
8. [Guía de trabajo — Ejemplos prácticos](#guía-de-trabajo--ejemplos-prácticos)
   - [Modificar la web pública](#modificar-la-web-pública)
   - [Agregar un campo al censo](#agregar-un-campo-al-censo)
   - [Agregar una pantalla al CRM](#agregar-una-pantalla-al-crm)
   - [Cambiar el menú de navegación](#cambiar-el-menú-de-navegación)
   - [Cargar datos de prueba](#cargar-datos-de-prueba)
9. [Routing por subdominio](#routing-por-subdominio)
10. [Autenticación](#autenticación)
11. [Tecnologías usadas](#tecnologías-usadas)

---

## Objetivo

Centralizar en un solo sistema todo lo que la iglesia necesita digitalmente:

| Público | Líderes / Miembros | Administración |
|---|---|---|
| Web de la iglesia | Formulario de censo | CRM pastoral |
| Sermones, eventos, devocionales | Registro de célula y ministerio | Miembros, donaciones, estadísticas |
| Oración, Biblia, Radio | — | Visitantes, líderes, comunicación |

---

## Arquitectura general

```
cfccasanova.com
│
├── /connect/*        ← Web pública (acceso libre, sin login)
│     └── src/connect/
│
├── censo.cfccasanova.com  → /lider     ← Planilla de líderes
├──         "              → /miembros  ← Planilla de miembros
│     └── app/lider/page.tsx
│         app/miembros/page.tsx
│
└── crm.cfccasanova.com    → /crm/*    ← CRM interno (requiere login admin)
      └── src/crm/
```

**El enrutamiento por subdominio** es manejado por `proxy.ts` (middleware de Next.js).  
Cada módulo vive en su propia carpeta (`src/connect`, `src/crm`) con sus propios componentes, estilos y rutas.

---

## Submódulos de la aplicación

### Connect — Web pública

**URL:** `cfccasanova.com` o `localhost:3000/connect/home`

La web pública que ven todos los miembros e interesados. No requiere login.

| Pantalla | Ruta | Archivo |
|---|---|---|
| Inicio | `/connect/home` | `src/connect/pages/Home.jsx` |
| En Vivo | `/connect/live` | `src/connect/pages/Live.jsx` |
| Biblia | `/connect/bible` | `src/connect/pages/Bible.jsx` |
| Oración | `/connect/prayer` | `src/connect/pages/Prayer.jsx` |
| Dar / Ofrendar | `/connect/give` | `src/connect/pages/Give.jsx` |
| Sermones | `/connect/sermons` | `src/connect/pages/Sermons.jsx` |
| Devocionales | `/connect/devotionals` | `src/connect/pages/Devotionals.jsx` |
| Eventos | `/connect/events` | `src/connect/pages/Events.jsx` |
| Anuncios | `/connect/announcements` | `src/connect/pages/Announcements.jsx` |
| Radio | `/connect/radio` | `src/connect/pages/Radio.jsx` |
| Consejería | `/connect/counseling` | `src/connect/pages/Counseling.jsx` |
| Mis Notas | `/connect/my-notes` | `src/connect/pages/MyNotes.jsx` |
| Materiales (líderes) | `/connect/leadership` | `src/connect/pages/LeadershipMaterials.jsx` |
| Reportes de ministerio | `/connect/ministry-reports` | `src/connect/pages/MinistryReports.jsx` |
| Panel Admin Connect | `/connect/admin` | `src/connect/pages/AdminDashboard.jsx` + demás Admin*.jsx |

**Navegación inferior** (barra fija mobile): Inicio, En Vivo, Biblia, Oración, Dar  
**Menú hamburguesa**: Sermones, Devocionales, Eventos, Anuncios, Radio, Consejería, Mis Notas

---

### Censo — Planilla de registro

**URL:** `censo.cfccasanova.com` o `localhost:3000/lider` / `localhost:3000/miembros`

Formularios multi-paso para que líderes y miembros se registren en la base de datos de la iglesia. Los datos van directo a la tabla `personas` en Supabase.

| Formulario | Ruta | Archivo | `rol` que asigna |
|---|---|---|---|
| Planilla Líder | `/lider` | `app/lider/page.tsx` | `"Líder"` |
| Planilla Miembro | `/miembros` | `app/miembros/page.tsx` | `"Miembro"` |

**Campos que captura la planilla de líderes (5 pasos):**

1. **Personales:** nombre, apellido, email, teléfono, WhatsApp, edad, fecha de nacimiento, género, estado civil, dirección, barrio/zona, ocupación, nivel de educación
2. **Iglesia:** año de conversión, fecha de llegada a CFC, bautizado, año de bautismo, fue al encuentro, nivel de formación, cómo conoció, quién invitó
3. **Servicio:** habilidades técnicas, disponibilidad horaria, áreas de servicio actuales
4. **Célula:** ministerio, grupo/célula, día/hora/lugar de reunión
5. **Familia:** cónyuge, hijos, tamaño del hogar, vínculos familiares en la iglesia

**La planilla de miembros** es simplificada (3 pasos) e incluye selector de líder.

---

### CRM — Sistema de gestión

**URL:** `crm.cfccasanova.com` o `localhost:3000/crm`  
**Requiere login** con cuenta de Supabase que tenga `user_metadata.role = "admin"`.

| Módulo | Ruta | Archivo |
|---|---|---|
| Dashboard | `/crm/dashboard` | `src/crm/pages/Dashboard.jsx` |
| Miembros | `/crm/members` | `src/crm/pages/Members.jsx` |
| Visitantes | `/crm/visitors` | `src/crm/pages/Visitors.jsx` |
| Líderes | `/crm/leaders` | `src/crm/pages/Leaders.jsx` |
| Ministerios | `/crm/ministries` | `src/crm/pages/Ministries.jsx` |
| Eventos | `/crm/events` | `src/crm/pages/Events.jsx` |
| Peticiones de Oración | `/crm/prayer-requests` | `src/crm/pages/PrayerRequests.jsx` |
| Donaciones | `/crm/donations` | `src/crm/pages/Donations.jsx` |
| Demografía | `/crm/demographics` | `src/crm/pages/Demographics.jsx` |
| Comunicación | `/crm/communication` | `src/crm/pages/Communication.jsx` |
| Encuestas | `/crm/surveys` | `src/crm/pages/Surveys.jsx` |
| Gestión de usuarios | `/crm/user-management` | `src/crm/pages/UserManagement.jsx` |
| Login | `/crm/login` | `src/crm/pages/Welcome.jsx` |

El **Dashboard** muestra:
- Tarjetas de resumen: total de miembros, visitantes del mes, bautismos del año, diezmos del mes
- Gráfico de crecimiento (últimos 6 meses)
- Gráfico de donaciones (últimos 6 meses)
- Próximos eventos

**Los miembros del censo** (`personas` con `rol = "Líder"` o `"Miembro"`) son importados automáticamente al CRM a través del módulo `src/crm/api/supabaseClient.js` que traduce los campos en español de Supabase al formato en inglés del CRM.

---

## Base de datos (Supabase)

Todos los scripts SQL están en la carpeta `supabase/`.

| Archivo | Descripción |
|---|---|
| `supabase/connect_tables.sql` | Tablas públicas: servicios, sermones, devocionales, eventos, anuncios, peticiones de oración, consejería, versículos |
| `supabase/crm_tables.sql` | Tablas del CRM: visitantes, donaciones, eventos CRM, líderes de célula, reportes, ministerios, voluntarios, encuestas |
| `supabase/secure_tables.sql` | Políticas RLS de seguridad (Row Level Security) |
| `supabase/get_user_role.sql` | Función para leer el rol del usuario |
| `supabase/set_user_role.sql` | Función para asignar rol admin a un usuario |
| `supabase/seed_personas.sql` | Datos de prueba: 10 líderes + 30 miembros |

### Tabla principal: `personas`

Es el corazón del sistema. Unifica censo, CRM y el formulario de miembros.

```
personas
├── id             uuid (PK)
├── nombre         text
├── apellido       text
├── email          text
├── telefono       text
├── whatsapp       text
├── edad           integer
├── fecha_nacimiento date
├── genero         text  ("Masculino" | "Femenino")
├── estado_civil   text  ("Soltero/a" | "Casado/a" | "Viudo/a" | "Divorciado/a")
├── direccion      text
├── barrio_zona    text
├── ocupacion      text
├── nivel_educacion text
├── rol            text  ← "Líder" | "Miembro" | "Visitante" | "Nuevo Creyente"
├── ano_conversion text
├── fecha_llegada_cfc date
├── bautizado      text  ("Sí" | "No")
├── ano_bautismo   text
├── fue_encuentro  text  ("Sí" | "No")
├── nivel_formacion text
├── como_conociste text
├── quien_te_invito text
├── habilidades_tecnicas text
├── disponibilidad_horaria text
├── area_servicio_actual   text
├── ministerio     text          ← Solo líderes
├── grupo_celula   text
├── dia_reunion    text          ← Solo líderes
├── hora_reunion   text          ← Solo líderes
├── lugar_reunion  text          ← Solo líderes
├── conyuge        text
├── hijos          text
├── tamano_hogar   integer
├── vinculos_familiares_iglesia text
├── lider_id       uuid  → FK a personas(id)  ← Solo miembros
└── created_at     timestamptz
```

### Traducción Supabase ↔ CRM

El archivo `src/crm/api/supabaseClient.js` traduce entre los campos en español de Supabase y el formato en inglés del CRM:

```
Supabase (español)        →    CRM (inglés)
────────────────────────────────────────────
rol = "Líder"             →    member_status = "Leader"
rol = "Miembro"           →    member_status = "Member"
genero = "Masculino"      →    gender = "Male"
estado_civil = "Casado/a" →    marital_status = "Married"
bautizado = "Sí"          →    baptism_status = "Baptized"
```

---

## Estructura de archivos

```
censo-iglesia/
│
├── app/                         ← Next.js App Router (rutas)
│   ├── layout.tsx               ← Layout raíz
│   ├── page.tsx                 ← Redirige a /connect/home
│   ├── connect/                 ← Rutas de la web pública
│   │   ├── layout.tsx
│   │   ├── ConnectClientLayout.tsx
│   │   ├── ConnectClientProviders.tsx
│   │   └── home/ live/ sermons/ ... (una carpeta por ruta)
│   ├── crm/                     ← Rutas del CRM
│   │   ├── layout.tsx
│   │   ├── CrmClientLayout.tsx
│   │   ├── CrmClientProviders.tsx
│   │   └── dashboard/ members/ ... (una carpeta por ruta)
│   ├── lider/                   ← Formulario de censo líderes
│   │   └── page.tsx
│   └── miembros/                ← Formulario de censo miembros
│       └── page.tsx
│
├── src/
│   ├── connect/                 ← Lógica y UI de la web pública
│   │   ├── ConnectShell.tsx     ← Conecta rutas Next.js con Layout
│   │   ├── Layout.jsx           ← Navbar + barra inferior
│   │   ├── pages/               ← Una página por pantalla
│   │   ├── components/          ← Componentes reutilizables
│   │   ├── api/
│   │   │   ├── base44Client.js  ← SDK de acceso a Supabase (datos públicos)
│   │   │   └── supabaseClient.js
│   │   └── lib/
│   │       ├── AuthContext.jsx  ← Auth (sin login en Connect)
│   │       └── router-compat.js ← Compatibilidad Link/useLocation con Next.js
│   │
│   └── crm/                     ← Lógica y UI del CRM
│       ├── CrmShell.tsx         ← Conecta rutas Next.js con Layout CRM
│       ├── Layout.jsx           ← Sidebar lateral
│       ├── pages/               ← Una página por módulo
│       ├── components/          ← Tablas, modales, gráficos, etc.
│       ├── api/
│       │   ├── base44Client.js  ← SDK de acceso a Supabase (autenticado)
│       │   └── supabaseClient.js ← Cliente + funciones de traducción
│       └── lib/
│           ├── AuthContext.jsx  ← Auth real con Supabase (requiere admin)
│           └── router-compat.js
│
├── lib/
│   └── supabase.ts              ← Cliente Supabase para el App Router (censo)
│
├── supabase/                    ← Scripts SQL
│   ├── connect_tables.sql
│   ├── crm_tables.sql
│   ├── secure_tables.sql
│   ├── get_user_role.sql
│   ├── set_user_role.sql
│   └── seed_personas.sql        ← Datos de prueba
│
├── proxy.ts                     ← Middleware: routing por subdominio
├── next.config.ts               ← Configuración de Next.js
└── tsconfig.json                ← Aliases: @crm/*, @connect/*
```

**Aliases de importación** (configurados en `tsconfig.json`):

```ts
@crm/*      →  src/crm/*
@connect/*  →  src/connect/*
@/*         →  ./  (raíz)
```

---

## Variables de entorno

Crear el archivo `.env.local` en la raíz con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-anon-key...
```

> ⚠️ Nunca commitear este archivo. Está en `.gitignore`.

---

## Cómo levantar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno
# Editar .env.local con las keys reales de Supabase

# 3. Inicializar la base de datos (una sola vez)
# Ir a Supabase → SQL Editor y ejecutar en orden:
#   1. supabase/connect_tables.sql
#   2. supabase/crm_tables.sql
#   3. supabase/secure_tables.sql

# 4. Levantar en desarrollo
npm run dev
# → http://localhost:3000

# Acceder a los módulos en local:
#   Web pública: http://localhost:3000/connect/home
#   Censo líder: http://localhost:3000/lider
#   Censo miembro: http://localhost:3000/miembros
#   CRM:         http://localhost:3000/crm/login
```

---

## Guía de trabajo — Ejemplos prácticos

### Modificar la web pública

#### Cambiar el texto del banner de inicio

```
📄 Archivo: src/connect/pages/Home.jsx
```

Buscar el bloque "Hero Section" y editar el texto directamente en el JSX.

---

#### Agregar una nueva pantalla a la web pública (ej: "Galería")

**Paso 1** — Crear el archivo de la página:

```
📄 Nuevo archivo: src/connect/pages/Gallery.jsx
```

```jsx
export default function Gallery() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Galería</h1>
      {/* contenido */}
    </div>
  );
}
```

**Paso 2** — Registrar la página en el configurador:

```
📄 Archivo: src/connect/pages.config.js
```

```js
import Gallery from './pages/Gallery';   // agregar import

export const PAGES = {
    // ... páginas existentes ...
    "Gallery": Gallery,                  // agregar acá
}
```

**Paso 3** — Crear la ruta en Next.js:

```
📄 Nuevo archivo: app/connect/gallery/page.tsx
```

```tsx
import Gallery from "@connect/pages/Gallery";
export default function GalleryPage() {
  return <Gallery />;
}
```

**Paso 4** — Registrar la ruta en el Shell:

```
📄 Archivo: src/connect/ConnectShell.tsx
```

```ts
const PATH_TO_PAGE: Record<string, string> = {
  // ... rutas existentes ...
  "/connect/gallery": "Gallery",   // agregar acá
};
```

**Paso 5** *(opcional)* — Agregar al menú de navegación:

```
📄 Archivo: src/connect/Layout.jsx
```

```js
const menuItems = [
  // ... ítems existentes ...
  { label: 'Galería', href: 'Gallery' },   // agregar acá
];
```

---

### Agregar un campo al censo

#### Ejemplo: agregar "Instagram" al formulario de líderes

**Paso 1** — Agregar la columna en Supabase:

```sql
-- Ejecutar en Supabase → SQL Editor
ALTER TABLE public.personas ADD COLUMN instagram text;
```

**Paso 2** — Agregar al tipo y estado inicial del formulario:

```
📄 Archivo: app/lider/page.tsx
```

```ts
// Agregar en el type FormData:
instagram: string;

// Agregar en INITIAL_FORM:
instagram: "",
```

**Paso 3** — Agregar el campo visual en el paso correspondiente:

```tsx
<div className={fieldGroupClasses}>
  <label className={labelClasses}>Instagram</label>
  <input
    type="text"
    className={inputClasses}
    placeholder="@usuario"
    value={form.instagram}
    onChange={set("instagram")}
  />
</div>
```

**Paso 4** — Incluir en el payload de guardado:

```ts
const payload = {
  // ... campos existentes ...
  instagram: form.instagram || null,
};
```

**Paso 5** *(opcional)* — Mostrar en la ficha del miembro en el CRM:

```
📄 Archivo: src/crm/api/supabaseClient.js
```

```js
// En supabaseToCRM():
instagram: persona.instagram || "",

// En crmToSupabase():
instagram: member.instagram || null,
```

---

### Agregar una pantalla al CRM

#### Ejemplo: módulo "Bautismos"

**Paso 1** — Crear la página:

```
📄 Nuevo archivo: src/crm/pages/Baptisms.jsx
```

```jsx
export default function Baptisms() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Bautismos</h1>
    </div>
  );
}
```

**Paso 2** — Crear la ruta Next.js:

```
📄 Nuevo archivo: app/crm/baptisms/page.tsx
```

```tsx
import Baptisms from "@crm/pages/Baptisms";
export default function BaptismsPage() {
  return <Baptisms />;
}
```

**Paso 3** — Registrar en el CrmShell:

```
📄 Archivo: src/crm/CrmShell.tsx
```

```ts
"/crm/baptisms": "Baptisms",
```

**Paso 4** — Agregar al menú lateral del CRM:

```
📄 Archivo: src/crm/Layout.jsx  (buscar el array de navItems)
```

```js
{ icon: Droplets, label: "Bautismos", href: "/crm/baptisms" },
```

Los íconos vienen de `lucide-react`. Ver catálogo en: https://lucide.dev/icons/

---

### Cambiar el menú de navegación

#### Barra inferior de la web pública (máximo 5 ítems)

```
📄 Archivo: src/connect/Layout.jsx
```

```js
const navItems = [
  { icon: Home,      label: 'Inicio',   href: 'Home' },
  { icon: Radio,     label: 'En Vivo',  href: 'Live' },
  { icon: BookOpen,  label: 'Biblia',   href: 'Bible' },
  { icon: HandHeart, label: 'Oración',  href: 'Prayer' },
  { icon: Heart,     label: 'Dar',      href: 'Give' },
];
```

---

### Cargar datos de prueba

Para poblar la base de datos con 10 líderes y 30 miembros ficticios:

```
📄 Archivo: supabase/seed_personas.sql
```

1. Ir a **Supabase → SQL Editor**
2. Pegar y ejecutar el contenido del archivo
3. Confirmar el mensaje: `Seed finalizado: 10 líderes + 30 miembros insertados correctamente.`
4. Abrir el CRM en `/crm/members` — deben aparecer los 40 registros

Para eliminar los datos de prueba:

```sql
DELETE FROM public.personas WHERE email LIKE '%@seed.test';
```

---

### Crear un usuario administrador del CRM

1. En **Supabase → Authentication → Users**, crear el usuario con email y contraseña
2. Copiar el UUID del usuario creado
3. Ejecutar en **Supabase → SQL Editor**:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE id = 'pegar-uuid-aqui';
```

4. El usuario ya puede iniciar sesión en `/crm/login`

---

## Routing por subdominio

El archivo `proxy.ts` actúa como middleware de Next.js y enruta según el subdominio:

| Subdominio | Redirige a | Requiere login |
|---|---|---|
| `cfccasanova.com` | `/connect/home` | No |
| `www.cfccasanova.com` | `/connect/home` | No |
| `censo.cfccasanova.com` | `/lider` | No |
| `portal.cfccasanova.com` | `/portal/*` | Sí (cookie Supabase) |
| `crm.cfccasanova.com` | `/crm/*` | Sí (Supabase localStorage) |

En **localhost** el routing por subdominio no aplica — se accede por ruta directa.

---

## Autenticación

### Web pública (Connect)
No requiere autenticación. El `AuthContext.jsx` de Connect siempre devuelve `isAuthenticated: false`.

### CRM
Usa **Supabase Auth** con email y contraseña.

- Login en `/crm/login` → `src/crm/pages/Welcome.jsx`
- Al ingresar se verifica que el usuario tenga `user_metadata.role === "admin"`. Sin ese rol la sesión se rechaza.
- Si el token expira, Supabase lo renueva automáticamente en segundo plano.

---

## Tecnologías usadas

| Tecnología | Uso |
|---|---|
| **Next.js 16** | Framework principal (App Router + Turbopack) |
| **React 19** | UI |
| **TypeScript** | Tipado en `app/`, `lib/` y configuración |
| **Supabase** | Base de datos PostgreSQL + autenticación |
| **Tailwind CSS** | Estilos |
| **Radix UI** | Componentes de UI accesibles (dialogs, selects, tabs, etc.) |
| **Tanstack Query** | Cache y fetch de datos |
| **Framer Motion** | Animaciones |
| **Recharts** | Gráficos del dashboard |
| **date-fns** | Manejo de fechas |
| **Lucide React** | Íconos |
| **react-hot-toast** | Notificaciones (censo) |

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
