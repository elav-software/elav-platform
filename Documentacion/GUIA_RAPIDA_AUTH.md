# ⚡ Guía Rápida - Configuración Google OAuth

## 📋 Checklist de 10 minutos

### ✅ Paso 1: Google Cloud Console (5 min)

**URL:** https://console.cloud.google.com/

1. Crear proyecto: "CFC Multi-Tenant Auth"
2. APIs & Services → Credentials
3. Create Credentials → OAuth 2.0 Client ID
4. Si te pide: Configurar OAuth Consent Screen primero (External)
5. Application type: **Web application**
6. Name: "CFC Portal Web"
7. Authorized redirect URIs:
   ```
   https://sotnuubzcdldctvtwzji.supabase.co/auth/v1/callback
   ```
8. CREATE
9. Copiar:
   - Client ID
   - Client Secret

### ✅ Paso 2: Supabase (2 min)

**URL:** https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/auth/providers

1. Click en **Google**
2. Enable Sign in with Google: **ON**
3. Pegar Client ID
4. Pegar Client Secret
5. **Save**

### ✅ Paso 3: URLs en Supabase (1 min)

**URL:** https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/auth/url-configuration

Redirect URLs:
```
http://localhost:3000/connect/portal/callback
https://cfccasanova.com/connect/portal/callback
```

Site URL:
```
https://cfccasanova.com
```

### ✅ Paso 4: Aprobar un líder (2 min)

**SQL Editor:** https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/sql/new

```sql
-- Ver líderes pendientes
SELECT nombre, apellido, email, rol, estado_aprobacion
FROM personas
WHERE rol = 'Líder'
ORDER BY nombre;

-- Aprobar a Samuel
UPDATE personas 
SET estado_aprobacion = 'aprobado',
    fecha_aprobacion = now()
WHERE email = 'samuel.mena@cfccasanova.com' 
  AND rol = 'Líder';

-- Verificar
SELECT email, estado_aprobacion, fecha_aprobacion
FROM personas
WHERE email = 'samuel.mena@cfccasanova.com';
```

### ✅ Paso 5: Probar (1 min)

1. Iniciar app: `npm run dev`
2. Ir a: http://localhost:3000/connect/portal/login
3. Click "Continuar con Google"
4. Seleccionar cuenta samuel.mena@cfccasanova.com
5. ✅ Debería redirigir a dashboard

---

## 🎯 URLs importantes

| Recurso | URL |
|---------|-----|
| Google Cloud Console | https://console.cloud.google.com/ |
| Supabase Auth Providers | https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/auth/providers |
| Supabase URL Config | https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/auth/url-configuration |
| Supabase SQL Editor | https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/sql/new |
| Portal Login (dev) | http://localhost:3000/connect/portal/login |
| Portal Login (prod) | https://cfccasanova.com/connect/portal/login |

---

## 🐛 Troubleshooting rápido

### Error: "Tu cuenta aún no está aprobada"
```sql
-- Verificar estado
SELECT estado_aprobacion FROM personas WHERE email = 'tu-email@cfccasanova.com';

-- Si es 'pendiente', aprobarlo:
UPDATE personas SET estado_aprobacion = 'aprobado' WHERE email = 'tu-email@cfccasanova.com';
```

### Error: "No estás registrado como líder"
```sql
-- Verificar rol
SELECT rol FROM personas WHERE email = 'tu-email@cfccasanova.com';

-- Si no existe, crear persona primero en CRM o con SQL
```

### Error: redirect_uri_mismatch (de Google)
```
✅ Verificar que la redirect URI en Google Cloud sea EXACTAMENTE:
https://sotnuubzcdldctvtwzji.supabase.co/auth/v1/callback

❌ NO incluir espacios, barras extras, http en vez de https, etc.
```

### Error: Invalid Refresh Token
```
1. Cerrar sesión en Google
2. Borrar cookies del navegador
3. Volver a intentar
```

---

## 📝 Queries SQL útiles

```sql
-- Ver todos los líderes
SELECT nombre, apellido, email, estado_aprobacion, created_at
FROM personas
WHERE rol = 'Líder'
ORDER BY created_at DESC;

-- Aprobar múltiples líderes
UPDATE personas 
SET estado_aprobacion = 'aprobado', fecha_aprobacion = now()
WHERE rol = 'Líder' AND estado_aprobacion = 'pendiente';

-- Revocar acceso
UPDATE personas 
SET estado_aprobacion = 'rechazado'
WHERE email = 'lider@ejemplo.com';

-- Ver líderes con sus miembros
SELECT 
  l.nombre || ' ' || l.apellido as lider,
  l.email,
  l.estado_aprobacion,
  COUNT(m.id) as cantidad_miembros
FROM personas l
LEFT JOIN personas m ON m.lider_id = l.id
WHERE l.rol = 'Líder'
GROUP BY l.id, l.nombre, l.apellido, l.email, l.estado_aprobacion
ORDER BY l.nombre;

-- Ver stats de autenticación
SELECT 
  estado_aprobacion,
  COUNT(*) as cantidad
FROM personas
WHERE rol = 'Líder'
GROUP BY estado_aprobacion;
```

---

## 🔑 Credenciales de ejemplo (desarrollo)

Para testing local, podés usar:
- Email: samuel.mena@cfccasanova.com
- Provider: Google OAuth (tu cuenta personal de Google para testing)

O crear un usuario manual:
- Email: test@cfccasanova.com  
- Password: Test123!
- (Crearlo en Supabase Dashboard → Authentication → Users)

---

**Última actualización:** Abril 2026
