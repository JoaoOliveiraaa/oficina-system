"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, Search } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatOSNumber } from "@/lib/utils"

type Ordem = {
  id: string
  numero_os: number
  status: string
  data_entrada: string
  data_prevista: string | null
  valor_total: number | null
  veiculos: { placa: string; modelo: string; marca: string } | null
  clientes: { nome: string } | null
}

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

export function OrdersTable({ ordens }: { ordens: Ordem[] }) {
  const [search, setSearch] = useState("")

  const filteredOrdens = ordens.filter(
    (ordem) =>
      formatOSNumber(ordem.numero_os).toLowerCase().includes(search.toLowerCase()) ||
      ordem.veiculos?.placa.toLowerCase().includes(search.toLowerCase()) ||
      ordem.clientes?.nome.toLowerCase().includes(search.toLowerCase()),
  )

  if (ordens.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Nenhuma ordem de serviço cadastrada</p>
          <p className="text-sm">Comece criando a primeira OS</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, placa ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Número OS</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Veículo</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Data Entrada</TableHead>
              <TableHead className="font-semibold">Valor</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrdens.map((ordem) => (
              <TableRow key={ordem.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <Badge variant="outline" className="font-mono font-semibold">
                    {formatOSNumber(ordem.numero_os)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{ordem.clientes?.nome || "-"}</TableCell>
                <TableCell>
                  {ordem.veiculos ? (
                    <div>
                      <div className="font-semibold">{ordem.veiculos.placa}</div>
                      <div className="text-xs text-muted-foreground">
                        {ordem.veiculos.marca} {ordem.veiculos.modelo}
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${statusColors[ordem.status]} font-medium`}>
                    {statusLabels[ordem.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(ordem.data_entrada), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-semibold">
                  {ordem.valor_total
                    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ordem.valor_total)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/dashboard/ordens/${ordem.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/ordens/${ordem.id}/editar`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
