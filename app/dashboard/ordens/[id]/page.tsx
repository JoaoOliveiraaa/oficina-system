import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PhotoUpload } from "@/components/photo-upload"
import { Edit, Calendar, DollarSign, FileText } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatOSNumber } from "@/lib/utils"

const statusColors: Record<string, string> = {
  aguardando: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  em_andamento: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  aguardando_pecas: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  pronto: "bg-green-500/10 text-green-700 border-green-500/20",
  entregue: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  cancelado: "bg-red-500/10 text-red-700 border-red-500/20",
}

const statusLabels: Record<string, string> = {
  aguardando: "Aguardando",
  em_andamento: "Em Andamento",
  aguardando_pecas: "Aguardando Peças",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export default async function OrdemDetalhePage({ params }: { params: { id: string } }) {
  if (!isValidUUID(params.id)) {
    redirect("/dashboard/ordens")
  }

  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: ordem } = await supabase
    .from("ordens_servico")
    .select("*, veiculos(placa, modelo, marca, ano, cor), clientes(nome, telefone, email)")
    .eq("id", params.id)
    .single()

  const { data: procedimentos } = await supabase
    .from("procedimentos")
    .select("*")
    .eq("ordem_servico_id", params.id)
    .order("created_at")

  const { data: fotos } = await supabase.from("fotos").select("*").eq("ordem_servico_id", params.id).order("created_at")

  if (!ordem) {
    redirect("/dashboard/ordens")
  }

  return (
    <DashboardLayout userEmail={user.email || ""}>
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{formatOSNumber(ordem.numero_os)}</h1>
                <Badge variant="outline" className={statusColors[ordem.status]}>
                  {statusLabels[ordem.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">Detalhes da ordem de serviço</p>
            </div>
            <Link href={`/dashboard/ordens/${params.id}/editar`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          </div>

          {/* Client and Vehicle Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{ordem.clientes?.nome}</p>
                </div>
                {ordem.clientes?.telefone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{ordem.clientes.telefone}</p>
                  </div>
                )}
                {ordem.clientes?.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{ordem.clientes.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Veículo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium font-mono">{ordem.veiculos?.placa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">
                    {ordem.veiculos?.marca} {ordem.veiculos?.modelo}
                  </p>
                </div>
                {ordem.veiculos?.ano && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ano</p>
                    <p className="font-medium">{ordem.veiculos.ano}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dates and Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da OS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Entrada</p>
                    <p className="font-medium">
                      {format(new Date(ordem.data_entrada), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {ordem.data_prevista && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data Prevista</p>
                      <p className="font-medium">
                        {format(new Date(ordem.data_prevista), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium text-lg">
                      {ordem.valor_total
                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            ordem.valor_total,
                          )
                        : "R$ 0,00"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Procedures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Procedimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {procedimentos && procedimentos.length > 0 ? (
                <div className="space-y-3">
                  {procedimentos.map((proc) => (
                    <div key={proc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{proc.descricao}</p>
                        {proc.observacoes && <p className="text-sm text-muted-foreground mt-1">{proc.observacoes}</p>}
                      </div>
                      <p className="font-medium">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(proc.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum procedimento cadastrado</p>
              )}
            </CardContent>
          </Card>

          {/* Observations */}
          {ordem.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{ordem.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fotos</CardTitle>
              <CardDescription>Fotos do veículo e dos serviços realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUpload ordemServicoId={params.id} photos={fotos || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
