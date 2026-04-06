# 🧪 Prueba Piloto — Portal de Líderes

## 1. Ejecutar script SQL del portal

**Ve a Supabase:** https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/sql/new

**Copia y pega** todo el contenido del archivo `portal_lideres.sql` y haz click en **RUN**.

Deberías ver al final:

```
✓ personas.estado_aprobacion — Columna agregada
✓ leader_materials — Tabla creada
✓ leader_cell_submissions — Tabla creada
✓ leader_prayer_requests — Tabla creada
```

---

## 2. Verificar que Samuel está en la BD

**En Supabase SQL Editor**, ejecutar:

```sql
SELECT id, nombre, apellido, email, rol, estado_aprobacion, church_id
FROM personas
WHERE email = 'samuelmena@cfccasanova.com';
```

Debería devolver 1 fila con:
- `rol = 'Líder'`
- `estado_aprobacion = 'pendiente'` (default)
- `church_id` = el UUID de CFC

---

## 3. Aprobar a Samuel como líder

**En Supabase SQL Editor**, ejecutar:

```sql
UPDATE personas 
SET estado_aprobacion = 'aprobado',
    fecha_aprobacion = now()
WHERE email = 'samuelmena@cfccasanova.com' AND rol = 'Líder';
```

**Verificar que se actualizó:**

```sql
SELECT email, rol, estado_aprobacion, fecha_aprobacion
FROM personas
WHERE email = 'samuelmena@cfccasanova.com';
```

Debería mostrar `estado_aprobacion = 'aprobado'` ✅

---

## 4. Configurar Google OAuth en Supabase

**Ve a:** https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/auth/providers

1. **Click en "Google"** en la lista de providers
2. **Enable Google provider**
3. **Necesitás credenciales de Google Cloud:**

### Opción A: Crear proyecto en Google Cloud (10 min)

1. Ir a: https://console.cloud.google.com/
2. Crear nuevo proyecto (o usar uno existente)
3. Habilitar "Google+ API"
4. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. **Application type:** Web application
6. **Name:** "CFC Portal de Líderes"
7. **Authorized redirect URIs:** 
   ```
   https://sotnuubzcdldctvtwzji.supabase.co/auth/v1/callback
   ```
   (Este URL lo copiás de la config de Supabase)
8. **Create** → Te da Client ID y Client Secret
9. Copiar y pegar en Supabase
10. **Save**

### Opción B: Modo de prueba rápido (si tenés un proyecto existente)

Si ya tenés un proyecto de Google Cloud con OAuth configurado, podés reutilizar esas credenciales temporalmente para la prueba.

---

## 5. Agregar URLs permitidas en Supabase

**Ve a:** https://supabase.com/dashboard/project/sotnuubzcdldctvtwzji/auth/url-configuration

**Agregar en "Redirect URLs":**
```
http://localhost:3000/connect/portal/callback
https://cfccasanova.com/connect/portal/callback
```

**Agregar en "Site URL":**
```
https://cfccasanova.com
```

---

## 6. Probar el login

### En localhost:

1. Ir a: `http://localhost:3000/connect/portal/login`
2. Click en **"Continuar con Google"**
3. Seleccionar la cuenta `samuelmena@cfccasanova.com`
4. Si todo está OK → Redirige a `/connect/portal/dashboard` 🎉

### En producción:

1. Ir a: `https://cfccasanova.com/connect/portal/login`
2. Mismo flujo

---

## 7. Qué esperar en el dashboard

Si el login funciona, deberías ver:

- **Header:** "Hola, Samuel Mena"
- **Estadísticas:** 
  - Reportes (30 días): 0
  - Miembros de célula: 0 (o los que tenga asignados)
  - Pedidos activos: 0
- **4 Cards:**
  - Cargar Reporte
  - Materiales
  - Mis Miembros
  - Pedidos de Oración

---

## 8. Troubleshooting

### Error: "Tu cuenta aún no está aprobada"
→ Verificar que `estado_aprobacion = 'aprobado'` en la BD

### Error: "No estás registrado como líder"
→ Verificar que `rol = 'Líder'` en la BD

### Error en Google OAuth
→ Verificar que las redirect URIs estén correctamente configuradas

### Error: "Invalid Refresh Token"
→ Logout de Google y volver a intentar

---

## 9. Script completo de verificación

```sql
-- Ver todos los líderes y su estado
SELECT 
  nombre,
  apellido,
  email,
  rol,
  estado_aprobacion,
  fecha_aprobacion
FROM personas
WHERE rol = 'Líder'
ORDER BY created_at DESC;

-- Ver si existen las tablas del portal
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'leader_%';

-- Ver church_id de CFC
SELECT id, name, slug, custom_domain 
FROM churches 
WHERE slug = 'cfc';
```

---

## ✅ Checklist de verificación

- [ ] Script `portal_lideres.sql` ejecutado
- [ ] Samuel registrado en censo (`rol = 'Líder'`)
- [ ] Samuel aprobado (`estado_aprobacion = 'aprobado'`)
- [ ] Google OAuth configurado en Supabase
- [ ] Redirect URIs agregadas
- [ ] Login con Google funciona
- [ ] Dashboard del portal carga correctamente

---

¡Ahora sí estás listo para la prueba piloto! 🚀
