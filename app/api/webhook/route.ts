import { createAdminClient } from "@/lib/supabase/admin"
import type { StatusOS } from "@/lib/types/database"
import { type NextRequest, NextResponse } from "next/server"

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

// Helper function to validate authorization
function validateAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  const webhookSecret = process.env.WEBHOOK_SECRET

  console.log(`[WEBHOOK] Validating authorization:`, {
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? `${authHeader.substring(0, 30)}...` : null,
    authHeaderFull: authHeader, // Log completo para debug
    hasWebhookSecret: !!webhookSecret,
    webhookSecretLength: webhookSecret?.length || 0,
  })

  if (!webhookSecret) {
    console.error("[WEBHOOK] WEBHOOK_SECRET not configured")
    return false
  }

  if (!authHeader) {
    console.log("[WEBHOOK] No Authorization header found")
    return false
  }

  // Aceita tanto "Bearer TOKEN" quanto apenas "TOKEN"
  // Remove espaços extras e normaliza
  let token: string
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim()
  } else {
    token = authHeader.trim()
  }

  // Remove espaços extras e compara
  const normalizedToken = token.replace(/\s+/g, " ").trim()
  const normalizedSecret = webhookSecret.trim()
  
  const isValid = normalizedToken === normalizedSecret
  
  console.log(`[WEBHOOK] Token validation:`, {
    tokenReceived: `${token.substring(0, 10)}...`,
    tokenLength: token.length,
    normalizedTokenLength: normalizedToken.length,
    secretLength: webhookSecret.length,
    normalizedSecretLength: normalizedSecret.length,
    isValid,
    tokensMatchExact: token === webhookSecret,
    normalizedTokensMatch: normalizedToken === normalizedSecret,
    tokenFirstChars: token.substring(0, 20),
    secretFirstChars: webhookSecret.substring(0, 20),
  })
  
  return isValid
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
    process.env.N8N_WEBHOOK_URL || "https://defiant-lilly-disfavorably.ngrok-free.dev/webhook-test/receber-oficina"

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
        "Authorization": `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
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

// Main POST handler
export async function POST(request: NextRequest) {
  // Log ANTES de qualquer coisa para garantir que capturamos todas as requisições
  console.log(`[WEBHOOK] ========== POST REQUEST RECEIVED ==========`)
  console.log(`[WEBHOOK] Timestamp:`, new Date().toISOString())
  
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const method = request.method
  const url = request.url

  // Log all incoming requests for debugging
  console.log(`[WEBHOOK] ${method} request received from ${ip}`, {
    url,
    allHeaders: Object.fromEntries(request.headers.entries()),
    authorizationHeader: request.headers.get("authorization") || request.headers.get("Authorization") || "NOT FOUND",
  })

  // Validate authorization
  if (!validateAuthorization(request)) {
    console.log(`[WEBHOOK] Authorization failed for ${ip}`)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }

  console.log(`[WEBHOOK] Authorization successful for ${ip}`)

  let payload: WebhookPayload

  try {
    payload = await request.json()
    console.log(`[WEBHOOK] Payload received:`, JSON.stringify(payload, null, 2))
  } catch (error) {
    console.error(`[WEBHOOK] Failed to parse JSON:`, error)
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }

  if (!payload.acao) {
    return NextResponse.json(
      { success: false, error: "Campo 'acao' é obrigatório" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }

  if (payload.acao === "criar_os") {
    if (!payload.cliente?.nome || !payload.cliente?.telefone) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos 'cliente.nome' e 'cliente.telefone' são obrigatórios",
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }
    if (!payload.procedimento?.descricao) {
      return NextResponse.json(
        {
          success: false,
          error: "Campo 'procedimento.descricao' é obrigatório",
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
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
        return NextResponse.json(
          { success: false, error: "Ação não reconhecida" },
          {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          },
        )
    }

    // Log success
    console.log(`[WEBHOOK] Processing action: ${payload.acao}`)
    await logWebhook(supabase, payload.acao, payload, "sucesso", undefined, ip)
    console.log(`[WEBHOOK] Action ${payload.acao} completed successfully`)

    const n8nResponse = await relayToN8n({
      ...payload,
      resultado: result,
      timestamp: new Date().toISOString(),
    })

    console.log(`[WEBHOOK] n8n relay response:`, n8nResponse)

    return NextResponse.json(
      {
        ...result,
        n8n: {
          enviado: n8nResponse.success,
          status: n8nResponse.status,
          erro: n8nResponse.error,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    console.error(`[WEBHOOK] Error processing request:`, error)
    console.error(`[WEBHOOK] Error stack:`, error instanceof Error ? error.stack : "No stack trace")

    // Log error
    try {
      await logWebhook(supabase, payload?.acao || "unknown", payload, "erro", errorMessage, ip)
    } catch (logError) {
      console.error(`[WEBHOOK] Failed to log error:`, logError)
    }

    try {
      await relayToN8n({
        ...payload,
        erro: errorMessage,
        timestamp: new Date().toISOString(),
      })
    } catch (relayError) {
      console.error(`[WEBHOOK] Failed to relay error to n8n:`, relayError)
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }
}

// GET handler for health check
export async function GET(request: NextRequest) {
  // Log ANTES de qualquer coisa
  console.log(`[WEBHOOK] ========== GET REQUEST RECEIVED ==========`)
  console.log(`[WEBHOOK] Timestamp:`, new Date().toISOString())
  
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  
  console.log(`[WEBHOOK] GET request received from ${ip}`, {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  })

  return NextResponse.json(
    {
      status: "ok",
      message: "Webhook API is running",
      timestamp: new Date().toISOString(),
      endpoint: "/api/webhook",
      methods: ["GET", "POST", "OPTIONS"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  )
}

// OPTIONS handler for CORS preflight (required for n8n webhook trigger)
export async function OPTIONS(request: NextRequest) {
  // Log ANTES de qualquer coisa
  console.log(`[WEBHOOK] ========== OPTIONS REQUEST RECEIVED ==========`)
  console.log(`[WEBHOOK] Timestamp:`, new Date().toISOString())
  
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  
  console.log(`[WEBHOOK] OPTIONS request received from ${ip}`, {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  })

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
