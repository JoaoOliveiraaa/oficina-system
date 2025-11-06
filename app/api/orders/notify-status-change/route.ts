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
    const webhookUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/webhook`
      : `${request.headers.get("origin") || "http://localhost:3000"}/api/webhook`

    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("[NOTIFY] WEBHOOK_SECRET not configured")
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 500 }
      )
    }

    console.log(`[NOTIFY] Calling webhook for status change: OS ${numero_os} from ${status_anterior} to ${status_novo}`)

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify({
        acao: "atualizar_status",
        numero_os,
        status: status_novo,
        observacao: `Status alterado de ${status_anterior} para ${status_novo} via interface web`,
      }),
    })

    const responseData = await webhookResponse.json()

    if (!webhookResponse.ok) {
      console.error("[NOTIFY] Webhook call failed:", responseData)
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

