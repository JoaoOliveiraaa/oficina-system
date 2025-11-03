-- Enable Row Level Security on all tables
alter table public.clientes enable row level security;
alter table public.veiculos enable row level security;
alter table public.estoque enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.procedimentos enable row level security;
alter table public.os_estoque enable row level security;
alter table public.historico_os enable row level security;
alter table public.notificacoes enable row level security;
alter table public.webhook_logs enable row level security;

-- Policies for authenticated users (funcionários/admin)
-- For now, we'll allow all authenticated users to access everything
-- In production, you should refine these policies based on user roles

-- Clientes policies
create policy "Allow authenticated users to view clientes"
  on public.clientes for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert clientes"
  on public.clientes for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update clientes"
  on public.clientes for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete clientes"
  on public.clientes for delete
  using (auth.role() = 'authenticated');

-- Veículos policies
create policy "Allow authenticated users to view veiculos"
  on public.veiculos for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert veiculos"
  on public.veiculos for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update veiculos"
  on public.veiculos for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete veiculos"
  on public.veiculos for delete
  using (auth.role() = 'authenticated');

-- Estoque policies
create policy "Allow authenticated users to view estoque"
  on public.estoque for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert estoque"
  on public.estoque for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update estoque"
  on public.estoque for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete estoque"
  on public.estoque for delete
  using (auth.role() = 'authenticated');

-- Ordens de Serviço policies
create policy "Allow authenticated users to view ordens_servico"
  on public.ordens_servico for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert ordens_servico"
  on public.ordens_servico for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update ordens_servico"
  on public.ordens_servico for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete ordens_servico"
  on public.ordens_servico for delete
  using (auth.role() = 'authenticated');

-- Procedimentos policies
create policy "Allow authenticated users to view procedimentos"
  on public.procedimentos for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert procedimentos"
  on public.procedimentos for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update procedimentos"
  on public.procedimentos for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete procedimentos"
  on public.procedimentos for delete
  using (auth.role() = 'authenticated');

-- OS Estoque policies
create policy "Allow authenticated users to view os_estoque"
  on public.os_estoque for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert os_estoque"
  on public.os_estoque for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update os_estoque"
  on public.os_estoque for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete os_estoque"
  on public.os_estoque for delete
  using (auth.role() = 'authenticated');

-- Histórico OS policies
create policy "Allow authenticated users to view historico_os"
  on public.historico_os for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert historico_os"
  on public.historico_os for insert
  with check (auth.role() = 'authenticated');

-- Notificações policies
create policy "Allow authenticated users to view notificacoes"
  on public.notificacoes for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert notificacoes"
  on public.notificacoes for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update notificacoes"
  on public.notificacoes for update
  using (auth.role() = 'authenticated');

-- Webhook Logs policies (admin only for viewing)
create policy "Allow authenticated users to view webhook_logs"
  on public.webhook_logs for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert webhook_logs"
  on public.webhook_logs for insert
  with check (auth.role() = 'authenticated');
