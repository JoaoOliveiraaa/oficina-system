import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VehicleForm } from "@/components/vehicle-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserWithProfile } from "@/lib/get-user-with-profile"

export default async function EditVeiculoPage({ params }: { params: { id: string } }) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.id)) {
    redirect("/dashboard/veiculos")
  }

  const { user, profile } = await getUserWithProfile()
  const supabase = await createClient()

  const { data: veiculo, error } = await supabase.from("veiculos").select("*").eq("id", params.id).single()

  const { data: clientes } = await supabase.from("clientes").select("id, nome").order("nome")

  if (error || !veiculo) {
    redirect("/dashboard/veiculos")
  }

  return (
    <DashboardLayout userEmail={user.email} userName={profile?.nome || undefined} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Editar Veículo</h1>
          <p className="text-muted-foreground">Atualize as informações do veículo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Veículo</CardTitle>
            <CardDescription>Preencha os campos abaixo para atualizar o veículo</CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleForm veiculo={veiculo} clientes={clientes || []} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
