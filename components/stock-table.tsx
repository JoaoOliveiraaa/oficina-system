"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Search, AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/types/database"

type EstoqueItem = Database["public"]["Tables"]["estoque"]["Row"]

export function StockTable({ estoque }: { estoque: EstoqueItem[] }) {
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const filteredEstoque = estoque.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      item.categoria?.toLowerCase().includes(search.toLowerCase()),
  )

  const lowStockItems = estoque.filter((item) => item.quantidade <= item.estoque_minimo)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("estoque").delete().eq("id", deleteId)

      if (error) throw error

      toast({
        title: "Item excluído",
        description: "O item foi removido do estoque com sucesso.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o item do estoque.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (estoque.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Nenhum item no estoque</p>
          <p className="text-sm">Comece adicionando o primeiro item</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {lowStockItems.length > 0 && (
          <Card className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-orange-500/5">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-500/20 p-2">
                  <AlertTriangle className="h-5 w-5 text-orange-700" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900">Alerta de Estoque Baixo</p>
                  <p className="text-sm text-orange-700">
                    {lowStockItems.length} {lowStockItems.length === 1 ? "item está" : "itens estão"} com estoque abaixo
                    do mínimo
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou categoria..."
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
                <TableHead className="font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Categoria</TableHead>
                <TableHead className="font-semibold">Quantidade</TableHead>
                <TableHead className="font-semibold">Estoque Mínimo</TableHead>
                <TableHead className="font-semibold">Valor Unitário</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstoque.map((item) => {
                const isLowStock = item.quantidade <= item.estoque_minimo
                return (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-muted/50 transition-colors ${isLowStock ? "bg-orange-500/5" : ""}`}
                  >
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-semibold">
                        {item.codigo || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.nome}
                        {isLowStock && (
                          <div className="rounded-full bg-orange-500/20 p-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {item.categoria || "Sem categoria"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${isLowStock ? "text-orange-700" : ""}`}>{item.quantidade}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.estoque_minimo}</TableCell>
                    <TableCell className="font-medium">
                      {item.valor_unitario
                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            item.valor_unitario,
                          )
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/estoque/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir item do estoque"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
      />
    </>
  )
}
