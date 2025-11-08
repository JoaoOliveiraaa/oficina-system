import { NextResponse } from "next/server"

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

export const WEBHOOK_CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value))
  return response
}

export function createSecureWebhookResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  Object.entries({ ...SECURITY_HEADERS, ...WEBHOOK_CORS_HEADERS }).forEach(([key, value]) => 
    response.headers.set(key, value)
  )
  return response
}

const sensitiveKeys = ["password", "senha", "token", "secret", "authorization", "cpf", "cnpj", "cpf_cnpj"]

export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data
  
  const masked = { ...data }
  
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      if (typeof masked[key] === "string" && masked[key].length > 0) {
        const value = masked[key]
        masked[key] = value.length <= 4 ? "***" : `${value.substring(0, 2)}...${value.substring(value.length - 2)}`
      }
    }
    
    if (typeof masked[key] === "object" && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key])
    }
  }
  
  return masked
}

