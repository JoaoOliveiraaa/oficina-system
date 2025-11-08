# 🛡️ Security Modules - Documentação

Este diretório contém todos os módulos de segurança do sistema.

## 📁 Módulos

### 1. `rate-limit.ts`
**Rate limiting** para prevenir abuso de APIs.

```typescript
import { rateLimit } from "@/lib/security/rate-limit"

const limiter = rateLimit({
  maxRequests: 60,
  windowSeconds: 60,
})

// Em um handler
const result = limiter(request)
if (!result.allowed) {
  return Response.json({ error: "Too many requests" }, { status: 429 })
}
```

**Configurações típicas:**
- Webhook público: 60 req/min
- APIs internas: 30 req/min  
- Login: 5 req/min

**⚠️ Produção:** Use Redis para rate limiting distribuído.

---

### 2. `input-validation.ts`
**Validação e sanitização** de dados de entrada.

```typescript
import {
  sanitizeString,
  isValidEmail,
  isValidPhone,
  isValidCpfCnpj,
  isValidPlaca,
  isValidStatus,
  validateCriarOSPayload,
} from "@/lib/security/input-validation"

// Sanitizar string
const nome = sanitizeString(userInput) // Remove <>, limita tamanho

// Validar email
if (!isValidEmail(email)) {
  return error("Email inválido")
}

// Validar payload completo
const validation = validateCriarOSPayload(data)
if (!validation.valid) {
  return error(validation.errors)
}
```

**Validações disponíveis:**
- ✅ Email (RFC compliant)
- ✅ Telefone brasileiro (10-11 dígitos)
- ✅ CPF/CNPJ (formato básico)
- ✅ Placa veicular (antigo e Mercosul)
- ✅ Status de OS
- ✅ Número de OS
- ✅ URL (http/https)

---

### 3. `headers.ts`
**Headers de segurança** HTTP.

```typescript
import { 
  addSecurityHeaders, 
  createSecureWebhookResponse,
  maskSensitiveData 
} from "@/lib/security/headers"

// Adicionar headers em resposta existente
const response = NextResponse.json({ data })
return addSecurityHeaders(response)

// Criar resposta com headers automáticos
return createSecureWebhookResponse({ data }, 200)

// Mascarar dados sensíveis em logs
const safeData = maskSensitiveData(userData)
console.log(safeData) // CPF, senhas, tokens mascarados
```

**Headers aplicados:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- CORS headers para webhooks

---

### 4. `origin-whitelist.ts`
**Whitelist de origens** e IPs para n8n.

```typescript
import { 
  isRequestAllowed, 
  logWhitelistCheck,
  ALLOWED_ORIGINS,
  IP_WHITELIST 
} from "@/lib/security/origin-whitelist"

// Verificar se requisição é permitida
const origin = request.headers.get("origin")
const ip = request.headers.get("x-forwarded-for")
const userAgent = request.headers.get("user-agent")

const check = isRequestAllowed(origin, ip, userAgent, true)
logWhitelistCheck(origin, ip, userAgent, check)

if (!check.allowed) {
  return error("Origin not allowed")
}
```

**Configuração:**

Edite `origin-whitelist.ts`:

```typescript
export const ALLOWED_ORIGINS = [
  "https://seu-n8n.ngrok.io",
  "https://n8n.seudominio.com",
]

export const IP_WHITELIST = [
  // "192.168.1.100", // Adicione IPs fixos aqui
]
```

**Quando usar:**
- ✅ **Origin whitelist**: Sempre (ngrok, domínios)
- ⚠️ **IP whitelist**: Apenas para IPs fixos (VPS, servidores dedicados)

---

## 🔐 Uso Combinado

### Exemplo: Endpoint Webhook Seguro

