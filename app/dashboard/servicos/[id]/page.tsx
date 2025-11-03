import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ServiceForm } from "@/components/service-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserWithProfile } from "@/lib/get-user-with-profile"

export default async function EditServicoPage({ params }: { params: { id: string } }) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.id)) {
    redirect("/dashboard/servicos")
  }

  const { user, profile } = await getUserWithProfile()
  const supabase = await createClient()

  const { data: servico, error } = await supabase.from("servicos").select("*").eq("id", params.id).single()

  if (error || !servico) {
    redirect("/dashboard/servicos")
  }

  return (
    <DashboardLayout userEmail={user.email} userName={profile?.nome || undefined} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Editar Serviço</h1>
          <p className="text-muted-foreground">Atualize as informações do serviço</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Serviço</CardTitle>
            <CardDescription>Preencha os campos abaixo para atualizar o serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceForm servico={servico} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
