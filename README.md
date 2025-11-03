# Sistema de Oficina - Workshop Management System

Sistema completo de gestão de oficina mecânica com controle de estoque, ordens de serviço, notificações automáticas e API webhook para integração com automações externas (n8n, IA, WhatsApp).

## Funcionalidades

- **Gestão de Clientes e Veículos**: Cadastro completo de clientes e seus veículos
- **Ordens de Serviço (OS)**: Criação e acompanhamento de ordens de serviço com status automáticos
- **Controle de Estoque**: Gerenciamento de peças e produtos com alertas de estoque mínimo
- **Notificações Automáticas**: Envio automático de mensagens quando o status da OS muda
- **Upload de Fotos**: Armazenamento de fotos dos veículos e serviços realizados
- **Webhook API**: API para integração com automações externas (n8n, IA, etc.)
- **Histórico e Auditoria**: Registro completo de todas as alterações nas OS
- **Row Level Security (RLS)**: Segurança de dados com políticas de acesso

## Stack Tecnológica

- **Frontend**: Next.js 16 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deploy**: Vercel (frontend) + Supabase (backend)

## Configuração

### 1. Variáveis de Ambiente

As seguintes variáveis de ambiente já estão configuradas no seu projeto Vercel:

\`\`\`env
# Supabase - Já configuradas
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Webhook Secret - ADICIONE ESTA
WEBHOOK_SECRET=your_secure_random_string
\`\`\`

**IMPORTANTE**: Você precisa adicionar a variável `WEBHOOK_SECRET` nas configurações do seu projeto Vercel:

1. Acesse o painel do Vercel
2. Vá em Settings > Environment Variables
3. Adicione `WEBHOOK_SECRET` com um valor seguro (ex: uma string aleatória longa)

### 2. Executar Scripts SQL

Os scripts SQL já foram criados na pasta `/scripts`. Para executá-los:

1. Clique no botão "Run" ao lado de cada script na interface do v0
2. Ou copie e execute manualmente no Supabase SQL Editor

**Ordem de execução:**
1. `001_create_tables.sql` - Cria todas as tabelas
2. `002_enable_rls.sql` - Habilita Row Level Security
3. `003_create_triggers.sql` - Cria triggers automáticos
4. `004_seed_data.sql` - Insere dados de exemplo (opcional)

### 3. Configurar Storage (Opcional)

Para upload de fotos, crie um bucket no Supabase Storage:

1. Acesse o Supabase Dashboard
2. Vá em Storage
3. Crie um bucket chamado `fotos_os`
4. Configure as políticas de acesso conforme necessário

## Webhook API

### Endpoint

\`\`\`
POST /api/webhook
\`\`\`

### Autenticação

Todas as requisições devem incluir o header:

\`\`\`
Authorization: Bearer ${WEBHOOK_SECRET}
\`\`\`

### Ações Disponíveis

#### 1. Criar Ordem de Serviço

\`\`\`json
{
  "acao": "criar_os",
  "cliente": {
    "nome": "João Silva",
    "telefone": "11999999999",
    "email": "joao@example.com",
    "cpf_cnpj": "123.456.789-00",
    "carro": "Honda Civic",
    "placa": "ABC1D23",
    "marca": "Honda",
    "modelo": "Civic",
    "ano": 2020,
    "cor": "Preto"
  },
  "procedimento": {
    "descricao": "Troca de óleo e filtros",
    "observacoes": "Cliente pediu verificar barulho no motor",
    "valor": 250.00
  }
}
\`\`\`

**Resposta:**
\`\`\`json
{
  "success": true,
  "data": {
    "ordem_servico_id": "uuid",
    "numero_os": 1,
    "cliente_id": "uuid",
    "veiculo_id": "uuid",
    "status": "pendente"
  }
}
\`\`\`

#### 2. Atualizar Status da OS

\`\`\`json
{
  "acao": "atualizar_status",
  "numero_os": 1,
  "status": "em_andamento",
  "observacao": "Iniciado serviço de troca de óleo"
}
\`\`\`

**Status disponíveis:**
- `pendente`
- `aguardando_pecas`
- `em_andamento`
- `pronto_retirada`
- `finalizado`
- `cancelado`

**Resposta:**
\`\`\`json
{
  "success": true,
  "data": {
    "ordem_servico_id": "uuid",
    "numero_os": 1,
    "status_anterior": "pendente",
    "status_novo": "em_andamento"
  }
}
\`\`\`

#### 3. Registrar Foto

\`\`\`json
{
  "acao": "registrar_foto",
  "numero_os": 1,
  "foto_url": "https://your-storage.com/foto.jpg"
}
\`\`\`

**Resposta:**
\`\`\`json
{
  "success": true,
  "data": {
    "ordem_servico_id": "uuid",
    "numero_os": 1,
    "total_fotos": 3
  }
}
\`\`\`

#### 4. Consultar OS

\`\`\`json
{
  "acao": "consultar_os",
  "numero_os": 1
}
\`\`\`

**Resposta:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "numero_os": 1,
    "status": "em_andamento",
    "descricao": "Troca de óleo e filtros",
    "cliente": { ... },
    "veiculo": { ... },
    "procedimentos": [ ... ],
    "historico": [ ... ],
    "notificacoes": [ ... ]
  }
}
\`\`\`

### Exemplo de Uso com cURL

\`\`\`bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_webhook_secret" \
  -d '{
    "acao": "criar_os",
    "cliente": {
      "nome": "João Silva",
      "telefone": "11999999999",
      "carro": "Honda Civic",
      "placa": "ABC1D23"
    },
    "procedimento": {
      "descricao": "Troca de óleo e filtros"
    }
  }'
\`\`\`

### Exemplo de Integração com n8n

1. Crie um nó HTTP Request no n8n
2. Configure:
   - **Method**: POST
   - **URL**: `https://your-app.vercel.app/api/webhook`
   - **Authentication**: Header Auth
   - **Header Name**: Authorization
   - **Header Value**: `Bearer ${WEBHOOK_SECRET}`
