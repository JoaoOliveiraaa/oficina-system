import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { addSecurityHeaders } from "@/lib/security/headers"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    
    // Validação básica
    if (!userId || typeof userId !== "string") {
      return addSecurityHeaders(
        NextResponse.json({ message: "ID de usuário inválido" }, { status: 400 })
      )
    }

    // Verify current user is admin
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return addSecurityHeaders(
        NextResponse.json({ message: "Não autorizado" }, { status: 401 })
      )
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

    if (profile?.role !== "admin") {
      return addSecurityHeaders(
        NextResponse.json({ message: "Apenas administradores podem excluir funcionários" }, { status: 403 })
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return addSecurityHeaders(
        NextResponse.json({ message: "Você não pode excluir sua própria conta" }, { status: 400 })
      )
    }

    // Delete user using service role client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Error deleting user:", deleteError.message)
      return addSecurityHeaders(
        NextResponse.json({ message: deleteError.message }, { status: 400 })
      )
    }

    console.log(`[EMPLOYEES] User deleted: ${userId}`)
    return addSecurityHeaders(
      NextResponse.json({ success: true })
    )
  } catch (error) {
    console.error("Error in delete employee:", error instanceof Error ? error.message : "Unknown error")
    return addSecurityHeaders(
      NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
    )
  }
}
