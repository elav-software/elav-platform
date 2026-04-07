# 🔐 Estrategia de Autenticación Multi-Tenant

## 📊 Resumen

Sistema de autenticación híbrido diseñado para soportar múltiples iglesias con diferentes necesidades.

---

## 🏗️ Arquitectura

### Portal CRM (Administradores)
- **Método:** Email + Contraseña nativo de Supabase
- **Ruta:** `/crm/login`
- **Usuarios:** Admins de cada iglesia (superadmin, admin)
- **Características:**
  - Login tradicional seguro
  - Gestión completa de la iglesia
  - Sin dependencias externas

### Portal de Líderes/Colaboradores
- **Método Principal:** Google OAuth (SSO)
- **Método Backup:** Email + Contraseña
- **Ruta:** `/connect/portal/login`
- **Usuarios:** Líderes y colaboradores aprobados
- **Características:**
  - Single Sign-On con Google Workspace
  - Compatible con cualquier email (@cfccasanova.com, @gmail.com, etc.)
  - Fallback a email/password si no tienen Google

---

## ✅ Ventajas de esta estrategia

### Para CFC (con Google Workspace)
✅ Líderes usan su email corporativo (@cfccasanova.com)
✅ No necesitan recordar passwords adicionales
✅ Mejor experiencia de usuario
✅ Más seguro (OAuth 2.0)

### Para nuevas iglesias
✅ **Con Google Workspace:** Funciona automáticamente con sus emails corporativos
✅ **Sin Google Workspace:** Usan email/password tradicional
✅ **Un solo OAuth config:** Sirve para TODAS las iglesias
✅ **Escalable:** No hay que configurar nada nuevo por iglesia

---

## 🔄 Flujo de autenticación

### Google OAuth (Recomendado)

```
1. Usuario: Click en "Continuar con Google"
   ↓
2. Google: Pantalla de selección de cuenta
   ↓
3. Usuario: Selecciona su cuenta (@cfccasanova.com o cualquier email)
   ↓
4. Google: Redirige a Supabase con token
   ↓
5. Supabase: Valida el token y crea/actualiza sesión
   ↓
6. App: Verifica que el usuario sea líder aprobado:
   - SELECT * FROM personas WHERE email = ? AND rol = 'Líder' AND estado_aprobacion = 'aprobado'
   ↓
7a. ✅ Si es líder aprobado → Redirige a /connect/portal/dashboard
7b. ❌ Si NO es líder o no está aprobado → Error y logout
```

### Email + Password (Backup)

```
1. Usuario: Ingresa email y password en formulario
   ↓
2. Supabase: Valida credenciales
   ↓
3. App: Verifica que sea líder aprobado (igual que arriba)
   ↓
4a. ✅ Si es válido → Redirige a dashboard
4b. ❌ Si no es válido → Muestra error
```

---

## 🔧 Configuración técnica

### Google OAuth (Una sola vez para todas las iglesias)

**1. Google Cloud Console**
- URL: https://console.cloud.google.com/
- Crear proyecto: "CFC Multi-Tenant Auth"
- Habilitar Google+ API (opcional pero recomendado)

**2. Crear OAuth 2.0 Client ID**
```
Credentials → Create Credentials → OAuth 2.0 Client ID
- Application Type: Web application
- Name: CFC Portal de Líderes
- Authorized redirect URIs:
  https://sotnuubzcdldctvtwzji.supabase.co/auth/v1/callback
```

**3. Obtener credenciales**
```
Client ID: 123456789-abc123.apps.googleusercontent.com
Client Secret: GOCSPX-xyz789abc456
```

**4. Configurar en Supabase**
```
Dashboard → Authentication → Providers → Google
- Enable Sign in with Google: ON
- Client ID: [pegar desde Google Cloud]
- Client Secret: [pegar desde Google Cloud]
- Save
```

**5. Configurar URLs en Supabase**
```
Authentication → URL Configuration
- Redirect URLs:
  http://localhost:3000/connect/portal/callback
  https://cfccasanova.com/connect/portal/callback
- Site URL:
  https://cfccasanova.com
```

---

## 👥 Gestión de usuarios

### Para líderes con Google Workspace

