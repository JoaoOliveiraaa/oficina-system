import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"

export async function WebhookLogs() {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from("webhook_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs Recentes</CardTitle>
          <CardDescription>Últimas 20 chamadas à webhook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Erro ao carregar logs: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs Recentes</CardTitle>
          <CardDescription>Últimas 20 chamadas à webhook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Nenhuma chamada registrada ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Os logs aparecerão aqui quando a webhook receber requisições
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs Recentes</CardTitle>
        <CardDescription>Últimas 20 chamadas à webhook</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-4">
              <div className="shrink-0 mt-0.5">
                {log.status === "sucesso" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.acao}</span>
                    <Badge variant={log.status === "sucesso" ? "default" : "destructive"}>{log.status}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                {log.erro_mensagem && (
                  <p className="text-sm text-destructive">
                    <span className="font-medium">Erro:</span> {log.erro_mensagem}
                  </p>
                )}
                {log.ip_origem && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">IP:</span> {log.ip_origem}
                  </p>
                )}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver payload</summary>
                  <pre className="mt-2 rounded-md bg-muted p-2 overflow-x-auto">
                    <code>{JSON.stringify(log.payload, null, 2)}</code>
                  </pre>
                </details>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
