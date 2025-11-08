import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { sanitizeString, isValidEmail, isValidPhone } from "@/lib/security/input-validation"
import { addSecurityHeaders } from "@/lib/security/headers"

export async function POST(request: Request) {
  try {
    const rawData = await request.json()
    
    // Validação de entrada
    if (!rawData.nome || typeof rawData.nome !== "string" || rawData.nome.length < 2) {
      return addSecurityHeaders(
        NextResponse.json({ message: "Nome inválido" }, { status: 400 })
      )
    }
    
    if (!isValidEmail(rawData.email)) {
      return addSecurityHeaders(
        NextResponse.json({ message: "Email inválido" }, { status: 400 })
      )
    }
    
    if (rawData.telefone && !isValidPhone(rawData.telefone)) {
      return addSecurityHeaders(
        NextResponse.json({ message: "Telefone inválido" }, { status: 400 })
      )
    }
    
    if (!rawData.senha || rawData.senha.length < 6) {
      return addSecurityHeaders(
        NextResponse.json({ message: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
      )
    }
    
    const validRoles = ["admin", "mecanico", "atendente"]
    if (!validRoles.includes(rawData.role)) {
      return addSecurityHeaders(
        NextResponse.json({ message: "Role inválido" }, { status: 400 })
      )
    }
    
    // Sanitiza dados
    const nome = sanitizeString(rawData.nome)
    const email = rawData.email.trim().toLowerCase()
    const telefone = rawData.telefone ? rawData.telefone.replace(/\D/g, "") : undefined
    const senha = rawData.senha
    const role = rawData.role

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
        NextResponse.json({ message: "Apenas administradores podem criar funcionários" }, { status: 403 })
      )
    }

    // Create user using service role client
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
      },
    })

    if (signUpError) {
      console.error("Error creating user:", signUpError.message)
      return addSecurityHeaders(
        NextResponse.json({ message: signUpError.message }, { status: 400 })
      )
    }

    // Update user profile with role and phone
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        nome,
        telefone,
        role,
      })
      .eq("id", newUser.user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError.message)
      return addSecurityHeaders(
        NextResponse.json({ message: "Erro ao atualizar perfil" }, { status: 400 })
      )
    }

    console.log(`[EMPLOYEES] User created successfully: ${email}`)
    return addSecurityHeaders(
      NextResponse.json({ success: true, user: { id: newUser.user.id, email: newUser.user.email } })
    )
  } catch (error) {
    console.error("Error in create employee:", error instanceof Error ? error.message : "Unknown error")
    return addSecurityHeaders(
      NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
    )
  }
}
