-- Create fotos table for storing photo metadata
create table if not exists public.fotos (
  id uuid primary key default uuid_generate_v4(),
  ordem_servico_id uuid references public.ordens_servico(id) on delete cascade not null,
  url text not null,
  nome_arquivo text not null,
  descricao text,
  created_at timestamp with time zone default now()
);

-- Create index for better performance
create index if not exists idx_fotos_ordem_servico_id on public.fotos(ordem_servico_id);

-- Enable RLS
alter table public.fotos enable row level security;

-- Create RLS policies
create policy "Enable read access for authenticated users" on public.fotos
  for select
  using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.fotos
  for insert
  with check (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.fotos
  for delete
  using (auth.role() = 'authenticated');

-- Create storage bucket for photos (if not exists)
insert into storage.buckets (id, name, public)
values ('fotos-os', 'fotos-os', true)
on conflict (id) do nothing;

-- Create storage policies
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'fotos-os' );

create policy "Authenticated users can upload photos"
on storage.objects for insert
with check (
  bucket_id = 'fotos-os' 
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can delete their photos"
on storage.objects for delete
using (
  bucket_id = 'fotos-os'
  and auth.role() = 'authenticated'
);
