import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StockForm } from "@/components/stock-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NovoEstoquePage() {
  console.log("[v0] NovoEstoquePage - Starting")
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[v0] NovoEstoquePage - User:", user?.email, "Error:", error)

  if (error || !user) {
    redirect("/auth/login")
  }

  console.log("[v0] NovoEstoquePage - Rendering form")

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Novo Item de Estoque</CardTitle>
              <CardDescription>Adicione um novo item ao estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <StockForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
