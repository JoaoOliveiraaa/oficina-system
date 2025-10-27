import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { OrdersTable } from "@/components/orders-table"
import { getUserWithProfile } from "@/lib/get-user-with-profile"

export default async function OrdensPage() {
  const { user, profile } = await getUserWithProfile()
  const supabase = await createClient()

  const { data: ordens } = await supabase
    .from("ordens_servico")
    .select("*, veiculos(placa, modelo, marca), clientes(nome)")
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout userEmail={user.email} userName={profile?.nome || undefined} userRole={profile?.role}>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ordens de Serviço</h1>
            <p className="text-muted-foreground">Gerencie todas as OS da oficina</p>
          </div>
          <Link href="/dashboard/ordens/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </Link>
        </div>

        <OrdersTable ordens={ordens || []} />
      </div>
    </DashboardLayout>
  )
}
