"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

const examples = [
  {
    title: "Criar Ordem de Serviço",
    description: "Cria uma nova OS com cliente e veículo",
    action: "criar_os",
    payload: {
      acao: "criar_os",
      cliente: {
        nome: "João Silva",
        telefone: "11999999999",
        email: "joao@email.com",
        carro: "Honda Civic",
        placa: "ABC1D23",
        marca: "Honda",
        modelo: "Civic",
        ano: 2020,
        cor: "Prata",
      },
      procedimento: {
        descricao: "Troca de óleo e filtros",
        observacoes: "Cliente pediu verificar barulho no motor",
        valor: 350.0,
      },
    },
  },
  {
    title: "Atualizar Status",
    description: "Atualiza o status de uma OS existente",
    action: "atualizar_status",
    payload: {
      acao: "atualizar_status",
      numero_os: 1,
      status: "em_andamento",
      observacao: "Mecânico iniciou o serviço",
    },
  },
  {
    title: "Registrar Foto",
    description: "Adiciona uma foto à ordem de serviço",
    action: "registrar_foto",
    payload: {
      acao: "registrar_foto",
      numero_os: 1,
      foto_url: "https://exemplo.com/fotos/motor-antes.jpg",
    },
  },
  {
    title: "Consultar OS",
    description: "Busca informações completas de uma OS",
    action: "consultar_os",
    payload: {
      acao: "consultar_os",
      numero_os: 1,
    },
  },
]

export function WebhookExamples() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-4">
      {examples.map((example, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{example.title}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(example.payload, null, 2), index)}
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-4 overflow-x-auto">
              <code className="text-sm">{JSON.stringify(example.payload, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      ))}

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Status Disponíveis</CardTitle>
          <CardDescription>Use estes valores no campo "status" ao atualizar uma OS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {["pendente", "em_andamento", "aguardando_pecas", "aguardando_aprovacao", "concluido", "cancelado"].map(
              (status) => (
                <div key={status} className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
                  {status}
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
