"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Edit, Trash2, Phone, Mail, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/types/database"

type Cliente = Database["public"]["Tables"]["clientes"]["Row"]

export function ClientsTable({ clientes }: { clientes: Cliente[] }) {
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
      cliente.telefone?.includes(search) ||
      cliente.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", deleteId)

      if (error) throw error

      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido com sucesso.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cliente. Verifique se não há ordens de serviço vinculadas.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (clientes.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Nenhum cliente cadastrado</p>
          <p className="text-sm">Comece adicionando seu primeiro cliente</p>
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
              placeholder="Buscar por nome, telefone ou email..."
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
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Telefone</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">CPF/CNPJ</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{cliente.telefone}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{cliente.email}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cliente.cpf_cnpj || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/clientes/${cliente.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteId(cliente.id)}
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
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e pode falhar se houver ordens de serviço vinculadas."
      />
    </>
  )
}
