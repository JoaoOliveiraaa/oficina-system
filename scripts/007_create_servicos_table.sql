-- Tabela de serviços/procedimentos pré-cadastrados
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  valor_padrao decimal(10,2) not null default 0,
  tempo_estimado integer, -- em minutos
  categoria text, -- ex: "Mecânica", "Elétrica", "Estética"
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Índices
create index if not exists idx_servicos_nome on public.servicos(nome);
create index if not exists idx_servicos_categoria on public.servicos(categoria);
create index if not exists idx_servicos_ativo on public.servicos(ativo);

-- RLS
alter table public.servicos enable row level security;

-- Políticas RLS
create policy "Usuários autenticados podem ver serviços"
  on public.servicos for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir serviços"
  on public.servicos for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar serviços"
  on public.servicos for update
  to authenticated
  using (true);

create policy "Usuários autenticados podem deletar serviços"
  on public.servicos for delete
  to authenticated
  using (true);

-- Trigger para atualizar updated_at
create or replace function update_servicos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger servicos_updated_at
  before update on public.servicos
  for each row
  execute function update_servicos_updated_at();

-- Dados de exemplo
insert into public.servicos (nome, descricao, valor_padrao, tempo_estimado, categoria) values
  ('Troca de Óleo', 'Troca de óleo do motor com filtro', 150.00, 30, 'Mecânica'),
  ('Alinhamento', 'Alinhamento de direção', 80.00, 45, 'Mecânica'),
  ('Balanceamento', 'Balanceamento de rodas', 60.00, 30, 'Mecânica'),
  ('Revisão Completa', 'Revisão geral do veículo', 350.00, 180, 'Mecânica'),
  ('Troca de Pastilhas de Freio', 'Substituição das pastilhas de freio', 200.00, 60, 'Mecânica'),
  ('Troca de Bateria', 'Substituição da bateria', 400.00, 20, 'Elétrica'),
  ('Polimento', 'Polimento da pintura', 300.00, 240, 'Estética'),
  ('Lavagem Completa', 'Lavagem interna e externa', 80.00, 60, 'Estética');
