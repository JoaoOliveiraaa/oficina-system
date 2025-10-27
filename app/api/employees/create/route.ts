import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { nome, email, telefone, senha, role } = await request.json()

    // Verify current user is admin
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ message: "Apenas administradores podem criar funcionários" }, { status: 403 })
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
      console.error("Error creating user:", signUpError)
      return NextResponse.json({ message: signUpError.message }, { status: 400 })
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
      console.error("Error updating profile:", updateError)
      return NextResponse.json({ message: "Erro ao atualizar perfil" }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: newUser.user })
  } catch (error) {
    console.error("Error in create employee:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
