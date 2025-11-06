import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { numero_os, status_anterior, status_novo } = body

    if (!numero_os || !status_novo) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Call the webhook API internally
    // VERCEL_URL não inclui o protocolo, então adicionamos https://
    // Em produção, use a URL do domínio principal
    let webhookUrl: string
    
    if (process.env.VERCEL_ENV === "production") {
      // Em produção, use o domínio oficial
      webhookUrl = "https://oficina-system.vercel.app/api/webhook"
    } else if (process.env.VERCEL_URL) {
      // Em preview/development, use a URL do Vercel
      webhookUrl = `https://${process.env.VERCEL_URL}/api/webhook`
    } else {
      // Local development
      webhookUrl = `${request.headers.get("origin") || "http://localhost:3000"}/api/webhook`
    }

    const webhookSecret = process.env.WEBHOOK_SECRET
    
    console.log(`[NOTIFY] Environment:`, {
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      webhookUrl,
    })

    if (!webhookSecret) {
      console.error("[NOTIFY] WEBHOOK_SECRET not configured")
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 500 }
      )
    }

    const payload = {
      acao: "atualizar_status",
      numero_os,
      status: status_novo,
      observacao: `Status alterado de ${status_anterior} para ${status_novo} via interface web`,
    }

    console.log(`[NOTIFY] Calling webhook for status change:`, {
      webhookUrl,
      numero_os,
      status_anterior,
      status_novo,
      hasSecret: !!webhookSecret,
      secretLength: webhookSecret?.length,
      secretPreview: webhookSecret ? `${webhookSecret.substring(0, 10)}...` : null,
    })

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": webhookSecret, // Enviando sem "Bearer" conforme você configurou
      },
      body: JSON.stringify(payload),
    })

    console.log(`[NOTIFY] Webhook response status:`, {
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      ok: webhookResponse.ok,
      contentType: webhookResponse.headers.get("content-type"),
    })

    // Try to parse response, handling both JSON and HTML
    let responseData: any
    const responseText = await webhookResponse.text()
    
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[NOTIFY] Failed to parse response as JSON:", {
        responseText: responseText.substring(0, 200),
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
      })
      responseData = { error: "Invalid response format", responseText: responseText.substring(0, 200) }
    }

    if (!webhookResponse.ok) {
      console.error("[NOTIFY] Webhook call failed:", {
        status: webhookResponse.status,
        responseData,
      })
      return NextResponse.json(
        { success: false, error: "Webhook call failed", details: responseData },
        { status: webhookResponse.status }
      )
    }

    console.log("[NOTIFY] Webhook notified successfully:", responseData)

    return NextResponse.json({
      success: true,
      message: "Webhook notified",
      data: responseData,
    })
  } catch (error) {
    console.error("[NOTIFY] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

