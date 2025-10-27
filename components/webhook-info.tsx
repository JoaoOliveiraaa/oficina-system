"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"

export function WebhookInfo() {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : "/api/webhook"

  const copyToClipboard = async (text: string, type: "url" | "secret") => {
    await navigator.clipboard.writeText(text)
    if (type === "url") {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } else {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>URL da Webhook</CardTitle>
          <CardDescription>Use esta URL para conectar no n8n ou outras ferramentas de automação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Endpoint</Label>
            <div className="flex gap-2">
              <Input id="webhook-url" value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl, "url")}
                className="shrink-0"
              >
                {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Token de Autenticação</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-secret"
                value="Configurado nas variáveis de ambiente"
                readOnly
                type="password"
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard("${WEBHOOK_SECRET}", "secret")}
                className="shrink-0"
                title="Copiar placeholder"
              >
                {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              O token está armazenado de forma segura nas variáveis de ambiente do projeto
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Conectar no n8n</CardTitle>
          <CardDescription>Siga estes passos para integrar com o n8n</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Adicione um nó HTTP Request no n8n</p>
                <p className="text-sm text-muted-foreground">Arraste o nó para o canvas do workflow</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Configure o método como POST</p>
                <p className="text-sm text-muted-foreground">Selecione POST no dropdown de métodos HTTP</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Cole a URL da webhook</p>
                <p className="text-sm text-muted-foreground font-mono">{webhookUrl}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium">Configure a autenticação</p>
                <p className="text-sm text-muted-foreground">Em Authentication, selecione "Header Auth" e adicione:</p>
                <div className="mt-2 rounded-md bg-muted p-3 font-mono text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span> Authorization
                  </p>
                  <p>
                    <span className="text-muted-foreground">Value:</span> Bearer SEU_WEBHOOK_SECRET
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                5
              </div>
              <div>
                <p className="font-medium">Configure o Body JSON</p>
                <p className="text-sm text-muted-foreground">
                  Veja a aba "Exemplos" para payloads prontos de cada ação
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a
                href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Documentação do n8n
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
