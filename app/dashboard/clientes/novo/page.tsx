import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientForm } from "@/components/client-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NovoClientePage() {
  console.log("[v0] NovoClientePage - Starting")
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[v0] NovoClientePage - User:", user?.email, "Error:", error)

  if (error || !user) {
    redirect("/auth/login")
  }

  console.log("[v0] NovoClientePage - Rendering form")

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Novo Cliente</CardTitle>
              <CardDescription>Cadastre um novo cliente no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
