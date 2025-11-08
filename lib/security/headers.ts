import { NextResponse } from "next/server"

/**
 * Headers de segurança para adicionar em todas as respostas da API
 */
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  
  // Enable XSS protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",
  
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions Policy (restrict features)
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  
  // Don't expose server information
  "X-Powered-By": "NextJS",
}

/**
 * Headers CORS específicos para webhooks (mais restritivo que *)
 */
export const WEBHOOK_CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 horas
}

/**
 * Adiciona headers de segurança a uma resposta
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Cria resposta com headers de segurança + CORS para webhook
 */
export function createSecureWebhookResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add CORS headers
  Object.entries(WEBHOOK_CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Mascara informações sensíveis para logs
 */
export function maskSensitiveData(data: any): any {
  if (!data) return data
  
  const masked = { ...data }
  
  const sensitiveKeys = ["password", "senha", "token", "secret", "authorization", "cpf", "cnpj", "cpf_cnpj"]
  
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      if (typeof masked[key] === "string" && masked[key].length > 0) {
        // Mostra apenas primeiros e últimos caracteres
        const value = masked[key]
        if (value.length <= 4) {
          masked[key] = "***"
        } else {
          masked[key] = `${value.substring(0, 2)}...${value.substring(value.length - 2)}`
        }
      }
    }
    
    // Recursivo para objetos aninhados
    if (typeof masked[key] === "object" && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key])
    }
  }
  
  return masked
}