```typescript
import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/security/rate-limit"
import { createSecureWebhookResponse } from "@/lib/security/headers"
import { validateCriarOSPayload } from "@/lib/security/input-validation"
import { isRequestAllowed, logWhitelistCheck } from "@/lib/security/origin-whitelist"

const limiter = rateLimit({ maxRequests: 60, windowSeconds: 60 })

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  
  // 1. Rate limiting
  const rateCheck = limiter(request)
  if (!rateCheck.allowed) {
    return createSecureWebhookResponse(
      { error: "Too many requests" },
      429
    )
  }
  
  // 2. Autenticação
  if (!validateAuth(request)) {
    return createSecureWebhookResponse(
      { error: "Unauthorized" },
      401
    )
  }
  
  // 3. Whitelist (opcional com auth)
  const origin = request.headers.get("origin")
  const ua = request.headers.get("user-agent")
  const whitelistCheck = isRequestAllowed(origin, ip, ua, true)
  logWhitelistCheck(origin, ip, ua, whitelistCheck)
  
  // 4. Validação de payload
  const data = await request.json()
  const validation = validateCriarOSPayload(data)
  if (!validation.valid) {
    return createSecureWebhookResponse(
      { error: "Invalid data", details: validation.errors },
      400
    )
  }
  
  // 5. Processar...
  const result = await processar(validation.data)
  
  return createSecureWebhookResponse(result)
}
```

---

## 🚀 Checklist de Segurança

Ao criar novo endpoint de API:

- [ ] Rate limiting aplicado
- [ ] Validação de entrada implementada
- [ ] Sanitização de dados
- [ ] Headers de segurança (via middleware ou manual)
- [ ] Logs não expõem dados sensíveis
- [ ] Erros não vazam informações internas
- [ ] Whitelist configurada (se necessário)
- [ ] Testes de segurança realizados

---

## 🧪 Testes

### Testar Rate Limiting

```bash
# 70 requisições em sequência (deve bloquear após 60)
for i in {1..70}; do
  curl -X POST https://seu-app.vercel.app/api/webhook \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"acao":"consultar_os","numero_os":1}'
  sleep 0.1
done
```

### Testar Validação

```bash
# Teste SQL Injection
curl -X POST https://seu-app.vercel.app/api/webhook \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"acao":"criar_os","cliente":{"nome":"'\''; DROP TABLE users;--","telefone":"11999999999"}}'

# Teste XSS
curl -X POST https://seu-app.vercel.app/api/webhook \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"acao":"criar_os","cliente":{"nome":"<script>alert(1)</script>","telefone":"11999999999"}}'
```

### Testar Whitelist

```bash
# Requisição de origem não whitelisted
curl -X POST https://seu-app.vercel.app/api/webhook \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: https://malicious-site.com" \
  -d '{"acao":"consultar_os","numero_os":1}'
```

---

## 📊 Métricas

### Overhead de Performance

| Módulo | Tempo médio | Impacto |
|--------|-------------|---------|
| Rate Limit | ~0.5ms | Mínimo |
| Validação | ~3-5ms | Baixo |
| Headers | ~0.2ms | Mínimo |
| Whitelist | ~0.3ms | Mínimo |
| **Total** | **~4-6ms** | **Baixo** |

---

## 🔄 Manutenção

### Atualizar Whitelist

1. Edite `origin-whitelist.ts`
2. Adicione novos domínios/IPs
3. Deploy (não precisa restart)

### Ajustar Rate Limits

1. Edite o valor em cada endpoint
2. Considere usar Redis para produção
3. Monitor métricas antes de ajustar

### Adicionar Novas Validações

1. Adicione função em `input-validation.ts`
2. Exporte a função
3. Use nos endpoints necessários

---

## 🆘 Troubleshooting

### "Too many requests"
- Verifique se rate limit está adequado
- Use Redis para produção distribuída
- Considere aumentar limite para n8n

### "Origin not allowed"
- Adicione origem em `ALLOWED_ORIGINS`
- Verifique se origin está sendo enviado
- Use `logWhitelistCheck` para debug

### "Invalid data"
- Verifique payload enviado
- Consulte erro específico em `details`
- Valide formato conforme documentação

---

**Última atualização:** Novembro 2024
**Versão:** 2.0