**Flujo automático:**
1. Líder completa formulario de censo con email corporativo
2. Pastor lo marca como "Líder" y "aprobado" en CRM
3. Líder va a `/connect/portal/login`
4. Click en "Continuar con Google"
5. ✅ Acceso directo (no hay que crear usuario manualmente)

**Cómo aprobar:**
```sql
UPDATE personas 
SET estado_aprobacion = 'aprobado',
    fecha_aprobacion = now()
WHERE email = 'samuel.mena@cfccasanova.com' 
  AND rol = 'Líder';
```

### Para líderes sin Google (Email/Password)

**1. Crear usuario en Supabase:**
```
Dashboard → Authentication → Users → Add user → Create new user
- Email: lider@ejemplo.com
- Password: [temporal, lo cambia después]
- Auto Confirm User: ON
```

**2. Aprobar en BD (igual que arriba):**
```sql
UPDATE personas 
SET estado_aprobacion = 'aprobado',
    fecha_aprobacion = now()
WHERE email = 'lider@ejemplo.com';
```

---

## 🏢 Para nuevas iglesias

### Iglesia con Google Workspace

**Setup (1 minuto):**
```
1. Crear church_id en tabla churches
2. Cargar datos de líderes en tabla personas con email corporativo
3. Aprobar líderes
4. ✅ Listo! Pueden loguearse con Google
```

**NO hay que:**
- ❌ Configurar nada nuevo en Google Cloud
- ❌ Crear usuarios manualmente en Supabase
- ❌ Comprar dominios específicos

### Iglesia sin Google Workspace

**Setup (5 minutos):**
```
1. Crear church_id en tabla churches
2. Cargar líderes en personas
3. Crear usuarios en Supabase (email/password)
4. Aprobar líderes
5. ✅ Listo! Pueden loguearse con email/password
```

---

## 🛡️ Seguridad

### Validaciones implementadas

**1. Verificación de líder aprobado**
```javascript
const verifyApprovedLeader = async (email) => {
  const churchId = await getCurrentChurchId();
  
  const { data } = await supabase
    .from('personas')
    .select('id, rol, estado_aprobacion')
    .eq('church_id', churchId)
    .eq('email', email)
    .eq('rol', 'Líder')
    .eq('estado_aprobacion', 'aprobado')
    .single();

  return !!data;
}
```

**2. Aislamiento por church_id**
- Todas las queries filtran por `church_id`
- RLS (Row Level Security) activo en Supabase
- Un líder de Iglesia A NO puede ver datos de Iglesia B

**3. Estado de aprobación**
- `pendiente`: No puede acceder al portal
- `aprobado`: Acceso completo
- `rechazado`: Bloqueado permanentemente

---

## 📝 Mantenimiento

### Revocar acceso a un líder
```sql
UPDATE personas 
SET estado_aprobacion = 'rechazado'
WHERE email = 'lider@ejemplo.com';
```

### Ver todos los líderes pendientes
```sql
SELECT nombre, apellido, email, created_at
FROM personas
WHERE rol = 'Líder' 
  AND estado_aprobacion = 'pendiente'
ORDER BY created_at DESC;
```

### Aprobar múltiples líderes
```sql
UPDATE personas 
SET estado_aprobacion = 'aprobado',
    fecha_aprobacion = now()
WHERE rol = 'Líder' 
  AND estado_aprobacion = 'pendiente'
  AND id IN ('uuid1', 'uuid2', 'uuid3');
```

---

## 🚀 Checklist de implementación

### Configuración inicial (una sola vez)
- [ ] Crear proyecto en Google Cloud Console
- [ ] Configurar OAuth 2.0 Client ID
- [ ] Obtener Client ID y Client Secret
- [ ] Habilitar Google provider en Supabase
- [ ] Pegar credenciales en Supabase
- [ ] Configurar Redirect URLs en Supabase
- [ ] Probar login con cuenta de prueba

### Por cada nueva iglesia
- [ ] Crear registro en tabla `churches`
- [ ] Cargar líderes en tabla `personas`
- [ ] Aprobar líderes iniciales
- [ ] Probar login de un líder

---

## 🔗 Referencias

- **Google Cloud Console:** https://console.cloud.google.com/
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **OAuth 2.0 Spec:** https://oauth.net/2/

---

**Última actualización:** Abril 2026
**Mantenido por:** Equipo CFC Tech
