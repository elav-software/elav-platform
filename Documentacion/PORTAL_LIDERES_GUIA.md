# Portal de Líderes — Guía de Uso y Administración

## ¿Qué es el Portal de Líderes?

Es una sección privada dentro de la app Connect (`/connect/portal`) exclusiva para líderes aprobados por el CRM. Permite a cada líder ver su información, reportar su célula, cargar pedidos de oración y acceder a materiales exclusivos.

---

## Acceso

| Ruta | Descripción |
|------|-------------|
| `/connect/portal/login` | Login con Google o email/contraseña |
| `/connect/portal/dashboard` | Panel principal del líder |
| `/connect/portal/materiales` | Materiales exclusivos (PDFs, videos, links) |
| `/connect/portal/miembros` | Miembros de la célula del líder |
| `/connect/portal/reportes` | Envío de reportes de célula |
| `/connect/portal/oracion` | Pedidos de oración |

---

## Flujo completo: del registro al acceso

```
1. Líder completa el formulario → cfccasanova.com/lider
2. Admin ve la solicitud en CRM → /crm/leaders/approvals
3. Admin aprueba al líder → se crea registro en tabla `leaders`
4. Líder recibe su cuenta Google Workspace (ej: nombre@cfccasanova.com)
5. Líder entra al portal con esa cuenta → /connect/portal/login
6. El sistema verifica que su email esté en `personas` con estado = 'aprobado'
7. Accede al dashboard
```

---

## Cómo cargar Materiales para Líderes

Los materiales se cargan directamente en la base de datos desde el **SQL Editor de Supabase** o desde una futura pantalla de admin.

### Tipos de materiales soportados

| Tipo | Descripción |
|------|-------------|
| `pdf` | Documento PDF (subir a Supabase Storage y usar la URL pública) |
| `video` | Link a YouTube o Vimeo |
| `link` | Cualquier URL externa |
| `document` | Google Docs, Word, etc. |

### Cómo subir un PDF a Supabase Storage

1. En Supabase → **Storage** → crear bucket `leader-materials` (si no existe)
2. Configurar bucket como **público**
3. Subir el archivo PDF
4. Copiar la URL pública (ej: `https://sotnuubzcdldctvtwzji.supabase.co/storage/v1/object/public/leader-materials/archivo.pdf`)

### SQL para insertar un material

```sql
-- Reemplazar los valores según el material
INSERT INTO public.leader_materials (church_id, title, description, type, url, category, is_active)
VALUES (
  (SELECT id FROM churches WHERE slug = 'cfc'),  -- church_id de CFC
  'Manual del Líder de Célula',                  -- título
  'Guía completa para liderar una célula',        -- descripción (opcional)
  'pdf',                                         -- tipo: pdf | video | link | document
  'https://sotnuubzcdldctvtwzji.supabase.co/storage/v1/object/public/leader-materials/manual-lider.pdf',
  'Formación',                                   -- categoría (opcional)
  true                                           -- visible para líderes
);

-- Para cargar un video de YouTube:
INSERT INTO public.leader_materials (church_id, title, type, url, category, is_active)
VALUES (
  (SELECT id FROM churches WHERE slug = 'cfc'),
  'Taller de Liderazgo — Parte 1',
  'video',
  'https://www.youtube.com/watch?v=XXXXXXXXX',
  'Capacitación',
  true
);
```

### SQL para listar los materiales activos

```sql
SELECT title, type, category, url, created_at
FROM leader_materials
WHERE church_id = (SELECT id FROM churches WHERE slug = 'cfc')
  AND is_active = true
ORDER BY created_at DESC;
```

### SQL para desactivar un material (no aparece en el portal)

```sql
UPDATE leader_materials
SET is_active = false
WHERE id = 'uuid-del-material';
```

---

## Reportes de Célula

Los líderes envían reportes desde `/connect/portal/reportes`. Cada reporte incluye:

- Fecha del reporte
- Asistencia (número de personas)
- Visitantes nuevos
- Ofrenda
- Testimonios
- Observaciones

### SQL para ver todos los reportes de una iglesia

```sql
SELECT 
  lcs.report_date,
  lcs.leader_email,
  l.full_name AS lider,
  lcs.attendance_count,
  lcs.new_visitors,
  lcs.offering_amount,
  lcs.status
FROM leader_cell_submissions lcs
JOIN leaders l ON l.id = lcs.leader_id
WHERE lcs.church_id = (SELECT id FROM churches WHERE slug = 'cfc')
ORDER BY lcs.report_date DESC;
```

### SQL para marcar un reporte como revisado

```sql
UPDATE leader_cell_submissions
SET status = 'reviewed',
    reviewed_at = now(),
    reviewed_by = auth.uid()  -- debe ejecutarse como usuario admin logueado
WHERE id = 'uuid-del-reporte';
```

---

## Pedidos de Oración

Los líderes cargan pedidos desde `/connect/portal/oracion`.

### Campos disponibles

| Campo | Descripción |
|-------|-------------|
| `prayer_for` | Nombre de la persona por quien se ora |
| `request_text` | Texto del pedido |
| `category` | salud, familia, trabajo, ministerio, etc. |
| `is_urgent` | Urgente (se resalta) |
| `is_confidential` | Solo visible para el líder que lo cargó y admins |

### SQL para ver pedidos activos

```sql
SELECT leader_email, prayer_for, request_text, category, is_urgent, is_confidential, created_at
FROM leader_prayer_requests
WHERE church_id = (SELECT id FROM churches WHERE slug = 'cfc')
  AND status = 'active'
ORDER BY is_urgent DESC, created_at DESC;
```

---

## Miembros del Líder

La sección `/connect/portal/miembros` muestra los miembros que tienen asignado el `lider_id` correspondiente en la tabla `personas`.

Para asignar miembros a un líder en el CRM, el campo `lider_id` en `personas` debe apuntar al `id` del líder en esa misma tabla.

---

## Seguridad (RLS)

| Tabla | Quién accede |
|-------|-------------|
| `leader_materials` | Cualquier usuario autenticado de la misma iglesia |
| `leader_cell_submissions` | Cada líder ve solo sus propios reportes; admins ven todos |
| `leader_prayer_requests` | Cada líder ve los suyos + no confidenciales; admins ven todos |

---

## Troubleshooting

| Problema | Causa | Solución |
|---------|-------|---------|
| Líder no puede entrar al portal | No está aprobado o email no coincide | Verificar `estado_aprobacion = 'aprobado'` en `personas` y que el email coincida exactamente (case-insensitive) |
| Dashboard muestra vacío | `lider_id` no está seteado en `personas` | Aprobar desde CRM → AprobacionesLíderes |
| Material no aparece | `is_active = false` | Ejecutar UPDATE para activarlo |
| Reporte no se guarda | `leader_id` inválido | Verificar que el líder exista en tabla `leaders` |
