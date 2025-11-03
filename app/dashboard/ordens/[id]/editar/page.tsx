import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OrderForm } from "@/components/order-form"
import { getUserWithProfile } from "@/lib/get-user-with-profile"

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export default async function EditarOrdemPage({ params }: { params: { id: string } }) {
  if (!isValidUUID(params.id)) {
    redirect("/dashboard/ordens")
  }

  const { user, profile } = await getUserWithProfile()
  const supabase = await createClient()

  // Fetch order data
  const { data: ordem, error: ordemError } = await supabase
    .from("ordens_servico")
    .select("*")
    .eq("id", params.id)
    .single()

  if (ordemError || !ordem) {
    console.log("[v0] Order not found, redirecting:", ordemError)
    redirect("/dashboard/ordens")
  }

  // Fetch procedures for this order
  const { data: procedimentos } = await supabase
    .from("procedimentos")
    .select("*")
    .eq("ordem_servico_id", params.id)
    .order("created_at")

  // Fetch clients and vehicles for the form
  const { data: clientes } = await supabase.from("clientes").select("*").order("nome")

  const { data: veiculos } = await supabase.from("veiculos").select("*").order("placa")

  return (
    <DashboardLayout userEmail={user.email} userName={profile?.nome || undefined} userRole={profile?.role}>
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Editar Ordem de Serviço</h1>
            <p className="text-muted-foreground">Atualize as informações da ordem de serviço</p>
          </div>
          <OrderForm
            ordem={ordem}
            procedimentos={procedimentos || []}
            clientes={clientes || []}
            veiculos={veiculos || []}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
