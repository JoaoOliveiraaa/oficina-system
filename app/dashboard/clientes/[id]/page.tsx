import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientForm } from "@/components/client-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditClientePage({ params }: { params: { id: string } }) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.id)) {
    redirect("/dashboard/clientes")
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const { data: cliente, error } = await supabase.from("clientes").select("*").eq("id", params.id).single()

  if (error || !cliente) {
    redirect("/dashboard/clientes")
  }

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Editar Cliente</h1>
          <p className="text-muted-foreground">Atualize as informações do cliente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
            <CardDescription>Preencha os campos abaixo para atualizar o cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientForm initialData={cliente} isEditing />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
