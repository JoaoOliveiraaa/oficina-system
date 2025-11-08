import { NextRequest } from "next/server"

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  maxRequests: number
  windowSeconds: number
  identifier?: (request: NextRequest) => string
}

export function rateLimit(options: RateLimitOptions) {
  const { maxRequests, windowSeconds, identifier } = options

  return (request: NextRequest): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now()
    const key = identifier ? identifier(request) : getClientIp(request)

    if (Math.random() < 0.01) cleanupOldEntries(now)

    const record = rateLimitMap.get(key)

    if (!record || now > record.resetAt) {
      const resetAt = now + windowSeconds * 1000
      rateLimitMap.set(key, { count: 1, resetAt })
      return { allowed: true, remaining: maxRequests - 1, resetAt }
    }

    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt }
    }

    record.count++
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt }
  }
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
         request.headers.get("x-real-ip") || 
         "unknown"
}

function cleanupOldEntries(now: number) {
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) rateLimitMap.delete(key)
  }
}

