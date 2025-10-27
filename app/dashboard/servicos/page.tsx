import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ServicesTable } from "@/components/services-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ServicosPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const { data: servicos } = await supabase.from("servicos").select("*").order("categoria").order("nome")

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Serviços</h1>
            <p className="text-muted-foreground">Gerencie os serviços oferecidos pela oficina</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/servicos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Link>
          </Button>
        </div>

        <ServicesTable servicos={servicos || []} />
      </div>
    </DashboardLayout>
  )
}
