-- Consultar rol de un usuario
-- Reemplazá el email antes de ejecutar

select
  email,
  raw_user_meta_data->>'role' as role,
  created_at
from auth.users
where email = 'reemplazar@email.com';
