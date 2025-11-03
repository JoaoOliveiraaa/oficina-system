import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { WebhookInfo } from "@/components/webhook-info"
import { WebhookExamples } from "@/components/webhook-examples"
import { WebhookLogs } from "@/components/webhook-logs"
import { ArrowLeft, Webhook, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function IntegracoesPage() {
  const webhookConfigured = !!process.env.WEBHOOK_SECRET

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Webhook className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Integrações e Webhooks</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Status da Integração</CardTitle>
                  <CardDescription>Configure e monitore suas integrações com n8n e outras ferramentas</CardDescription>
                </div>
                <Badge variant={webhookConfigured ? "default" : "destructive"}>
                  {webhookConfigured ? "Configurado" : "Não Configurado"}
                </Badge>
              </div>
            </CardHeader>
            {!webhookConfigured && (
              <CardContent>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A variável de ambiente <code className="font-mono text-sm">WEBHOOK_SECRET</code> não está
                    configurada. Adicione-a nas configurações do projeto para habilitar a autenticação da webhook.
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="examples">Exemplos</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <WebhookInfo />
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <WebhookExamples />
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <WebhookLogs />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
