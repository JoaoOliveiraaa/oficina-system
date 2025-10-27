import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WebhookInfo } from "@/components/webhook-info"
import { WebhookExamples } from "@/components/webhook-examples"
import { WebhookLogs } from "@/components/webhook-logs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserWithProfile } from "@/lib/get-user-with-profile"

export default async function IntegracoesPage() {
  const { user, profile } = await getUserWithProfile()

  return (
    <DashboardLayout userEmail={user.email} userName={profile?.nome || undefined} userRole={profile?.role}>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Integrações e Automação</h1>
          <p className="text-muted-foreground">Configure webhooks e conecte com n8n para automação completa</p>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhook API</CardTitle>
                <CardDescription>
                  Use esta API para integrar o sistema com n8n, automações e outras ferramentas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookInfo />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exemplos de Uso</CardTitle>
                <CardDescription>Veja como usar a webhook API com diferentes ações</CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookExamples />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Webhook</CardTitle>
                <CardDescription>Histórico de chamadas recebidas pela API</CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookLogs />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
