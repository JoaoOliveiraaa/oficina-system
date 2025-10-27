"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function StockForm({ item }: { item?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    codigo: item?.codigo || "",
    nome: item?.nome || "",
    categoria: item?.categoria || "",
    quantidade: item?.quantidade || "0",
    estoque_minimo: item?.estoque_minimo || "5",
    valor_unitario: item?.valor_unitario || "",
    localizacao: item?.localizacao || "",
    observacoes: item?.observacoes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = {
        ...formData,
        quantidade: Number.parseInt(formData.quantidade),
        estoque_minimo: Number.parseInt(formData.estoque_minimo),
        valor_unitario: formData.valor_unitario ? Number.parseFloat(formData.valor_unitario) : null,
      }

      if (item) {
        const { error } = await supabase.from("estoque").update(data).eq("id", item.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("estoque").insert([data])
        if (error) throw error
      }

      router.push("/dashboard/estoque")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código</Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            disabled={loading}
            placeholder="Ex: PCA-001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Input
          id="categoria"
          value={formData.categoria}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          disabled={loading}
          placeholder="Ex: Filtros, Óleos, Peças"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="quantidade">Quantidade *</Label>
          <Input
            id="quantidade"
            type="number"
            value={formData.quantidade}
            onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
            required
            disabled={loading}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estoque_minimo">Estoque Mínimo *</Label>
          <Input
            id="estoque_minimo"
            type="number"
            value={formData.estoque_minimo}
            onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
            required
            disabled={loading}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_unitario">Valor Unitário</Label>
          <Input
            id="valor_unitario"
            type="number"
            step="0.01"
            value={formData.valor_unitario}
            onChange={(e) => setFormData({ ...formData, valor_unitario: e.target.value })}
            disabled={loading}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="localizacao">Localização</Label>
        <Input
          id="localizacao"
          value={formData.localizacao}
          onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
          disabled={loading}
          placeholder="Ex: Prateleira A3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {item ? "Atualizar" : "Cadastrar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
