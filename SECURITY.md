# Documentação de Segurança - Sistema de Oficina

## 🛡️ Visão Geral

Este documento descreve as medidas de segurança implementadas no sistema.

## ✅ Medidas Implementadas

### 1. **Rate Limiting**

Proteção contra ataques de força bruta e DoS:

- **Webhook API**: 60 requisições por minuto por IP
- **Notify Status Change**: 30 requisições por minuto por IP
- Implementação em memória (para produção distribuída, considere Redis)

### 2. **Validação e Sanitização de Entrada**

Todas as APIs validam e sanitizam dados de entrada:

- ✅ Validação de email, telefone, CPF/CNPJ
- ✅ Validação de placas de veículos
- ✅ Sanitização de strings (remoção de caracteres perigosos)
- ✅ Limite de tamanho de payloads (100KB)
- ✅ Validação de tipos de dados
- ✅ Validação de ranges (anos, valores)

### 3. **Headers de Segurança**

Headers HTTP de segurança em todas as respostas:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: [configurado no middleware]
```

### 4. **Autenticação e Autorização**

- ✅ **Webhook**: Autenticação via Bearer token (timing-safe comparison)
- ✅ **Employee APIs**: Verificação de role admin
- ✅ **RLS (Row Level Security)**: Políticas no Supabase
- ✅ Prevenção de timing attacks na comparação de tokens

### 5. **Logs Seguros**

- ✅ Não expõe tokens completos nos logs
- ✅ Máscaras de dados sensíveis (CPF, senhas, tokens)
- ✅ Logs estruturados com timestamp e IP
- ✅ Logs de auditoria para ações críticas

### 6. **CORS Configurado**

- ✅ Headers CORS apropriados para webhooks
- ✅ Suporte a OPTIONS preflight

### 7. **Proteção contra Ataques Comuns**

- ✅ **SQL Injection**: Uso de ORMs e queries parametrizadas (Supabase)
- ✅ **XSS**: Sanitização de entrada e CSP headers
- ✅ **CSRF**: Tokens SameSite e verificação de origem
- ✅ **Timing Attacks**: Comparação timing-safe de tokens

## 🔐 Configuração Necessária

### Variáveis de Ambiente Obrigatórias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Webhook Security
WEBHOOK_SECRET=your_secure_random_string_minimum_32_chars

# N8N (opcional)
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_AUTH_TOKEN=your_n8n_token (opcional, use somente se configurou auth no n8n)
```

### Geração de Token Seguro

```bash
# Linux/Mac
openssl rand -hex 32

# PowerShell (Windows)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚨 Recomendações Adicionais

### Para Produção

1. **Rate Limiting Distribuído**
   - Use Redis ou similar para rate limiting entre múltiplas instâncias
   - Considere Cloudflare Rate Limiting

2. **Firewall de Aplicação Web (WAF)**
   - Cloudflare
   - AWS WAF
   - Vercel Edge Middleware

3. **Monitoramento**
   - Configure alertas para tentativas de auth falhadas
   - Monitor logs de segurança
   - Use ferramentas como Sentry para tracking de erros

4. **IP Whitelist (Opcional)**
   - Se o n8n tiver IP fixo, adicione whitelist no webhook
   - Adicione no arquivo `lib/security/ip-whitelist.ts`

5. **HTTPS Only**
   - Force HTTPS em produção (configurado por padrão no Vercel)
   - HSTS headers já configurados

6. **Atualizações**
   - Mantenha dependências atualizadas
   - Faça auditorias regulares: `npm audit`

### Proteção RLS no Supabase

Certifique-se de que as políticas RLS estão ativas:

```sql
-- Exemplo de política RLS
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias OS"
  ON ordens_servico
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'mecanico', 'atendente')
  ));
```

## 📊 Teste de Segurança

### Testes Recomendados

1. **Rate Limiting**
   ```bash
   # Teste rate limiting
   for i in {1..70}; do
     curl -X POST https://seu-dominio/api/webhook \
       -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"acao":"consultar_os","numero_os":1}'
     sleep 0.1
   done
   ```

2. **Validação de Entrada**
   ```bash
   # Teste SQL injection
   curl -X POST https://seu-dominio/api/webhook \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"acao":"criar_os","cliente":{"nome":"'; DROP TABLE users;--","telefone":"11999999999"},"procedimento":{"descricao":"test"}}'
   ```

3. **XSS**
   ```bash
   # Teste XSS
   curl -X POST https://seu-dominio/api/webhook \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"acao":"criar_os","cliente":{"nome":"<script>alert(1)</script>","telefone":"11999999999"},"procedimento":{"descricao":"test"}}'
   ```

## 🆘 Resposta a Incidentes

### Em caso de suspeita de comprometimento:

1. **Imediatamente**:
   - Revogue o `WEBHOOK_SECRET` atual
   - Gere um novo token
   - Atualize no Vercel e n8n

2. **Análise**:
   - Verifique logs do Vercel
   - Verifique `webhook_logs` no Supabase
   - Identifique IPs suspeitos

3. **Mitigação**:
   - Bloqueie IPs maliciosos
   - Atualize políticas de segurança
   - Notifique usuários se necessário

## 📞 Contato

Para reportar vulnerabilidades de segurança, por favor, não abra issues públicas.
Entre em contato diretamente via [seu-email-de-seguranca@example.com]

---

**Última atualização**: Novembro 2024
**Versão do Sistema**: 2.0
**Responsável**: Equipe de Desenvolvimento

