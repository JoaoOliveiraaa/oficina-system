import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OrderForm } from "@/components/order-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NovaOrdemPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: clientes, error: clientesError } = await supabase.from("clientes").select("id, nome").order("nome")

  const { data: veiculos, error: veiculosError } = await supabase
    .from("veiculos")
    .select("id, placa, modelo, marca, cliente_id")
    .order("placa")

  console.log("[v0] Clientes:", clientes?.length || 0)
  console.log("[v0] Veículos:", veiculos?.length || 0)
  console.log("[v0] Errors:", { clientesError, veiculosError })

  const hasClientes = clientes && clientes.length > 0
  const hasVeiculos = veiculos && veiculos.length > 0

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Nova Ordem de Serviço</CardTitle>
              <CardDescription>Crie uma nova OS para um cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasClientes && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Você precisa cadastrar pelo menos um cliente antes de criar uma ordem de serviço.{" "}
                    <Link href="/dashboard/clientes/novo" className="underline font-medium">
                      Cadastrar cliente
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {hasClientes && !hasVeiculos && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Você precisa cadastrar pelo menos um veículo antes de criar uma ordem de serviço.{" "}
                    <Link href="/dashboard/veiculos/novo" className="underline font-medium">
                      Cadastrar veículo
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {hasClientes && hasVeiculos ? (
                <OrderForm clientes={clientes || []} veiculos={veiculos || []} />
              ) : (
                <div className="flex gap-2 pt-4">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/ordens">Voltar</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
