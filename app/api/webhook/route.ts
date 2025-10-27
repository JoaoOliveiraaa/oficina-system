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
  const authHeader = request.headers.get("authorization")
  const webhookSecret = process.env.WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[v0] WEBHOOK_SECRET not configured")
    return false
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false
  }

  const token = authHeader.substring(7)
  return token === webhookSecret
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
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  // Validate authorization
  if (!validateAuthorization(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  let payload: WebhookPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 })
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
        return NextResponse.json({ success: false, error: "Ação não reconhecida" }, { status: 400 })
    }

    // Log success
    await logWebhook(supabase, payload.acao, payload, "sucesso", undefined, ip)

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    // Log error
    await logWebhook(supabase, payload.acao, payload, "erro", errorMessage, ip)

    console.error("[v0] Webhook error:", error)

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook API is running",
    timestamp: new Date().toISOString(),
  })
}
