export const ALLOWED_ORIGINS = [
  "https://defiant-lilly-disfavorably.ngrok-free.dev",
  "https://n8n.vps.duhmarques.cloud",
]

export const IP_WHITELIST: string[] = []

if (process.env.NODE_ENV === "development") {
  ALLOWED_ORIGINS.push("http://localhost:3000", "http://localhost:5678")
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  const cleanOrigin = origin.replace(/\/$/, "")
  return ALLOWED_ORIGINS.some(allowed => {
    const cleanAllowed = allowed.replace(/\/$/, "")
    return cleanOrigin === cleanAllowed || cleanOrigin.startsWith(cleanAllowed)
  })
}

function isN8nUserAgent(userAgent: string | null): boolean {
  return !!userAgent && userAgent.toLowerCase().includes("n8n")
}

export function isRequestAllowed(
  origin: string | null,
  ip: string | null,
  userAgent: string | null,
  bypassWithAuth: boolean = true
): { allowed: boolean; reason?: string } {
  if (bypassWithAuth) return { allowed: true }
  if (origin && isOriginAllowed(origin)) return { allowed: true, reason: "origin" }
  if (isN8nUserAgent(userAgent)) return { allowed: true, reason: "n8n" }
  if (IP_WHITELIST.length > 0 && !IP_WHITELIST.includes(ip?.split(",")[0].trim() || "")) {
    return { allowed: false, reason: "ip_blocked" }
  }
  return { allowed: true }
}

