import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientForm } from "@/components/client-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserWithProfile } from "@/lib/get-user-with-profile"

export default async function EditClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    redirect("/dashboard/clientes")
  }

  const { user, profile } = await getUserWithProfile()
  const supabase = await createClient()

  const { data: cliente, error } = await supabase.from("clientes").select("*").eq("id", id).single()

  if (error || !cliente) {
    redirect("/dashboard/clientes")
  }

  return (
    <DashboardLayout userEmail={user.email} userName={profile?.nome || undefined} userRole={profile?.role}>
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
