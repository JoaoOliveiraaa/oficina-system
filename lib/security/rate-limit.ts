import { NextRequest } from "next/server"

// Simple in-memory rate limiter (use Redis in production for distributed systems)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  /**
   * Número máximo de requisições permitidas no intervalo
   */
  maxRequests: number
  /**
   * Janela de tempo em segundos
   */
  windowSeconds: number
  /**
   * Identificador customizado (padrão: IP)
   */
  identifier?: (request: NextRequest) => string
}

/**
 * Rate limiter simples baseado em IP
 * Para produção com múltiplas instâncias, use Redis ou similar
 */
export function rateLimit(options: RateLimitOptions) {
  const { maxRequests, windowSeconds, identifier } = options

  return (request: NextRequest): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now()
    const key = identifier ? identifier(request) : getClientIp(request)

    // Limpa entradas antigas periodicamente
    if (Math.random() < 0.01) {
      // 1% de chance de limpar
      cleanupOldEntries(now)
    }

    const record = rateLimitMap.get(key)

    if (!record || now > record.resetAt) {
      // Primeira requisição ou janela expirada
      const resetAt = now + windowSeconds * 1000
      rateLimitMap.set(key, { count: 1, resetAt })
      return { allowed: true, remaining: maxRequests - 1, resetAt }
    }

    if (record.count >= maxRequests) {
      // Limite excedido
      return { allowed: false, remaining: 0, resetAt: record.resetAt }
    }

    // Incrementa contador
    record.count++
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt }
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "unknown"
  )
}

function cleanupOldEntries(now: number) {
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}

