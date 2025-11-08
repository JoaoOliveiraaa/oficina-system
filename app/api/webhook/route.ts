import { createAdminClient } from "@/lib/supabase/admin"
import type { StatusOS } from "@/lib/types/database"
import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/security/rate-limit"
import { createSecureWebhookResponse, maskSensitiveData } from "@/lib/security/headers"
import {
  validateCriarOSPayload,
  isValidStatus,
  isValidNumeroOS,
  isValidUrl,
  sanitizeString,
} from "@/lib/security/input-validation"
import { isRequestAllowed } from "@/lib/security/origin-whitelist"

// Webhook payload types
interface CriarOSPayload {
  acao: "criar_os"
  cliente: {
    nome: string
    telefone: string
    email?: string
    cpf_cnpj?: string
    carro?: string
    placa?: string
    marca?: string
    modelo?: string
    ano?: number
    cor?: string
  }
  procedimento: {
    descricao: string
    observacoes?: string
    valor?: number
  }
}

interface AtualizarStatusPayload {
  acao: "atualizar_status"
  numero_os: number
  status: StatusOS
  observacao?: string
}

interface RegistrarFotoPayload {
  acao: "registrar_foto"
  numero_os: number
  foto_url: string
}

interface ConsultarOSPayload {
  acao: "consultar_os"
  numero_os: number
}

type WebhookPayload = CriarOSPayload | AtualizarStatusPayload | RegistrarFotoPayload | ConsultarOSPayload

// Rate limiter: 60 requisições por minuto por IP
const webhookRateLimiter = rateLimit({
  maxRequests: 60,
  windowSeconds: 60,
})

function validateAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  const webhookSecret = process.env.WEBHOOK_SECRET

  if (!webhookSecret || !authHeader) return false

  const token = authHeader.toLowerCase().startsWith("bearer ") 
    ? authHeader.substring(7).trim() 
    : authHeader.trim()

  return timingSafeEqual(token.replace(/\s+/g, " ").trim(), webhookSecret.trim())
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// Helper function to log webhook calls
async function logWebhook(
  supabase: ReturnType<typeof createAdminClient>,
  acao: string,
  payload: unknown,
  status: "sucesso" | "erro",
  erro_mensagem?: string,
  ip_origem?: string,
) {
  try {
    await supabase.from("webhook_logs").insert({
      acao,
      payload: payload as Record<string, unknown>,
      status,
      erro_mensagem,
      ip_origem,
    })
  } catch (error) {
    console.error("[v0] Failed to log webhook:", error)
  }
}

async function relayToN8n(data: unknown): Promise<{ success: boolean; status: number; error?: string }> {
  const n8nUrl =
    process.env.N8N_WEBHOOK_URL || "https://defiant-lilly-disfavorably.ngrok-free.dev/webhook/receber-oficina"

  console.log(`[WEBHOOK] Attempting to relay to n8n:`, {
    url: n8nUrl,
    hasData: !!data,
    dataSize: JSON.stringify(data).length,
  })

  try {
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(data),
    })

    const responseText = await response.text()
    
    console.log(`[WEBHOOK] n8n response:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseText: responseText.substring(0, 200), // Primeiros 200 caracteres
    })
    
    if (!response.ok) {
      console.error(`[WEBHOOK] n8n returned error:`, {
        status: response.status,
        statusText: response.statusText,
        responseText,
      })
    }

    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? undefined : `n8n returned ${response.status}: ${responseText.substring(0, 100)}`,
    }
  } catch (error) {
    console.error(`[WEBHOOK] Failed to relay to n8n:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: n8nUrl,
    })
    return {
      success: false,
      status: 500,
      error: error instanceof Error ? error.message : "Failed to connect to n8n",
    }
  }
}

