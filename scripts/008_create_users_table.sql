-- Create users table to store additional user information and roles
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nome text,
  telefone text,
  role text not null check (role in ('admin', 'mecanico', 'recepcionista')) default 'recepcionista',
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Create index for faster lookups
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);

-- Policies: users can view their own profile
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

-- Admins can view all users
create policy "Admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update all users
create policy "Admins can update all users"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can update their own profile (except role)
create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    role = (select role from public.users where id = auth.uid())
  );

-- Admins can insert new users
create policy "Admins can insert users"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow system to insert users (for trigger)
create policy "System can insert users"
  on public.users for insert
  with check (true);

-- Trigger function to auto-create user profile when auth user is created
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
    'recepcionista', -- default role
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Trigger to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_users_updated on public.users;
create trigger on_users_updated
  before update on public.users
  for each row
  execute function public.handle_updated_at();

-- Insert first admin user (you'll need to create this user via signup first)
-- Then run this to make them admin:
-- update public.users set role = 'admin' where email = 'seu-email@admin.com';
