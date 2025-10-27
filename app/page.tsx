import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, Settings, FileText, Package } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Sistema de Oficina</h1>
            </div>
            <Link href="/admin/integracoes">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Bem-vindo ao Sistema de Gestão</h2>
            <p className="text-lg text-muted-foreground">
              Gerencie ordens de serviço, clientes, veículos e estoque em um só lugar
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ordens de Serviço
                </CardTitle>
                <CardDescription>Crie e gerencie ordens de serviço com acompanhamento em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Estoque
                </CardTitle>
                <CardDescription>Controle de peças e materiais com alertas de estoque baixo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integrações e Automação
              </CardTitle>
              <CardDescription>Configure webhooks e conecte com n8n para automação completa</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/integracoes">
                <Button className="w-full">Acessar Configurações</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
