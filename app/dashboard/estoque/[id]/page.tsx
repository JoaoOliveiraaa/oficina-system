import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StockForm } from "@/components/stock-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserWithProfile } from "@/lib/get-user-with-profile"

export default async function EditEstoquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    redirect("/dashboard/estoque")
  }

  const { user, profile } = await getUserWithProfile()
  const supabase = await createClient()

  const { data: item, error } = await supabase.from("estoque").select("*").eq("id", id).single()

  if (error || !item) {
    redirect("/dashboard/estoque")
  }

  return (
    <DashboardLayout userEmail={user.email} userName={profile?.nome || undefined} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Editar Item do Estoque</h1>
          <p className="text-muted-foreground">Atualize as informações do item</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Item</CardTitle>
            <CardDescription>Preencha os campos abaixo para atualizar o item</CardDescription>
          </CardHeader>
          <CardContent>
            <StockForm initialData={item} isEditing />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
