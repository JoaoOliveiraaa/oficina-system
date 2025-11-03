-- Drop all existing policies on users table to fix infinite recursion
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Admins can update all users" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Admins can insert users" on public.users;
drop policy if exists "System can insert users" on public.users;

-- Create a function to check if user is admin (avoids recursion)
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users
    where id = user_id and role = 'admin'
  );
$$;

-- Simple policies without recursion
-- Allow users to view their own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Allow admins to view all users (using function to avoid recursion)
create policy "Admins view all"
  on public.users for select
  using (public.is_admin(auth.uid()));

-- Allow users to update their own profile (but not role)
create policy "Users update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    role = (select role from public.users where id = auth.uid())
  );

-- Allow admins to update any user
create policy "Admins update all"
  on public.users for update
  using (public.is_admin(auth.uid()));

-- Allow admins to insert new users
create policy "Admins insert users"
  on public.users for insert
  with check (public.is_admin(auth.uid()));

-- Allow system to insert users (for signup trigger)
create policy "System insert users"
  on public.users for insert
  with check (auth.uid() = id);

-- Allow admins to delete users
create policy "Admins delete users"
  on public.users for delete
  using (public.is_admin(auth.uid()));
