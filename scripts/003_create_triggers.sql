-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_clientes_updated_at
  before update on public.clientes
  for each row
  execute function public.update_updated_at_column();

create trigger update_veiculos_updated_at
  before update on public.veiculos
  for each row
  execute function public.update_updated_at_column();

create trigger update_estoque_updated_at
  before update on public.estoque
  for each row
  execute function public.update_updated_at_column();

create trigger update_ordens_servico_updated_at
  before update on public.ordens_servico
  for each row
  execute function public.update_updated_at_column();

create trigger update_procedimentos_updated_at
  before update on public.procedimentos
  for each row
  execute function public.update_updated_at_column();

-- Function to create history entry when OS status changes
create or replace function public.create_os_history()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into public.historico_os (ordem_servico_id, status_anterior, status_novo, observacao)
    values (new.id, old.status, new.status, 'Status atualizado automaticamente');
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger for OS status changes
create trigger track_os_status_changes
  after update on public.ordens_servico
  for each row
  execute function public.create_os_history();

-- Function to create notification when OS status changes
create or replace function public.create_os_notification()
returns trigger as $$
declare
  cliente_telefone text;
  mensagem_texto text;
begin
  if old.status is distinct from new.status then
    -- Get client phone
    select c.telefone into cliente_telefone
    from public.clientes c
    where c.id = new.cliente_id;
    
    -- Create message based on status
    case new.status
      when 'aguardando_pecas' then
        mensagem_texto := 'Olá! Sua ordem de serviço #' || new.numero_os || ' está aguardando peças. Entraremos em contato assim que chegarem.';
      when 'em_andamento' then
        mensagem_texto := 'Olá! Sua ordem de serviço #' || new.numero_os || ' está em andamento. Em breve seu veículo estará pronto!';
      when 'pronto_retirada' then
        mensagem_texto := 'Olá! Sua ordem de serviço #' || new.numero_os || ' está pronta para retirada! Aguardamos você.';
      when 'finalizado' then
        mensagem_texto := 'Obrigado por confiar em nossos serviços! Ordem de serviço #' || new.numero_os || ' finalizada.';
      else
        mensagem_texto := null;
    end case;
    
    -- Insert notification if message was created
    if mensagem_texto is not null and cliente_telefone is not null then
      insert into public.notificacoes (ordem_servico_id, tipo, destinatario, mensagem)
      values (new.id, 'whatsapp', cliente_telefone, mensagem_texto);
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger for OS notifications
create trigger create_notification_on_status_change
  after update on public.ordens_servico
  for each row
  execute function public.create_os_notification();

-- Function to update stock when items are used in OS
create or replace function public.update_stock_on_os_item()
returns trigger as $$
begin
  -- Decrease stock quantity
  update public.estoque
  set quantidade = quantidade - new.quantidade
  where id = new.estoque_id;
  
  return new;
end;
$$ language plpgsql;

-- Trigger for stock updates
create trigger update_stock_on_os_item_insert
  after insert on public.os_estoque
  for each row
  execute function public.update_stock_on_os_item();
