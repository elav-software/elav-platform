# IglesiaSOS — Plataforma Digital Multi-Iglesia

Sistema unificado para la gestión digital de iglesias. Permite a múltiples iglesias operar de forma completamente independiente en una sola aplicación y base de datos, cada una con su propio dominio.

**Primera iglesia activa:** CFC Isidro Casanova (`cfccasanova.com`)

Incluye tres módulos por iglesia:

- 🌐 **Connect** — Web pública de la iglesia (sin login)
- 📋 **Censo** — Formularios de registro de líderes y miembros
- 🗂️ **CRM** — Panel administrativo interno (requiere login)

Todo corre sobre **Next.js 16**, **Supabase** como base de datos y autenticación, y **Tailwind CSS** para el diseño.

---

## Tabla de contenidos

1. [Estado actual del sistema](#estado-actual-del-sistema) — ✅ Migración completada
2. [Arquitectura multi-iglesia](#arquitectura-multi-iglesia)
3. [Submódulos de la aplicación](#submódulos-de-la-aplicación)
   - [Connect — Web pública](#connect--web-pública)
   - [Censo — Planilla de registro](#censo--planilla-de-registro)
   - [CRM — Sistema de gestión](#crm--sistema-de-gestión)
4. [Base de datos (Supabase)](#base-de-datos-supabase)
5. [Estructura de archivos](#estructura-de-archivos)
6. [Variables de entorno](#variables-de-entorno)
7. [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
8. [Sistema de Permisos — Cómo funcionan los usuarios admin](#sistema-de-permisos--cómo-funcionan-los-usuarios-admin)
9. [Agregar una iglesia nueva](#agregar-una-iglesia-nueva) — Panel `/superadmin` + DNS + Vercel
10. [Guía de trabajo — Ejemplos prácticos](#guía-de-trabajo--ejemplos-prácticos)
11. [Routing por dominio](#routing-por-dominio)
12. [Autenticación](#autenticación)
13. [Migración Multi-tenant — Detalles técnicos](#migración-multi-tenant--detalles-técnicos)
14. [Troubleshooting & Deployment](#troubleshooting--deployment) — **Guía de resolución de problemas**
15. [Tecnologías usadas](#tecnologías-usadas)

---

## Estado actual del sistema

✅ **Migración multi-tenant completada** — El sistema está listo para operar con múltiples iglesias.

### Base de datos

- ✅ Tabla `churches` creada con todos los campos (slug, custom_domain, plan, módulos, etc.)
- ✅ Tabla `church_users` creada para vincular usuarios de Supabase Auth con iglesias
- ✅ Columna `church_id` agregada a todas las tablas (personas, connect_*, CRM)
- ✅ Índices de performance creados en `church_id`
- ✅ RLS (Row Level Security) actualizado para aislamiento completo por iglesia
- ✅ Función `my_church_id()` instalada para políticas RLS

### Autenticación del CRM

- ✅ Login actualizado para usar tabla `church_users` en lugar de `user_metadata`
- ✅ Verificación automática: usuario debe estar en `church_users` con `role = 'admin'` y `is_active = true`
- ✅ Compatible con usuarios creados vía:
  - Panel Superadmin (crea usuario + vincula automáticamente)
  - Script de migración SQL
  - Gestión de Usuarios dentro del CRM

### Primera iglesia registrada

**CFC Isidro Casanova** ya está operativa:
- **Slug:** `cfc`
- **Dominio:** `cfccasanova.com`
- **Plan:** Pro (todos los módulos habilitados)
- **Usuarios admin vinculados:** 2 (developing@, jonapereda@)
- **Datos migrados:** 5 personas con `church_id` asignado

### Sistema de resolución automática

El `church_id` se resuelve **dinámicamente por dominio** — no requiere cambios de código para iglesias nuevas:

```
Browser accede a elrefugio.com
         ↓
apiClient.js lee window.location.hostname  →  "elrefugio.com"
         ↓
Query a Supabase: SELECT id FROM churches WHERE custom_domain = 'elrefugio.com'
         ↓
Todas las queries filtran con .eq('church_id', churchId)
         ↓
RLS en Supabase verifica que el usuario pertenezca a esa iglesia
```

### Próximos pasos disponibles

1. **Crear iglesias nuevas** — Usar `/superadmin` para onboarding automático
2. **Google OAuth** — Permitir login con cuentas Google
3. **Aprobación de líderes** — Validar líderes antes de darles acceso al portal
4. **Portal de líderes** — Sección protegida en la web pública para reportes de célula y materiales

---

## Arquitectura multi-iglesia

Una sola aplicación Next.js y un solo proyecto Supabase sirve a todas las iglesias. Cada iglesia está completamente aislada de las demás.

```
miiglesia.com               ←── dominio propio de la iglesia
    │
    ├── /connect/*          Web pública  (src/connect/)
    ├── crm.miiglesia.com   CRM interno  (src/crm/)
    └── censo.miiglesia.com Formularios  (app/lider/, app/miembros/)
```

**Aislamiento de datos — cómo funciona:**

```
Browser                   Next.js               Supabase
──────────────────────────────────────────────────────────────
miiglesia.com         →   proxy.ts          →   /connect/home
                          (routing solo)
                              │
                          apiClient.js
                          queria church_id
                              │
                          SELECT id FROM churches
                          WHERE custom_domain = 'miiglesia.com'
                              │
                          Todas las queries:
                          .eq('church_id', churchId)
                              │
                          RLS en Supabase:
                          my_church_id() comprueba
                          que el usuario pertenece
                          a esa iglesia
```

**Regla clave:** Para agregar una iglesia, solo se toca Supabase. Nunca el código.

---

```
miiglesia.com
│
├── /connect/*        ← Web pública (acceso libre, sin login)
│     └── src/connect/
│
├── censo.miiglesia.com → /lider     ← Planilla de líderes
├──         "           → /miembros  ← Planilla de miembros
│     └── app/lider/page.tsx
│         app/miembros/page.tsx
│
└── crm.miiglesia.com   → /crm/*    ← CRM interno (requiere login admin)
      └── src/crm/
```

**El routing por subdominio** es manejado por `proxy.ts` (middleware de Next.js).
Cada módulo vive en su propia carpeta (`src/connect`, `src/crm`) con sus propios componentes, estilos y rutas.

---

## Submódulos de la aplicación

### Connect — Web pública

**URL:** `miiglesia.com` o `localhost:3000/connect/home`

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

**URL:** `censo.miiglesia.com` o `localhost:3000/lider` / `localhost:3000/miembros`

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

**URL:** `crm.miiglesia.com` o `localhost:3000/crm`  
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
│   │   ├── apiClient.js     ← SDK multi-tenant (inyecta church_id por dominio)
│   │   └── supabaseClient.js
│   └── lib/
│       ├── AuthContext.jsx  ← Auth (sin login en Connect)
│       └── router-compat.js ← Compatibilidad Link/useLocation con Next.js
│
└── crm/                     ← Lógica y UI del CRM
    ├── CrmShell.tsx         ← Conecta rutas Next.js con Layout CRM
    ├── Layout.jsx           ← Sidebar lateral
    ├── pages/               ← Una página por módulo
    ├── components/          ← Tablas, modales, gráficos, etc.
    ├── api/
    │   ├── apiClient.js     ← SDK multi-tenant (church_id desde church_users)
    │   └── supabaseClient.js ← Cliente + funciones de traducción
    └── lib/
        ├── AuthContext.jsx  ← Auth real con Supabase (requiere admin)
        └── router-compat.js
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

Crear el archivo `.env.local` en la raíz (copiar desde `.env.example`):

```env
# ── Supabase (obligatorias) ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon-key...

# Service role key — SOLO servidor, nunca al cliente
# Supabase → Project Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role-key...

# ── Multi-iglesia ──────────────────────────────────────────────────────────
# Slug de iglesia por defecto en localhost
NEXT_PUBLIC_DEFAULT_CHURCH_SLUG=cfc

# ── Super Admin ────────────────────────────────────────────────────────────
# Clave para acceder a /superadmin — generá con: openssl rand -hex 32
SUPERADMIN_SECRET=una-clave-aleatoria-larga
```

| Variable | Dónde obtenerla | Expuesta al cliente |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role | **No** |
| `NEXT_PUBLIC_DEFAULT_CHURCH_SLUG` | Definido por vos | Sí |
| `SUPERADMIN_SECRET` | `openssl rand -hex 32` | **No** |

> ⚠️ Nunca commitear `.env.local`. Está en `.gitignore`.

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

## Sistema de Permisos — Cómo funcionan los usuarios admin

El sistema usa **Supabase Auth** para autenticación + tabla `church_users` para vincular usuarios con iglesias.

### Tabla `church_users`

Conecta un usuario de Supabase Auth con una iglesia específica y define su rol.

| Columna | Tipo | Descripción |
|---|---|---|
| `user_id` | uuid | FK a `auth.users` (usuario autenticado) |
| `church_id` | uuid | FK a `churches` (iglesia a la que pertenece) |
| `role` | text | `'admin'` o `'user'` (futuro: staff, etc.) |
| `is_active` | boolean | Si el usuario puede acceder (para desactivar sin borrar) |

**Constraint único:** Un usuario puede pertenecer a múltiples iglesias con roles diferentes, pero solo una vez por iglesia.

### Flujo de login al CRM

1. Usuario ingresa email/contraseña en `/crm/login`
2. Supabase Auth valida credenciales
3. **Query automática:** `SELECT role FROM church_users WHERE user_id = auth.uid() AND is_active = true`
4. Si `role === 'admin'` → acceso al CRM
5. Si no → mensaje "Tu cuenta no tiene permisos" + logout automático

### Creación automática de admins

**Método 1: Panel Superadmin** (recomendado para nuevas iglesias)

`/superadmin` →
1. Crea iglesia en tabla `churches`
2. Crea usuario en Supabase Auth con contraseña temporal
3. **Automáticamente inserta en `church_users`** con `role = 'admin'`
4. Setea `user_metadata.role = 'admin'` (compatibilidad)

**Método 2: Script SQL multi-tenant**

```sql
-- Paso 8 del multitenant_migration.sql
INSERT INTO public.church_users (church_id, user_id, role, is_active)
VALUES (church_id, user_id, 'admin', true);
```

**Método 3: Desde el CRM** (agregar colaboradores internos)

CRM → **Gestión de Usuarios → Invitar Usuario**
- Crea el usuario en Supabase Auth
- Automáticamente lo vincula a la misma iglesia del admin que invita
- Puede elegir rol: `admin` o `user`

### Gestión de usuarios dentro del CRM

El admin de cada iglesia puede desde **CRM → Gestión de Usuarios**:

| Acción | Disponible |
|---|---|
| Invitar usuario nuevo (por email) | ✓ |
| Cambiar rol (admin / usuario) | ✓ |
| Activar / desactivar acceso | ✓ |
| Eliminar usuario de la tabla | ✗ — intencional, los registros son permanentes |

> **Nota:** Los usuarios de `church_users` son **internos del CRM** (pastores, staff, etc.).
> Los **miembros y líderes** de la base de datos se crean a través del **censo público** y no tienen acceso al CRM.

### Seguridad RLS (Row Level Security)

- **Función SQL:** `my_church_id()` devuelve el `church_id` del usuario autenticado actual
- **Políticas:** Todas las tablas filtran automáticamente por `church_id = my_church_id()`
- **Resultado:** Un admin de CFC **nunca puede ver datos** de otra iglesia, aunque esté en la misma base de datos

---

## Agregar una iglesia nueva

**No se toca ningún archivo de código.** El proceso completo se hace desde el panel `/superadmin` + DNS + Vercel.

---

### Paso 1 — Panel Super Admin (creación automática)

Entrás a `https://tu-dominio.com/superadmin` (o `http://localhost:3000/superadmin` en dev).

Te pide la **clave maestra** (`SUPERADMIN_SECRET` de tu `.env.local`). Esta clave solo la tenés vos.

Completás el formulario:

| Campo | Ejemplo | Notas |
|---|---|---|
| Nombre completo | `Comunidad El Refugio` | Se muestra en la UI |
| Slug | `el-refugio` | Se auto-genera desde el nombre. Solo letras minúsculas, números y guiones. Único por iglesia. |
| Nombre corto | `El Refugio` | Opcional |
| Dominio | `elrefugio.com` | Sin `www.`. El dominio que la iglesia ya tiene o va a registrar. |
| Plan | `basic` / `pro` | |
| Email del pastor | `pastor@elrefugio.com` | Recibirá acceso al CRM |
| Nombre del admin | `Pastor Juan García` | Opcional |

Al hacer click en **"Crear iglesia y usuario admin"**, el sistema hace **automáticamente en una sola transacción:**

1. **Crea la iglesia:** `INSERT INTO churches` con todos los datos (slug, dominio, plan)
2. **Crea el usuario en Supabase Auth:** `supabase.auth.admin.createUser()` con contraseña temporal aleatoria (16 caracteres)
3. **Vincula usuario como admin:** `INSERT INTO church_users` con `role = 'admin'` y `is_active = true`
4. **Setea metadata:** `user_metadata.role = 'admin'` para compatibilidad
5. **Rollback automático:** Si cualquier paso falla, revierte todo (sin datos sucios)

**Resultado que muestra la pantalla:**

```
✓ Iglesia creada: Comunidad El Refugio

Web:   https://elrefugio.com
CRM:   https://crm.elrefugio.com
Censo: https://censo.elrefugio.com

⚠ Contraseña temporal — enviar al pastor de forma segura
Email: pastor@elrefugio.com
Clave: abc123xyz789...
```

> La contraseña temporal **solo aparece una vez** en esta pantalla. Enviásela al pastor por WhatsApp o email privado.

---

### Paso 2 — DNS de la iglesia

En el panel de dominio de la iglesia (GoDaddy, Namecheap, Cloudflare, etc.), agregar:

| Nombre | Tipo | Valor |
|---|---|---|
| `@` (raíz) | A | IP de Vercel (o CNAME a `cname.vercel-dns.com`) |
| `www` | CNAME | `cname.vercel-dns.com` |
| `crm` | CNAME | `cname.vercel-dns.com` |
| `censo` | CNAME | `cname.vercel-dns.com` |

> Con Cloudflare: activar la nube naranja (proxy) para SSL automático.

---

### Paso 3 — Agregar dominios en Vercel

En **Vercel → tu proyecto → Settings → Domains**, agregar los cuatro:

```
elrefugio.com
www.elrefugio.com
crm.elrefugio.com
censo.elrefugio.com
```

Vercel genera el certificado SSL automáticamente para cada uno.

---

### Paso 4 — El pastor recibe acceso

El pastor entra a `crm.elrefugio.com` con su email y contraseña temporal. Desde el CRM puede:
- Cambiar su contraseña
- Invitar más usuarios internos desde **Gestión de Usuarios → Invitar Usuario**
- Compartir el link `censo.elrefugio.com` con sus líderes y miembros

---

### Paso 5 — Los líderes y miembros completan el censo

`censo.elrefugio.com` detecta automáticamente la iglesia por el dominio y asigna el `church_id` correcto en cada registro. Todo aparece en el CRM aislado de las demás iglesias.

---

### Resumen del flujo

```
Vos (superadmin)                  Pastor                    Líderes y miembros
────────────────                  ──────                    ──────────────────
/superadmin
→ completás formulario
→ sistema crea iglesia
  y usuario admin                 → recibe email/WhatsApp
                                    con clave temporal
                                  → entra a crm.dominio.com
                                  → cambia contraseña
                                  → invita colaboradores
                                  → comparte censo.dominio.com  → llenan el censo
                                                                 → aparecen en CRM
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

## Routing por dominio

El archivo `proxy.ts` actúa como middleware de Next.js. Su única función es decidir qué módulo mostrar según el subdominio — no necesita conocer la iglesia.

| Subdominio | Módulo que abre | Login requerido |
|---|---|---|
| `miiglesia.com` | Web pública (Connect) | No |
| `www.miiglesia.com` | Web pública (Connect) | No |
| `censo.miiglesia.com` | Formulario censo (`/lider`) | No |
| `crm.miiglesia.com` | CRM (`/crm/login`) | Sí |

La **identificación de la iglesia** (qué `church_id` usar) se resuelve en el cliente: el `apiClient.js` consulta la tabla `churches` buscando `custom_domain = window.location.hostname`. Esto significa que agregar una nueva iglesia **no requiere ningún cambio en el código**.

En **localhost**, el routing por subdominio no aplica — acceder directamente por ruta:
- Web pública: `http://localhost:3000/connect/home?church=cfc`
- CRM: `http://localhost:3000/crm/login` (church_id se obtiene del usuario logueado)
- Censo: `http://localhost:3000/lider?church=cfc`

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

## Migración Multi-tenant — Detalles técnicos

El sistema fue convertido de single-tenant (solo CFC) a multi-iglesia (SaaS) mediante el script `supabase/multitenant_migration.sql` — **ya ejecutado**.

### Qué hizo la migración

**Paso 1:** Creó la tabla `churches`
- Campos: name, slug, custom_domain, plan, módulos habilitados, branding
- CFC registrada como primer tenant

**Paso 2:** Agregó `church_id` a todas las tablas
- 21 tablas afectadas: personas, connect_*, CRM tables
- Datos existentes migrados automáticamente con el `church_id` de CFC

**Paso 3:** Tabla `church_users`
- Vincula usuarios de Supabase Auth con su iglesia y rol
- CFC: 2 usuarios admin vinculados (developing@, jonapereda@)

**Paso 4:** RLS actualizado
- Función `my_church_id()` — lee el church_id del usuario autenticado
- Políticas por tabla para aislamiento completo
- Web pública: lectura pública, escritura con `church_id` correcto
- CRM: solo usuarios autenticados de la misma iglesia

### Archivo de migración

```
supabase/multitenant_migration.sql  (451 líneas)
```

**Para re-ejecutar** (ej: en otro ambiente):
1. Editar Step 8 con los emails de admin de CFC
2. Ejecutar todo el script en Supabase SQL Editor
3. Verificar con la query final que muestra el resumen

### Cómo revertir (solo si es necesario)

```sql
-- ⚠️ ADVERTENCIA: Esto borra TODAS las iglesias y datos multi-tenant
DROP TABLE IF EXISTS public.church_users CASCADE;
DROP TABLE IF EXISTS public.churches CASCADE;

-- Quitar church_id de todas las tablas (ejemplo para personas):
ALTER TABLE public.personas DROP COLUMN IF EXISTS church_id CASCADE;
-- Repetir para las 21 tablas restantes...
```

> **Mejor práctica:** No revertir. Si hay un error, corregirlo con otro script de migración incremental.

---

## Troubleshooting & Deployment

### Problemas comunes resueltos

#### ❌ "Tu cuenta no tiene permisos para acceder al CRM"

**Causa:** El usuario no está vinculado en la tabla `church_users`.

**Solución:**

1. Verificar que el usuario existe en Supabase Auth (Authentication → Users)
2. Ejecutar el script de vinculación:

```sql
-- En Supabase SQL Editor
DO $$
DECLARE
  cfc_id uuid;
  user_id uuid;
BEGIN
  SELECT id INTO cfc_id FROM churches WHERE slug = 'cfc';
  SELECT id INTO user_id FROM auth.users WHERE email = 'tu-email@cfccasanova.com';
  
  INSERT INTO church_users (church_id, user_id, role, is_active)
  VALUES (cfc_id, user_id, 'admin', true)
  ON CONFLICT (church_id, user_id) DO UPDATE SET role = 'admin', is_active = true;
END $$;
```

3. Verificar con:
```sql
SELECT u.email, cu.role, cu.is_active, c.name
FROM church_users cu
JOIN auth.users u ON u.id = cu.user_id
JOIN churches c ON c.id = cu.church_id
WHERE u.email = 'tu-email@cfccasanova.com';
```

4. **Importante:** Deshabilitar RLS temporalmente si sigue fallando:
```sql
ALTER TABLE church_users DISABLE ROW LEVEL SECURITY;
```

---

#### ❌ 404 en `/superadmin` (producción)

**Causa:** El middleware `proxy.ts` intercepta la ruta y la redirige a `/connect/superadmin`.

**Solución:** Ya está resuelto en commit `9b0bc3f`. Verificar que `proxy.ts` incluya:

```ts
if (
  !pathname.startsWith("/connect") &&
  !pathname.startsWith("/crm") &&
  !pathname.startsWith("/lider") &&
  !pathname.startsWith("/miembros") &&
  !pathname.startsWith("/superadmin")  // ← Esta línea
) {
  // ...redirect logic
}
```

---

#### ❌ "An unexpected Turbopack error occurred"

**Causa:** Archivo `nul` en la carpeta del proyecto (creado por comandos con `2>nul`).

**Solución:**
```bash
rm -f nul
rm -rf .next
npm run dev
```

---

#### ❌ "Invalid Refresh Token" en consola

**Causa:** Sesión expirada o no existe.

**Solución:** Esto es **normal** si no hay usuario logueado. Ignorar el error. Solo es problemático si aparece después de hacer login exitosamente.

---

### Checklist de Deployment a Producción

Cuando hagas `git push`, Vercel redeploy automáticamente. Seguí estos pasos:

#### 1. ✅ Verificar variables de entorno en Vercel

Ve a **Vercel Dashboard → tu proyecto → Settings → Environment Variables** y verificá:

| Variable | Valor | Nota |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sotnuubzcdldctvtwzji.supabase.co` | Público ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key de Supabase) | Público ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key) | **Secreto** 🔒 |
| `NEXT_PUBLIC_DEFAULT_CHURCH_SLUG` | `cfc` | Público ✅ |
| `SUPERADMIN_SECRET` | Tu clave generada con `openssl rand -hex 32` | **Secreto** 🔒 |

**Importante:** Después de agregar/editar variables, hacer **Redeploy** en Vercel.

---

#### 2. ✅ Ejecutar migración SQL en producción

**Solo la primera vez** o si agregaste una nueva iglesia manualmente:

1. Ir a **Supabase Dashboard** de PRODUCCIÓN (no dev)
2. SQL Editor → New query
3. Copiar y pegar `supabase/multitenant_migration.sql`
4. **Modificar Step 8** con los emails correctos de los admins
5. Ejecutar todo el script
6. Verificar resultados:

```sql
SELECT 'churches' AS tabla, count(*) FROM churches
UNION SELECT 'church_users', count(*) FROM church_users
UNION SELECT 'personas con church_id', count(*) FROM personas WHERE church_id IS NOT NULL;
```

Deberías ver al menos 1 church, 1+ church_users, y tus datos con church_id.

---

#### 3. ✅ Verificar deployment en Vercel

1. **Vercel Dashboard → Deployments**
2. El último deployment debería mostrar **"Ready"** (verde)
3. Si dice **"Error"** (rojo):
   - Click en el deployment
   - Ir a la tab **"Build Logs"**
   - Buscar errores en rojo
   - Común: variables de entorno faltantes

---

#### 4. ✅ Probar en producción

**Test 1 — CRM Login:**
1. Ir a `https://crm.cfccasanova.com/login`
2. Ingresar con tu email y contraseña
3. Debería entrar al dashboard sin errores

**Test 2 — Super Admin:**
1. Ir a `https://www.cfccasanova.com/superadmin`
2. Ingresar la clave maestra (`SUPERADMIN_SECRET`)
3. Llenar el formulario de iglesia de prueba
4. Verificar que se crea correctamente

**Test 3 — Censo:**
1. Ir a `https://censo.cfccasanova.com` (o `www.cfccasanova.com/lider`)
2. Llenar formulario como líder
3. Verificar que aparece en CRM → Líderes

---

#### 5. ✅ Verificar aislamiento multi-tenant

**Prueba de aislamiento:**

1. Crear iglesia de prueba desde `/superadmin`
2. Crear usuario admin para esa iglesia
3. Loguearse en CRM con ese admin
4. Verificar que **solo ve datos de su iglesia**, no de CFC

Si ves datos de otra iglesia = RLS mal configurado.

---

### Scripts SQL útiles para debugging

#### Ver todas las iglesias registradas
```sql
SELECT id, name, slug, custom_domain, is_active, plan
FROM churches
ORDER BY created_at DESC;
```

#### Ver todos los admins vinculados
```sql
SELECT 
  c.name AS iglesia,
  u.email,
  cu.role,
  cu.is_active,
  cu.created_at
FROM church_users cu
JOIN churches c ON c.id = cu.church_id
JOIN auth.users u ON u.id = cu.user_id
ORDER BY c.name, u.email;
```

#### Ver políticas RLS activas
```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('church_users', 'personas', 'churches')
ORDER BY tablename, policyname;
```

#### Verificar RLS habilitado/deshabilitado
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('church_users', 'churches', 'personas')
ORDER BY tablename;
```

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
