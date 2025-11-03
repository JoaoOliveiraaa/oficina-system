-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clientes (Clients)
create table if not exists public.clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text not null,
  email text,
  cpf_cnpj text,
  endereco text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Veículos (Vehicles)
create table if not exists public.veiculos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  marca text not null,
  modelo text not null,
  placa text not null unique,
  ano integer,
  cor text,
  km_atual integer,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Estoque (Inventory/Stock)
create table if not exists public.estoque (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  codigo text unique,
  quantidade integer not null default 0,
  preco_custo numeric(10, 2),
  preco_venda numeric(10, 2),
  estoque_minimo integer default 0,
  categoria text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ordens de Serviço (Service Orders)
create table if not exists public.ordens_servico (
  id uuid primary key default uuid_generate_v4(),
  numero_os serial unique not null,
  cliente_id uuid references public.clientes(id) on delete restrict,
  veiculo_id uuid references public.veiculos(id) on delete restrict,
  status text not null default 'pendente' check (status in ('pendente', 'aguardando_pecas', 'em_andamento', 'pronto_retirada', 'finalizado', 'cancelado')),
  descricao text not null,
  observacoes text,
  valor_total numeric(10, 2) default 0,
  valor_pago numeric(10, 2) default 0,
  fotos text[] default '{}',
  data_entrada timestamp with time zone default now(),
  data_prevista timestamp with time zone,
  data_conclusao timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Procedimentos (Procedures/Services performed)
create table if not exists public.procedimentos (
  id uuid primary key default uuid_generate_v4(),
  ordem_servico_id uuid references public.ordens_servico(id) on delete cascade,
  descricao text not null,
  valor numeric(10, 2) default 0,
  tempo_estimado integer, -- em minutos
  status text default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Itens de Estoque usados na OS (Stock items used in service orders)
create table if not exists public.os_estoque (
  id uuid primary key default uuid_generate_v4(),
  ordem_servico_id uuid references public.ordens_servico(id) on delete cascade,
  estoque_id uuid references public.estoque(id) on delete restrict,
  quantidade integer not null default 1,
  preco_unitario numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- Histórico de OS (Service Order History)
create table if not exists public.historico_os (
  id uuid primary key default uuid_generate_v4(),
  ordem_servico_id uuid references public.ordens_servico(id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  observacao text,
  usuario text,
  created_at timestamp with time zone default now()
);

-- Notificações (Notifications)
create table if not exists public.notificacoes (
  id uuid primary key default uuid_generate_v4(),
  ordem_servico_id uuid references public.ordens_servico(id) on delete cascade,
  tipo text not null check (tipo in ('whatsapp', 'sms', 'email')),
  destinatario text not null,
  mensagem text not null,
  status text default 'pendente' check (status in ('pendente', 'enviado', 'erro')),
  erro_mensagem text,
  enviado_em timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Webhook Logs (for debugging and auditing)
create table if not exists public.webhook_logs (
  id uuid primary key default uuid_generate_v4(),
  acao text not null,
  payload jsonb not null,
  status text not null check (status in ('sucesso', 'erro')),
  erro_mensagem text,
  ip_origem text,
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_veiculos_cliente_id on public.veiculos(cliente_id);
create index if not exists idx_veiculos_placa on public.veiculos(placa);
create index if not exists idx_ordens_servico_cliente_id on public.ordens_servico(cliente_id);
create index if not exists idx_ordens_servico_veiculo_id on public.ordens_servico(veiculo_id);
create index if not exists idx_ordens_servico_status on public.ordens_servico(status);
create index if not exists idx_ordens_servico_numero_os on public.ordens_servico(numero_os);
create index if not exists idx_procedimentos_ordem_servico_id on public.procedimentos(ordem_servico_id);
create index if not exists idx_os_estoque_ordem_servico_id on public.os_estoque(ordem_servico_id);
create index if not exists idx_historico_os_ordem_servico_id on public.historico_os(ordem_servico_id);
create index if not exists idx_notificacoes_ordem_servico_id on public.notificacoes(ordem_servico_id);
create index if not exists idx_notificacoes_status on public.notificacoes(status);
