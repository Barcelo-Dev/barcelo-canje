-- ============================================================
--  Migración: perfiles con roles + campos de canje
--  Sitio de canje (barcelo-canje). Ejecutar UNA vez en Supabase > SQL Editor.
-- ============================================================

-- 1) Campos de canje en la tabla de suscriptores
alter table public.subscribers add column if not exists reward_given text;
alter table public.subscribers add column if not exists redeemed_by_name text;

-- 2) Tabla de perfiles con rol (camarero / supervisor / admin)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'camarero'
             check (role in ('camarero','supervisor','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuario puede leer su propio perfil (la app lee roles por service_role,
-- pero esto es útil por seguridad).
drop policy if exists "leer propio perfil" on public.profiles;
create policy "leer propio perfil" on public.profiles
  for select to authenticated using (id = auth.uid());

-- 3) Al crear un usuario nuevo en Supabase, se crea su perfil con rol
--    'camarero' por defecto. Luego el admin le cambia el rol si corresponde.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'camarero')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Backfill: los usuarios que YA existían quedan como 'admin'
--    (el usuario admin actual del portal de consultas). Ajusta si hace falta.
insert into public.profiles (id, role)
  select id, 'admin' from auth.users
  on conflict (id) do nothing;

-- ============================================================
--  CÓMO ASIGNAR ROLES A NUEVOS USUARIOS
--  1) Crea el usuario en Authentication > Users > Add user.
--  2) Se crea su perfil como 'camarero' automáticamente.
--  3) Para ponerle nombre y/o cambiar el rol, ejecuta (ejemplos):
--
--     update public.profiles set full_name = 'Juan (mesero)'
--     where id = (select id from auth.users where email = 'mesero1@barcelo.com');
--
--     update public.profiles set role = 'supervisor', full_name = 'Marta (supervisora)'
--     where id = (select id from auth.users where email = 'supervisor@barcelo.com');
-- ============================================================
