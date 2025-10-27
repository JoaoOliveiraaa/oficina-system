-- Seed some example data for testing

-- Insert example clients
insert into public.clientes (nome, telefone, email, cpf_cnpj) values
  ('João Silva', '11999999999', 'joao@example.com', '123.456.789-00'),
  ('Maria Santos', '11988888888', 'maria@example.com', '987.654.321-00'),
  ('Pedro Oliveira', '11977777777', 'pedro@example.com', '456.789.123-00')
on conflict do nothing;

-- Insert example vehicles
insert into public.veiculos (cliente_id, marca, modelo, placa, ano, cor) 
select 
  c.id,
  'Honda',
  'Civic',
  'ABC1D23',
  2020,
  'Preto'
from public.clientes c
where c.nome = 'João Silva'
on conflict (placa) do nothing;

insert into public.veiculos (cliente_id, marca, modelo, placa, ano, cor) 
select 
  c.id,
  'Toyota',
  'Corolla',
  'XYZ9W87',
  2021,
  'Branco'
from public.clientes c
where c.nome = 'Maria Santos'
on conflict (placa) do nothing;

-- Insert example stock items
insert into public.estoque (nome, descricao, codigo, quantidade, preco_custo, preco_venda, estoque_minimo, categoria) values
  ('Óleo de Motor 5W30', 'Óleo sintético para motor', 'OLE-001', 50, 25.00, 45.00, 10, 'Lubrificantes'),
  ('Filtro de Óleo', 'Filtro de óleo universal', 'FIL-001', 30, 15.00, 30.00, 5, 'Filtros'),
  ('Filtro de Ar', 'Filtro de ar universal', 'FIL-002', 25, 20.00, 40.00, 5, 'Filtros'),
  ('Pastilha de Freio', 'Pastilha de freio dianteira', 'FRE-001', 20, 80.00, 150.00, 5, 'Freios'),
  ('Disco de Freio', 'Disco de freio dianteiro', 'FRE-002', 15, 120.00, 220.00, 3, 'Freios'),
  ('Bateria 60Ah', 'Bateria automotiva 60Ah', 'BAT-001', 10, 250.00, 450.00, 2, 'Elétrica'),
  ('Vela de Ignição', 'Vela de ignição NGK', 'VEL-001', 40, 12.00, 25.00, 10, 'Ignição')
on conflict (codigo) do nothing;
