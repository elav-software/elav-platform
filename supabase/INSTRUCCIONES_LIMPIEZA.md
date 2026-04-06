# 🧹 Guía: Limpieza de Datos y Setup de Prueba

## 📋 Problema Actual

1. ❌ No aparece "Aprobación de Líderes" en CRM
2. ❌ Hay líderes y contactos duplicados
3. ❓ Necesitamos datos de prueba consistentes

---

## ✅ Solución Paso a Paso

### 🔴 PASO 1: Verificar si Portal de Líderes está instalado

**Ir a Supabase → SQL Editor**

```sql
-- Ejecutar esto para verificar columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'personas' 
  AND column_name IN ('estado_aprobacion', 'fecha_aprobacion', 'aprobado_por')
ORDER BY column_name;
```

**Resultado esperado:**
```
aprobado_por          | uuid
estado_aprobacion     | text  
fecha_aprobacion      | timestamptz
```

**Si NO aparecen las 3 columnas:**
1. Abrir archivo `portal_lideres.sql` (el que está seleccionado ahora)
2. Copiar TODO el contenido
3. Supabase → SQL Editor → Pegar → Run
4. Verificar que aparezcan **4 checkmarks verdes** ✓

---

### 🟡 PASO 2: Ver duplicados (NO borra nada aún)

Abrir `cleanup_and_test_data.sql` y ejecutar **SOLO HASTA LA LÍNEA 66**:

```sql
-- Desde línea 1 hasta línea 66
-- (TODO lo que está ANTES del comentario "PASO 3: LIMPIEZA")
```

Esto te va a mostrar:
- ✅ Cuántas columnas existen
- 📊 Lista de emails duplicados
- 📊 Lista de teléfonos duplicados

**NO ejecutar TODO el archivo todavía.**

---

### 🟢 PASO 3A: Limpiar duplicados (SI querés mantener algunos datos)

Si querés **mantener algunos líderes reales** y solo borrar duplicados:

```sql
-- Descomenta líneas 70-84 del archivo cleanup_and_test_data.sql
-- (Busca "PASO 3: LIMPIEZA DE DUPLICADOS")

WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY email 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM public.personas
  WHERE email IS NOT NULL AND email != ''
)
DELETE FROM public.personas
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

Esto **mantiene el registro más reciente** de cada email y borra los duplicados.

---

### 🔴 PASO 3B: Empezar DE CERO (borra TODO)

Si preferís **borrar todo y empezar limpio** para testing:

```sql
-- Descomenta líneas 94-103 del archivo cleanup_and_test_data.sql
-- (Busca "PASO 4: BORRAR TODOS LOS DATOS DE PRUEBA")

DELETE FROM public.leader_cell_submissions;
DELETE FROM public.leader_prayer_requests;
DELETE FROM public.personas;
```

⚠️ **Esto borra absolutamente todo.** Solo hacerlo si estás en testing.

---

### 🟢 PASO 4: Generar líderes de prueba

Ejecutar **desde la línea 109 hasta el final** del archivo `cleanup_and_test_data.sql`.

Esto va a crear:
- ✅ **3 líderes aprobados** (pueden entrar al portal)
- ⏳ **5 líderes pendientes** (aparecen en CRM para aprobar)
- ❌ **1 líder rechazado** (ejemplo)
- 👤 **1 miembro normal** (no es líder)

**Emails de prueba generados:**
```
samuelmena@cfccasanova.com        → Aprobado
mariagonzalez@cfccasanova.com     → Pendiente
carlosrodriguez@cfccasanova.com   → Pendiente
anamartinez@cfccasanova.com       → Aprobado
pedrofernandez@cfccasanova.com    → Pendiente
lauragomez@cfccasanova.com        → Rechazado
jorgelopez@cfccasanova.com        → Pendiente
silviaramirez@cfccasanova.com     → Pendiente
robertodiaz@cfccasanova.com       → Miembro (no líder)
patriciatorres@cfccasanova.com    → Aprobado
```

---

### 🟣 PASO 5: Verificar en CRM

1. Ir a `https://censo-iglesia.vercel.app/crm/login` (o tu dominio)
2. Login con tu cuenta admin
3. **Deberías ver:**
   - 🔔 Badge naranja con número "5" en el sidebar
   - 📋 Link "Aprobación de Líderes"
   - Al hacer click → Ver los 5 líderes pendientes

**Si NO aparece el badge:**
- ✅ Asegurarte que el build se deployed (commit `941d91b`)
- ✅ Refresh forzado: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
- ✅ Abrir DevTools → Console → Ver si hay errores

---

## 📊 Verificación Final

Ejecutar esto para ver el resumen:

```sql
-- Ver estadísticas
SELECT 
  rol,
  estado_aprobacion,
  COUNT(*) as cantidad
FROM public.personas
GROUP BY rol, estado_aprobacion
ORDER BY rol, estado_aprobacion;
```

**Resultado esperado:**
```
Líder  | aprobado   | 3
Líder  | pendiente  | 5
Líder  | rechazado  | 1
Miembro| NULL       | 1
```

---

## 🐛 Troubleshooting

### "No aparece Aprobación de Líderes en CRM"

**Causa 1:** El deployment de Vercel no está actualizado
- Ir a Vercel → censo-iglesia → Ver que el commit `941d91b` esté deployed
- Debe decir "Ready" con ✅

**Causa 2:** Cache del navegador
- Hacer `Ctrl+Shift+R` para refresh forzado
- O abrir en ventana incógnita

**Causa 3:** No ejecutaste portal_lideres.sql
- Volver al PASO 1 arriba

**Causa 4:** Hay un error de JavaScript
- Abrir DevTools (F12) → Console
- Ver si hay errores en rojo
- Compartir captura si hay errores

### "Tengo duplicados otra vez"

Si seguís cargando el censo múltiples veces con el mismo email, va a seguir creando duplicados. Opciones:

1. **Ejecutar la limpieza periódicamente** (PASO 3A)
2. **Agregar constraint UNIQUE al email:**
   ```sql
   -- SOLO si querés prevenir duplicados en el futuro
   ALTER TABLE public.personas
   ADD CONSTRAINT unique_email_per_church 
   UNIQUE (church_id, email);
   ```

---

## 🎯 Próximos Pasos

Después de completar estos pasos:

1. ✅ Aprobar un líder de prueba desde CRM
2. ✅ Configurar Google OAuth para portal
3. ✅ Loguearse como líder aprobado
4. ✅ Probar envío de reportes de célula

---

## 📞 Ayuda

Si algo no funciona, compartir:
- Captura del resultado del PASO 1 (verificación de columnas)
- Captura de la consola del navegador (F12 → Console)
- Captura del sidebar del CRM (para ver si aparece el badge)
