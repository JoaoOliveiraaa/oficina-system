"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Search } from "lucide-react"
import Link from "next/link"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useToast } from "@/hooks/use-toast"

type Servico = {
  id: string
  nome: string
  descricao: string | null
  valor_padrao: number
  tempo_estimado: number | null
  categoria: string | null
  ativo: boolean
}

export function ServicesTable({ servicos }: { servicos: Servico[] }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredServicos = servicos.filter(
    (servico) =>
      servico.nome.toLowerCase().includes(search.toLowerCase()) ||
      servico.categoria?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const { error } = await supabase.from("servicos").delete().eq("id", deleteId)

      if (error) throw error

      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const getCategoryColor = (categoria: string | null) => {
    switch (categoria?.toLowerCase()) {
      case "mecânica":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "elétrica":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "estética":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Categoria</TableHead>
              <TableHead className="font-semibold">Valor Padrão</TableHead>
              <TableHead className="font-semibold">Tempo Estimado</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredServicos.map((servico) => (
                <TableRow key={servico.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{servico.nome}</div>
                      {servico.descricao && (
                        <div className="text-sm text-muted-foreground mt-1">{servico.descricao}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {servico.categoria && (
                      <Badge variant="secondary" className={getCategoryColor(servico.categoria)}>
                        {servico.categoria}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600 dark:text-green-400">
                    R$ {servico.valor_padrao.toFixed(2)}
                  </TableCell>
                  <TableCell>{servico.tempo_estimado ? `${servico.tempo_estimado} min` : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={servico.ativo ? "default" : "secondary"}>
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/servicos/${servico.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(servico.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir serviço"
        description="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
      />
    </>
  )
}
