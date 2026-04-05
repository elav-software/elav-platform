-- =============================================================================
-- Seguridad de tablas existentes
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

-- 1. Habilitar RLS en las tablas del censo
alter table public.personas        enable row level security;
alter table public.cells           enable row level security;
alter table public.churches        enable row level security;
alter table public.users           enable row level security;
alter table public.event_attendance enable row level security;
alter table public.attendance       enable row level security;

-- 2. Políticas para personas
--    - Cualquiera puede insertar (el formulario del censo es público)
--    - Solo autenticados pueden leer, editar y borrar
drop policy if exists "public_insert_personas"       on public.personas;
drop policy if exists "authenticated_read_personas"  on public.personas;
drop policy if exists "authenticated_update_personas" on public.personas;
drop policy if exists "authenticated_delete_personas" on public.personas;

create policy "public_insert_personas"
  on public.personas for insert
  to anon, authenticated
  with check (true);

create policy "authenticated_read_personas"
  on public.personas for select
  to authenticated
  using (true);

create policy "authenticated_update_personas"
  on public.personas for update
  to authenticated
  using (true);

create policy "authenticated_delete_personas"
  on public.personas for delete
  to authenticated
  using (true);

-- 3. Políticas para cells, churches, users
--    - Solo autenticados pueden leer y escribir
do $$
declare
  tbl text;
  tables text[] := array['cells', 'churches', 'users'];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "authenticated_full_access" on public.%I', tbl);
    execute format(
      'create policy "authenticated_full_access" on public.%I
       for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- 4. Verificar que todas las tablas tienen RLS habilitado
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;
