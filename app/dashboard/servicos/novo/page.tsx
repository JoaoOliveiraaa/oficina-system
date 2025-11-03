import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ServiceForm } from "@/components/service-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NovoServicoPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Novo Serviço</h1>
          <p className="text-muted-foreground">Cadastre um novo serviço oferecido pela oficina</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Serviço</CardTitle>
            <CardDescription>Preencha os campos abaixo para cadastrar o serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
