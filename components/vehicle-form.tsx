"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

type Cliente = {
  id: string
  nome: string
}

export function VehicleForm({ veiculo, clientes }: { veiculo?: any; clientes: Cliente[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    placa: veiculo?.placa || "",
    modelo: veiculo?.modelo || "",
    marca: veiculo?.marca || "",
    ano: veiculo?.ano || "",
    cor: veiculo?.cor || "",
    cliente_id: veiculo?.cliente_id || "",
    observacoes: veiculo?.observacoes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = {
        ...formData,
        ano: formData.ano ? Number.parseInt(formData.ano) : null,
      }

      if (veiculo) {
        const { error } = await supabase.from("veiculos").update(data).eq("id", veiculo.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("veiculos").insert([data])
        if (error) throw error
      }

      router.push("/dashboard/veiculos")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar veículo")
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
          <Label htmlFor="placa">Placa *</Label>
          <Input
            id="placa"
            value={formData.placa}
            onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
            required
            disabled={loading}
            placeholder="ABC1D23"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cliente_id">Proprietário</Label>
          <Select
            value={formData.cliente_id}
            onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marca">Marca *</Label>
          <Input
            id="marca"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo">Modelo *</Label>
          <Input
            id="modelo"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ano">Ano</Label>
          <Input
            id="ano"
            type="number"
            value={formData.ano}
            onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
            disabled={loading}
            min="1900"
            max="2100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cor">Cor</Label>
          <Input
            id="cor"
            value={formData.cor}
            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
            disabled={loading}
          />
        </div>
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
          {veiculo ? "Atualizar" : "Cadastrar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
