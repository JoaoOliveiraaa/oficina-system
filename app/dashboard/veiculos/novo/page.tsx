import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VehicleForm } from "@/components/vehicle-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NovoVeiculoPage() {
  console.log("[v0] NovoVeiculoPage - Starting")
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[v0] NovoVeiculoPage - User:", user?.email, "Error:", error)

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: clientes } = await supabase.from("clientes").select("id, nome").order("nome")

  console.log("[v0] NovoVeiculoPage - Clientes count:", clientes?.length)
  console.log("[v0] NovoVeiculoPage - Rendering form")

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Novo Veículo</CardTitle>
              <CardDescription>Cadastre um novo veículo no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleForm clientes={clientes || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
