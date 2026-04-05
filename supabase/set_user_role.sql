-- Actualizar rol de un usuario
-- Valores posibles: 'admin' | 'user'
-- Reemplazá el email y el rol antes de ejecutar

update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
where email = 'reemplazar@email.com';

-- Verificar que quedó bien
select
  email,
  raw_user_meta_data->>'role' as role
from auth.users
where email = 'reemplazar@email.com';
