# Row Level Security (RLS) - Políticas de Segurança no Supabase

## ✅ Status Atual

As políticas RLS estão ativas nas seguintes tabelas:

- ✅ `ordens_servico`
- ✅ `clientes`
- ✅ `veiculos`
- ✅ `procedimentos`
- ✅ `users`
- ✅ `historico_os`
- ✅ `notificacoes`
- ✅ `webhook_logs`

## 📋 Políticas Recomendadas

### 1. Ordens de Serviço

```sql
-- Permitir leitura para usuários autenticados
CREATE POLICY "Authenticated users can view OS"
  ON ordens_servico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'mecanico', 'atendente')
    )
  );

-- Permitir criação para atendentes e admins
CREATE POLICY "Atendentes and admins can create OS"
  ON ordens_servico
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'atendente')
    )
  );

-- Permitir atualização para mecânicos e admins
CREATE POLICY "Mechanics and admins can update OS"
  ON ordens_servico
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'mecanico', 'atendente')
    )
  );

-- Apenas admins podem deletar
CREATE POLICY "Only admins can delete OS"
  ON ordens_servico
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### 2. Clientes

```sql
-- Todos os funcionários podem ver clientes
CREATE POLICY "Staff can view clients"
  ON clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'mecanico', 'atendente')
    )
  );

-- Atendentes e admins podem criar/editar
CREATE POLICY "Atendentes and admins can manage clients"
  ON clientes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'atendente')
    )
  );
```

### 3. Usuários (Funcionários)

```sql
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins podem ver todos
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Apenas admins podem criar/editar/deletar users
CREATE POLICY "Only admins can manage users"
  ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );
```

### 4. Webhook Logs (Auditoria)

```sql
-- Apenas admins podem ver logs
CREATE POLICY "Only admins can view webhook logs"
  ON webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service role pode inserir (bypass RLS)
-- Configurado via SUPABASE_SERVICE_ROLE_KEY
```

## 🚀 Como Aplicar

1. **Via Supabase Dashboard**:
   - Vá em Database → Tables
   - Selecione a tabela
   - Clique em "RLS" tab
   - Ative RLS se não estiver ativo
   - Adicione as políticas

2. **Via SQL Editor**:
   ```sql
   -- Ativar RLS
   ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;
   
   -- Adicionar política
   CREATE POLICY "policy_name"
     ON nome_tabela
     FOR SELECT  -- ou INSERT, UPDATE, DELETE, ALL
     USING (condição_booleana);
   ```

## 🔍 Verificação

### Verificar se RLS está ativo:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Listar políticas existentes:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Testar políticas:

```sql
-- Como usuário específico
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid", "role": "mecanico"}';

-- Execute suas queries para testar
SELECT * FROM ordens_servico;

-- Reset
RESET role;
```

## ⚠️ Importante

1. **Service Role Bypass**: O `SUPABASE_SERVICE_ROLE_KEY` ignora RLS. Use apenas em server-side.

2. **Anon Key**: A `SUPABASE_ANON_KEY` respeita RLS. Use no client-side.

3. **Auth Required**: Certifique-se de que usuários estão autenticados antes de acessar dados protegidos.

4. **Testing**: Sempre teste políticas antes de aplicar em produção.

## 📊 Audit

Execute regularmente para verificar segurança:

```sql
-- Tabelas sem RLS (ALERTA!)
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Políticas permissivas demais
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
AND qual LIKE '%true%';  -- Cuidado com políticas sempre true
```

## 🔄 Atualização de Políticas

Para atualizar uma política existente:

```sql
-- Remover política antiga
DROP POLICY IF EXISTS "policy_name" ON nome_tabela;

-- Criar nova
CREATE POLICY "policy_name" ON nome_tabela ...;
```

---

**Nota**: Este documento deve ser revisado sempre que:
- Novas tabelas forem criadas
- Roles de usuário mudarem
- Requisitos de acesso mudarem

