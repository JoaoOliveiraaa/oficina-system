"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
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

export function ServiceForm({ servico }: { servico?: Servico }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    nome: servico?.nome || "",
    descricao: servico?.descricao || "",
    valor_padrao: servico?.valor_padrao?.toString() || "",
    tempo_estimado: servico?.tempo_estimado?.toString() || "",
    categoria: servico?.categoria || "",
    ativo: servico?.ativo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        valor_padrao: Number.parseFloat(formData.valor_padrao) || 0,
        tempo_estimado: formData.tempo_estimado ? Number.parseInt(formData.tempo_estimado) : null,
        categoria: formData.categoria || null,
        ativo: formData.ativo,
      }

      if (servico) {
        const { error } = await supabase.from("servicos").update(data).eq("id", servico.id)
        if (error) throw error

        toast({
          title: "Serviço atualizado",
          description: "O serviço foi atualizado com sucesso.",
        })
      } else {
        const { error } = await supabase.from("servicos").insert([data])
        if (error) throw error

        toast({
          title: "Serviço cadastrado",
          description: "O serviço foi cadastrado com sucesso.",
        })
      }

      router.push("/dashboard/servicos")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar serviço")
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

      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Serviço *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
          disabled={loading}
          placeholder="Ex: Troca de óleo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          disabled={loading}
          rows={3}
          placeholder="Descrição detalhada do serviço"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mecânica">Mecânica</SelectItem>
              <SelectItem value="Elétrica">Elétrica</SelectItem>
              <SelectItem value="Estética">Estética</SelectItem>
              <SelectItem value="Funilaria">Funilaria</SelectItem>
              <SelectItem value="Pintura">Pintura</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_padrao">Valor Padrão (R$) *</Label>
          <Input
            id="valor_padrao"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_padrao}
            onChange={(e) => setFormData({ ...formData, valor_padrao: e.target.value })}
            required
            disabled={loading}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tempo_estimado">Tempo Estimado (minutos)</Label>
        <Input
          id="tempo_estimado"
          type="number"
          min="0"
          value={formData.tempo_estimado}
          onChange={(e) => setFormData({ ...formData, tempo_estimado: e.target.value })}
          disabled={loading}
          placeholder="Ex: 60"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
          disabled={loading}
        />
        <Label htmlFor="ativo">Serviço ativo</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {servico ? "Atualizar" : "Cadastrar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
