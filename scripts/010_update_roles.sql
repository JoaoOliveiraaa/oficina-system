-- Remove recepcionista role and update to only admin and mecanico
-- Update the check constraint on users table
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('admin', 'mecanico'));

-- Update default role to admin
alter table public.users alter column role set default 'admin';

-- Update trigger function to set default role as admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, nome)
  values (
    new.id,
    new.email,
    'admin', -- default role is now admin
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Update any existing recepcionista users to mecanico
update public.users set role = 'mecanico' where role = 'recepcionista';