// Action: criar_os
async function criarOS(supabase: ReturnType<typeof createAdminClient>, payload: CriarOSPayload) {
  const { cliente: clienteData, procedimento } = payload

  // Check if client exists by phone
  const { data: clienteExistente } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", clienteData.telefone)
    .single()

  let clienteId: string

  if (clienteExistente) {
    clienteId = clienteExistente.id
  } else {
    // Create new client
    const { data: novoCliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({
        nome: clienteData.nome,
        telefone: clienteData.telefone,
        email: clienteData.email,
        cpf_cnpj: clienteData.cpf_cnpj,
      })
      .select("id")
      .single()

    if (clienteError) throw clienteError
    clienteId = novoCliente.id
  }

  // Check if vehicle exists by plate
  let veiculoId: string | null = null

  if (clienteData.placa) {
    const { data: veiculoExistente } = await supabase
      .from("veiculos")
      .select("id")
      .eq("placa", clienteData.placa)
      .single()

    if (veiculoExistente) {
      veiculoId = veiculoExistente.id
    } else {
      // Create new vehicle
      const { data: novoVeiculo, error: veiculoError } = await supabase
        .from("veiculos")
        .insert({
          cliente_id: clienteId,
          marca: clienteData.marca || clienteData.carro?.split(" ")[0] || "Não informado",
          modelo: clienteData.modelo || clienteData.carro?.split(" ").slice(1).join(" ") || "Não informado",
          placa: clienteData.placa,
          ano: clienteData.ano,
          cor: clienteData.cor,
        })
        .select("id")
        .single()

      if (veiculoError) throw veiculoError
      veiculoId = novoVeiculo.id
    }
  }

  // Create service order
  const { data: ordemServico, error: osError } = await supabase
    .from("ordens_servico")
    .insert({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      descricao: procedimento.descricao,
      observacoes: procedimento.observacoes,
      valor_total: procedimento.valor || 0,
      status: "pendente",
    })
    .select("*")
    .single()

  if (osError) throw osError

  // Create procedure
  await supabase.from("procedimentos").insert({
    ordem_servico_id: ordemServico.id,
    descricao: procedimento.descricao,
    valor: procedimento.valor || 0,
    status: "pendente",
  })

  return {
    success: true,
    data: {
      ordem_servico_id: ordemServico.id,
      numero_os: ordemServico.numero_os,
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      status: ordemServico.status,
    },
  }
}

// Action: atualizar_status
async function atualizarStatus(supabase: ReturnType<typeof createAdminClient>, payload: AtualizarStatusPayload) {
  const { numero_os, status, observacao } = payload

  // Find OS by numero_os
  const { data: os, error: findError } = await supabase
    .from("ordens_servico")
    .select("id, status")
    .eq("numero_os", numero_os)
    .single()

  if (findError || !os) {
    throw new Error(`Ordem de serviço #${numero_os} não encontrada`)
  }

  // Update status
  const { data: updatedOS, error: updateError } = await supabase
    .from("ordens_servico")
    .update({ status })
    .eq("id", os.id)
    .select("*")
    .single()

  if (updateError) throw updateError

  // Add manual history entry with observation if provided
  if (observacao) {
    await supabase.from("historico_os").insert({
      ordem_servico_id: os.id,
      status_anterior: os.status,
      status_novo: status,
      observacao,
      usuario: "webhook",
    })
  }

  return {
    success: true,
    data: {
      ordem_servico_id: os.id,
      numero_os,
      status_anterior: os.status,
      status_novo: status,
    },
  }
}

// Action: registrar_foto
async function registrarFoto(supabase: ReturnType<typeof createAdminClient>, payload: RegistrarFotoPayload) {
  const { numero_os, foto_url } = payload

  // Find OS by numero_os
  const { data: os, error: findError } = await supabase
    .from("ordens_servico")
    .select("id, fotos")
    .eq("numero_os", numero_os)
    .single()

  if (findError || !os) {
    throw new Error(`Ordem de serviço #${numero_os} não encontrada`)
  }

  // Add photo to array
  const novasFotos = [...(os.fotos || []), foto_url]

  const { error: updateError } = await supabase.from("ordens_servico").update({ fotos: novasFotos }).eq("id", os.id)

  if (updateError) throw updateError

  return {
    success: true,
    data: {
      ordem_servico_id: os.id,
      numero_os,
      total_fotos: novasFotos.length,
    },
  }
}

// Action: consultar_os
async function consultarOS(supabase: ReturnType<typeof createAdminClient>, payload: ConsultarOSPayload) {
  const { numero_os } = payload

  // Find OS with related data
  const { data: os, error: findError } = await supabase
    .from("ordens_servico")
    .select(
      `
      *,
      cliente:clientes(*),
      veiculo:veiculos(*),
      procedimentos(*),
      historico:historico_os(*),
      notificacoes(*)
    `,
    )
    .eq("numero_os", numero_os)
    .single()

  if (findError || !os) {
    throw new Error(`Ordem de serviço #${numero_os} não encontrada`)
  }

  return {
    success: true,
    data: os,
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"

  // Rate limiting
  const rateLimitResult = webhookRateLimiter(request)
  if (!rateLimitResult.allowed) {
    return createSecureWebhookResponse(
      {
        success: false,
        error: "Too many requests",
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      },
      429,
    )
  }

  // Authorization
  if (!validateAuthorization(request)) {
    console.warn(`[WEBHOOK] Auth failed: ${ip}`)
    return createSecureWebhookResponse({ success: false, error: "Unauthorized" }, 401)
  }

  // Whitelist check (logging only)
  const origin = request.headers.get("origin") || request.headers.get("referer")
  const whitelistCheck = isRequestAllowed(origin, ip, request.headers.get("user-agent"), true)
  if (!whitelistCheck.allowed) {
    console.warn(`[WEBHOOK] Non-whitelisted origin: ${origin}`)
  }

  let payload: WebhookPayload

  try {
    const rawPayload = await request.json()
    const payloadSize = JSON.stringify(rawPayload).length
    
    if (payloadSize > 100000) {
      return createSecureWebhookResponse({ success: false, error: "Payload too large" }, 413)
    }
    
    payload = rawPayload
  } catch {
    return createSecureWebhookResponse({ success: false, error: "Invalid JSON" }, 400)
  }

  const validActions = ["criar_os", "atualizar_status", "registrar_foto", "consultar_os"]
  if (!payload.acao || !validActions.includes(payload.acao)) {
    return createSecureWebhookResponse({ success: false, error: "Invalid action" }, 400)
  }

  // Validação por ação
  if (payload.acao === "criar_os") {
    const validation = validateCriarOSPayload(payload)
    if (!validation.valid) {
      return createSecureWebhookResponse(
        { success: false, error: "Invalid data", details: validation.errors },
        400,
      )
    }
  } else if (payload.acao === "atualizar_status") {
    if (!isValidNumeroOS(payload.numero_os) || !isValidStatus(payload.status)) {
      return createSecureWebhookResponse({ success: false, error: "Invalid OS or status" }, 400)
    }
  } else if (payload.acao === "registrar_foto") {
    if (!isValidNumeroOS(payload.numero_os) || !isValidUrl(payload.foto_url)) {
      return createSecureWebhookResponse({ success: false, error: "Invalid OS or URL" }, 400)
    }
  } else if (payload.acao === "consultar_os") {
    if (!isValidNumeroOS(payload.numero_os)) {
      return createSecureWebhookResponse({ success: false, error: "Invalid OS number" }, 400)
    }
  }

  const supabase = createAdminClient()

  try {
    let result

    switch (payload.acao) {
      case "criar_os":
        result = await criarOS(supabase, payload)
        break

      case "atualizar_status":
        result = await atualizarStatus(supabase, payload)
        break

      case "registrar_foto":
        result = await registrarFoto(supabase, payload)
        break

      case "consultar_os":
        result = await consultarOS(supabase, payload)
        break

      default:
        await logWebhook(supabase, "unknown", payload, "erro", "Ação não reconhecida", ip)
        return createSecureWebhookResponse(
          { success: false, error: "Ação não reconhecida" },
          400,
        )
    }

    const processingTime = Date.now() - startTime
    
    await logWebhook(supabase, payload.acao, maskSensitiveData(payload), "sucesso", undefined, ip)

    const n8nResponse = await relayToN8n({
      ...payload,
      resultado: result,
      timestamp: new Date().toISOString(),
    })

    console.log(`[WEBHOOK] ✓ ${payload.acao} (${processingTime}ms)`)

    return createSecureWebhookResponse({
      ...result,
      n8n: {
        enviado: n8nResponse.success,
        status: n8nResponse.status,
        erro: n8nResponse.error,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error"
    console.error(`[WEBHOOK] ✗ ${payload?.acao || "unknown"}: ${errorMessage}`)

    try {
      await logWebhook(supabase, payload?.acao || "unknown", payload ? maskSensitiveData(payload) : {}, "erro", errorMessage, ip)
      await relayToN8n({ acao: payload?.acao || "error", erro: errorMessage, timestamp: new Date().toISOString() })
    } catch {}

    return createSecureWebhookResponse({ success: false, error: errorMessage }, 500)
  }
}

export async function GET() {
  return createSecureWebhookResponse({
    status: "ok",
    message: "Webhook API is running",
    version: "2.0",
  })
}

export async function OPTIONS() {
  return createSecureWebhookResponse(null, 204)
}
