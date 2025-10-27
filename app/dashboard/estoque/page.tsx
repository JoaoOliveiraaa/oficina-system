import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { StockTable } from "@/components/stock-table"

export default async function EstoquePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: estoque } = await supabase.from("estoque").select("*").order("nome")

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Controle de Estoque</h1>
            <p className="text-muted-foreground">Gerencie peças e materiais</p>
          </div>
          <Link href="/dashboard/estoque/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </Link>
        </div>

        <StockTable estoque={estoque || []} />
      </div>
    </DashboardLayout>
  )
}
