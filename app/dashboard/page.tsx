import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Car, Package, CheckCircle, AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatOSNumber } from "@/lib/utils"
import { getUserProfile } from "@/lib/supabase/auth"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const userProfile = await getUserProfile()

  const { count: ordensAbertas } = await supabase
    .from("ordens_servico")
    .select("*", { count: "exact", head: true })
    .in("status", ["aguardando", "em_andamento", "aguardando_pecas"])

  const { count: totalClientes } = await supabase.from("clientes").select("*", { count: "exact", head: true })

  const { count: totalVeiculos } = await supabase.from("veiculos").select("*", { count: "exact", head: true })

  const { count: totalEstoque } = await supabase.from("estoque").select("*", { count: "exact", head: true })

  // Fetch recent orders
  const { data: ordensRecentes } = await supabase
    .from("ordens_servico")
    .select("*, veiculos(placa, modelo, marca), clientes(nome)")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: todosEstoques } = await supabase.from("estoque").select("*").order("quantidade")

  // Filter items where quantidade <= estoque_minimo in JavaScript
  const estoquesBaixos = todosEstoques?.filter((item) => item.quantidade <= item.estoque_minimo).slice(0, 5) || []

  const statusColors: Record<string, string> = {
    aguardando: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    em_andamento: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    aguardando_pecas: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    pronto: "bg-green-500/10 text-green-700 border-green-500/20",
    entregue: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  }

  const statusLabels: Record<string, string> = {
    aguardando: "Aguardando",
    em_andamento: "Em Andamento",
    aguardando_pecas: "Aguardando Peças",
    pronto: "Pronto",
    entregue: "Entregue",
  }

  return (
    <DashboardLayout
      userEmail={user.email || ""}
      userName={userProfile?.nome || undefined}
      userRole={userProfile?.role}
    >
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de oficina</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordensAbertas || 0}</div>
              <p className="text-xs text-muted-foreground">Ordens de serviço ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClientes || 0}</div>
              <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veículos</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVeiculos || 0}</div>
              <p className="text-xs text-muted-foreground">Veículos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEstoque || 0}</div>
              <p className="text-xs text-muted-foreground">Peças disponíveis</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Serviço Recentes</CardTitle>
              <CardDescription>Últimas OS criadas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {ordensRecentes && ordensRecentes.length > 0 ? (
                <div className="space-y-3">
                  {ordensRecentes.map((ordem) => (
                    <Link key={ordem.id} href={`/dashboard/ordens/${ordem.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium font-mono text-sm">{formatOSNumber(ordem.numero_os)}</p>
                            <Badge variant="outline" className={statusColors[ordem.status]}>
                              {statusLabels[ordem.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{ordem.clientes?.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {ordem.veiculos?.placa} - {ordem.veiculos?.marca} {ordem.veiculos?.modelo}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ordem.created_at), "dd/MM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma ordem de serviço ainda</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas de Estoque</CardTitle>
              <CardDescription>Itens com estoque baixo</CardDescription>
            </CardHeader>
            <CardContent>
              {estoquesBaixos && estoquesBaixos.length > 0 ? (
                <div className="space-y-3">
                  {estoquesBaixos.map((item) => (
                    <Link key={item.id} href="/dashboard/estoque">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.nome}</p>
                            <p className="text-xs text-muted-foreground">{item.categoria || "Sem categoria"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-700">{item.quantidade} un.</p>
                          <p className="text-xs text-muted-foreground">Mín: {item.estoque_minimo}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
                    <p className="text-sm">Todos os itens com estoque adequado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
