"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { useToast } from "@/hooks/use-toast"

type Veiculo = {
  id: string
  placa: string
  modelo: string
  marca: string
  ano: number | null
  cor: string | null
  clientes: { nome: string } | null
}

export function VehiclesTable({ veiculos }: { veiculos: Veiculo[] }) {
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const filteredVeiculos = veiculos.filter(
    (veiculo) =>
      veiculo.placa.toLowerCase().includes(search.toLowerCase()) ||
      veiculo.modelo.toLowerCase().includes(search.toLowerCase()) ||
      veiculo.marca.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("veiculos").delete().eq("id", deleteId)

      if (error) throw error

      toast({
        title: "Veículo excluído",
        description: "O veículo foi removido com sucesso.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o veículo. Verifique se não há ordens de serviço vinculadas.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (veiculos.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Nenhum veículo cadastrado</p>
          <p className="text-sm">Comece adicionando o primeiro veículo</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa, modelo ou marca..."
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
                <TableHead className="font-semibold">Placa</TableHead>
                <TableHead className="font-semibold">Modelo</TableHead>
                <TableHead className="font-semibold">Marca</TableHead>
                <TableHead className="font-semibold">Ano</TableHead>
                <TableHead className="font-semibold">Proprietário</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVeiculos.map((veiculo) => (
                <TableRow key={veiculo.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-semibold">
                      {veiculo.placa}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{veiculo.modelo}</TableCell>
                  <TableCell>{veiculo.marca}</TableCell>
                  <TableCell className="text-muted-foreground">{veiculo.ano || "-"}</TableCell>
                  <TableCell>{veiculo.clientes?.nome || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/veiculos/${veiculo.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteId(veiculo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir veículo"
        description="Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita e pode falhar se houver ordens de serviço vinculadas."
      />
    </>
  )
}
