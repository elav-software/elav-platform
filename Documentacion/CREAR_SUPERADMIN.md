# Cómo asignar el rol Superadmin a un usuario

El superadmin puede acceder al CRM de **todas** las iglesias y al portal de líderes sin restricciones.

---

## Requisitos previos

- Tener acceso al **SQL Editor** de Supabase.
- El usuario debe existir en `auth.users` (que haya iniciado sesión al menos una vez, o fue creado manualmente en Supabase Auth).

---

## Paso 1 — Verificar que `church_id` es nullable

> **Solo la primera vez.** Si ya se ejecutó antes, saltear este paso.

```sql
ALTER TABLE public.church_users ALTER COLUMN church_id DROP NOT NULL;
```

---

## Paso 2 — Asignar el rol

### Caso A: el usuario ya existe en `church_users`

```sql
UPDATE public.church_users
SET role = 'superadmin', is_active = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email ILIKE 'email@ejemplo.com'
);
```

Verificar que devuelve `1 row affected`. Si devuelve 0 filas afectadas (el usuario no tiene ninguna fila en `church_users`), usar el Caso B.

> ⚠️ **No usar el Caso B si ya existe una fila** — se generaría un duplicado. El UPDATE del Caso A actualiza todas las filas del usuario al mismo tiempo.

### Caso B: el usuario NO está en `church_users` (nuevo)

```sql
INSERT INTO public.church_users (user_id, church_id, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email ILIKE 'email@ejemplo.com'),
  NULL,
  'superadmin',
  true
);
```

---

## Paso 3 — Verificar

```sql
SELECT u.email, cu.role, cu.is_active, cu.church_id
FROM public.church_users cu
JOIN auth.users u ON u.id = cu.user_id
WHERE cu.role = 'superadmin';
```

Debería aparecer el email del usuario con `role = superadmin`.

---

## Paso 4 — El usuario debe cerrar sesión y volver a entrar

Los cambios de rol solo se reflejan en la próxima sesión.

---

## Cómo revocar el rol superadmin

```sql
UPDATE public.church_users
SET role = 'admin'  -- o 'user' según corresponda
WHERE user_id = (
  SELECT id FROM auth.users WHERE email ILIKE 'email@ejemplo.com'
);
```