3. Configure o body com o payload desejado

## Notificações Automáticas

O sistema cria notificações automaticamente quando o status da OS muda:

- **aguardando_pecas**: "Sua ordem de serviço está aguardando peças..."
- **em_andamento**: "Sua ordem de serviço está em andamento..."
- **pronto_retirada**: "Sua ordem de serviço está pronta para retirada!"
- **finalizado**: "Obrigado por confiar em nossos serviços!"

As notificações são inseridas na tabela `notificacoes` com status `pendente`. Você pode:

1. Criar uma Edge Function no Supabase para enviar as notificações
2. Usar um cron job para processar notificações pendentes
3. Integrar com serviços como Twilio, WhatsApp Business API, etc.

## Estrutura do Banco de Dados

### Tabelas Principais

- **clientes**: Dados dos clientes
- **veiculos**: Veículos dos clientes
- **ordens_servico**: Ordens de serviço
- **procedimentos**: Serviços realizados em cada OS
- **estoque**: Controle de peças e produtos
- **os_estoque**: Itens de estoque usados nas OS
- **historico_os**: Histórico de mudanças de status
- **notificacoes**: Notificações a serem enviadas
- **webhook_logs**: Log de todas as chamadas webhook

### Triggers Automáticos

1. **update_updated_at**: Atualiza automaticamente o campo `updated_at`
2. **track_os_status_changes**: Cria entrada no histórico quando status muda
3. **create_notification_on_status_change**: Cria notificação quando status muda
4. **update_stock_on_os_item_insert**: Atualiza estoque quando item é usado

## Desenvolvimento Local

\`\`\`bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
\`\`\`

## Segurança

- **RLS (Row Level Security)**: Todas as tabelas têm RLS habilitado
- **Service Role Key**: Usado apenas no servidor para operações admin
- **Webhook Secret**: Protege a API webhook de acessos não autorizados
- **Middleware**: Protege rotas que requerem autenticação

## Próximos Passos

1. Adicionar autenticação de usuários (funcionários/admin)
2. Criar interface web para gerenciar OS, clientes e estoque
3. Implementar envio real de notificações (Twilio, WhatsApp)
4. Adicionar relatórios e dashboards
5. Implementar upload de fotos para Supabase Storage

## Suporte

Para dúvidas ou problemas, consulte a documentação do Supabase e Next.js.
