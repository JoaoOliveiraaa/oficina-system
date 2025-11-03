-- Migrate existing auth users to the users table
-- This script will add any auth.users that don't have a corresponding entry in public.users

insert into public.users (id, email, nome, role, ativo)
select 
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'nome', split_part(au.email, '@', 1)) as nome,
  'admin' as role, -- Set first user as admin, others can be changed later
  true as ativo
from auth.users au
where not exists (
  select 1 from public.users pu where pu.id = au.id
)
on conflict (id) do nothing;

-- Optional: Update the first user to be admin if not already
-- update public.users 
-- set role = 'admin' 
-- where id = (select id from public.users order by created_at asc limit 1)
-- and role != 'admin';
