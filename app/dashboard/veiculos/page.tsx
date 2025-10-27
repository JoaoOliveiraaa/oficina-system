import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { VehiclesTable } from "@/components/vehicles-table"

export default async function VeiculosPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: veiculos } = await supabase
    .from("veiculos")
    .select("*, clientes(nome)")
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Veículos</h1>
            <p className="text-muted-foreground">Gerencie os veículos cadastrados</p>
          </div>
          <Link href="/dashboard/veiculos/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Veículo
            </Button>
          </Link>
        </div>

        <VehiclesTable veiculos={veiculos || []} />
      </div>
    </DashboardLayout>
  )
}
