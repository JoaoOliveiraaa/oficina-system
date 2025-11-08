/**
 * Origin/Domain Whitelist para n8n e outros serviços externos
 * 
 * Nota: Use origin whitelist em vez de IP whitelist quando:
 * - Usar ngrok (IP dinâmico)
 * - Usar serviços com IPs rotativos
 * 
 * Para IPs fixos, adicione em IP_WHITELIST abaixo
 */

// Domínios permitidos para acessar o webhook
export const ALLOWED_ORIGINS = [
  "https://defiant-lilly-disfavorably.ngrok-free.dev",
  "https://n8n.vps.duhmarques.cloud",
  // Adicione outros domínios do n8n aqui
]

// IPs permitidos (se seu n8n tiver IP fixo)
// Para obter o IP do seu VPS: ping n8n.vps.duhmarques.cloud
export const IP_WHITELIST = [
  // Exemplo: "192.168.1.100",
  // Adicione o IP do seu VPS aqui se quiser validação extra
]

// Localhost/development sempre permitido em dev
if (process.env.NODE_ENV === "development") {
  ALLOWED_ORIGINS.push("http://localhost:3000", "http://localhost:5678") // 5678 é porta padrão do n8n
}

/**
 * Verifica se a origem da requisição está na whitelist
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  // Remove trailing slash para comparação
  const cleanOrigin = origin.replace(/\/$/, "")
  
  return ALLOWED_ORIGINS.some(allowed => {
    const cleanAllowed = allowed.replace(/\/$/, "")
    return cleanOrigin === cleanAllowed || cleanOrigin.startsWith(cleanAllowed)
  })
}

/**
 * Verifica se o IP está na whitelist
 */
export function isIpAllowed(ip: string | null): boolean {
  if (!ip) return false
  if (IP_WHITELIST.length === 0) return true // Se lista vazia, permite todos
  
  // Extrai primeiro IP se vier múltiplos (x-forwarded-for)
  const clientIp = ip.split(",")[0].trim()
  
  return IP_WHITELIST.includes(clientIp)
}

/**
 * Verifica se User-Agent é do n8n
 */
export function isN8nUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return userAgent.toLowerCase().includes("n8n")
}

/**
 * Validação combinada (OR logic - qualquer uma passa)
 */
export function isRequestAllowed(
  origin: string | null,
  ip: string | null,
  userAgent: string | null,
  bypassWithAuth: boolean = true // Se tem auth válida, permite independente de whitelist
): { allowed: boolean; reason?: string } {
  // Se tem autenticação válida, permite (já validada antes)
  if (bypassWithAuth) {
    return { allowed: true }
  }
  
  // Verifica origem
  if (origin && isOriginAllowed(origin)) {
    return { allowed: true, reason: "origin_whitelisted" }
  }
  
  // Verifica IP (se whitelist configurada)
  if (IP_WHITELIST.length > 0 && !isIpAllowed(ip)) {
    return { allowed: false, reason: "ip_not_whitelisted" }
  }
  
  // Verifica User-Agent do n8n como fallback
  if (isN8nUserAgent(userAgent)) {
    return { allowed: true, reason: "n8n_user_agent" }
  }
  
  // Se chegou aqui e tem IP whitelist configurada, bloqueia
  if (IP_WHITELIST.length > 0) {
    return { allowed: false, reason: "ip_whitelist_enabled_but_not_matched" }
  }
  
  // Se não tem whitelist de IP configurada, permite
  return { allowed: true, reason: "no_ip_whitelist" }
}

/**
 * Log de requisição com informações de whitelist
 */
export function logWhitelistCheck(
  origin: string | null,
  ip: string | null,
  userAgent: string | null,
  result: { allowed: boolean; reason?: string }
) {
  console.log(`[WHITELIST]`, {
    origin: origin?.substring(0, 50),
    ip,
    userAgent: userAgent?.substring(0, 50),
    allowed: result.allowed,
    reason: result.reason,
  })
}

