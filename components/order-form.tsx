"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Cliente = {
  id: string
  nome: string
}

type Veiculo = {
  id: string
  placa: string
  modelo: string
  marca: string
  cliente_id: string
}

type Servico = {
  id: string
  nome: string
  descricao: string | null
  valor_padrao: number
  tempo_estimado: number | null
  categoria: string | null
}

type Procedimento = {
  id?: string
  servico_id?: string
  descricao: string
  valor: string
}

// Helper function to format date for input type="date"
function formatDateForInput(date: string | null | undefined): string {
  if (!date) return ""
  // If date is already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  // If date is in ISO format with time, extract just the date part
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return ""
    return dateObj.toISOString().split("T")[0]
  } catch {
    return ""
  }
}

export function OrderForm({ ordem, clientes, veiculos }: { ordem?: any; clientes: Cliente[]; veiculos: Veiculo[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [loadingProcedimentos, setLoadingProcedimentos] = useState(!!ordem)
  const [error, setError] = useState("")
  const [servicos, setServicos] = useState<Servico[]>([])

  const [formData, setFormData] = useState({
    cliente_id: ordem?.cliente_id || "",
    veiculo_id: ordem?.veiculo_id || "",
    descricao: ordem?.descricao || "",
    status: ordem?.status || "aguardando",
    data_entrada: ordem?.data_entrada ? formatDateForInput(ordem.data_entrada) : new Date().toISOString().split("T")[0],
    data_prevista: formatDateForInput(ordem?.data_prevista),
    observacoes: ordem?.observacoes || "",
  })

  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([{ descricao: "", valor: "" }])
  const [filteredVeiculos, setFilteredVeiculos] = useState<Veiculo[]>(veiculos)

  useEffect(() => {
    const loadProcedimentos = async () => {
      if (ordem?.id) {
        setLoadingProcedimentos(true)
        const { data } = await supabase
          .from("procedimentos")
          .select("*")
          .eq("ordem_servico_id", ordem.id)
          .order("created_at")

        if (data && data.length > 0) {
          setProcedimentos(
            data.map((p) => ({
              id: p.id,
              descricao: p.descricao,
              valor: p.valor.toString(),
            })),
          )
        }
        setLoadingProcedimentos(false)
      }
    }
    loadProcedimentos()
  }, [ordem?.id])

  useEffect(() => {
    const fetchServicos = async () => {
      const { data } = await supabase.from("servicos").select("*").eq("ativo", true).order("categoria").order("nome")

      if (data) {
        setServicos(data)
      }
    }
    fetchServicos()
  }, [])

  useEffect(() => {
    if (formData.cliente_id) {
      setFilteredVeiculos(veiculos.filter((v) => v.cliente_id === formData.cliente_id))
    } else {
      setFilteredVeiculos(veiculos)
    }
  }, [formData.cliente_id, veiculos])

  const addProcedimento = () => {
    setProcedimentos([...procedimentos, { descricao: "", valor: "" }])
  }

  const removeProcedimento = (index: number) => {
    setProcedimentos(procedimentos.filter((_, i) => i !== index))
  }

  const updateProcedimento = (index: number, field: keyof Procedimento, value: string) => {
    const updated = [...procedimentos]
    updated[index][field] = value
    setProcedimentos(updated)
  }

  const selectServico = (index: number, servicoId: string) => {
    const servico = servicos.find((s) => s.id === servicoId)
    if (servico) {
      const updated = [...procedimentos]
      updated[index] = {
        ...updated[index],
        servico_id: servico.id,
        descricao: servico.nome,
        valor: servico.valor_padrao.toString(),
      }
      setProcedimentos(updated)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const valorTotal = procedimentos.reduce((sum, p) => sum + (Number.parseFloat(p.valor) || 0), 0)

      if (ordem) {
        // Update existing ordem
        const { error: osError } = await supabase
          .from("ordens_servico")
          .update({
            ...formData,
            data_prevista: formData.data_prevista || null,
            valor_total: valorTotal,
          })
          .eq("id", ordem.id)

        if (osError) throw osError

        // Delete existing procedimentos and insert new ones
        await supabase.from("procedimentos").delete().eq("ordem_servico_id", ordem.id)

        const procedimentosData = procedimentos
          .filter((p) => p.descricao.trim())
          .map((p) => ({
            ordem_servico_id: ordem.id,
            descricao: p.descricao,
            valor: Number.parseFloat(p.valor) || 0,
          }))

        if (procedimentosData.length > 0) {
          const { error: procError } = await supabase.from("procedimentos").insert(procedimentosData)
          if (procError) throw procError
        }
      } else {
        // Create new ordem
        const { data: osData, error: osError } = await supabase
          .from("ordens_servico")
          .insert([
            {
              ...formData,
              data_prevista: formData.data_prevista || null,
              valor_total: valorTotal,
            },
          ])
          .select()
          .single()

        if (osError) throw osError

        const procedimentosData = procedimentos
          .filter((p) => p.descricao.trim())
          .map((p) => ({
            ordem_servico_id: osData.id,
            descricao: p.descricao,
            valor: Number.parseFloat(p.valor) || 0,
          }))

        if (procedimentosData.length > 0) {
          const { error: procError } = await supabase.from("procedimentos").insert(procedimentosData)
          if (procError) throw procError
        }
      }

      router.push("/dashboard/ordens")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar ordem de serviço")
    } finally {
      setLoading(false)
    }
  }

  if (loadingProcedimentos) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Select
            value={formData.cliente_id}
            onValueChange={(value) => setFormData({ ...formData, cliente_id: value, veiculo_id: "" })}
            required
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

        <div className="space-y-2">
          <Label htmlFor="veiculo_id">Veículo *</Label>
          <Select
            value={formData.veiculo_id}
            onValueChange={(value) => setFormData({ ...formData, veiculo_id: value })}
            required
            disabled={!formData.cliente_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o veículo" />
            </SelectTrigger>
            <SelectContent>
              {filteredVeiculos.map((veiculo) => (
                <SelectItem key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição do Serviço *</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Revisão completa, Troca de óleo, Reparo de freios..."
          required
          disabled={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
              <SelectItem value="pronto">Pronto</SelectItem>
              <SelectItem value="entregue">Entregue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_entrada">Data Entrada *</Label>
          <Input
            id="data_entrada"
            type="date"
            value={formData.data_entrada}
            onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_prevista">Data Prevista</Label>
          <Input
            id="data_prevista"
            type="date"
            value={formData.data_prevista}
            onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Procedimentos</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addProcedimento}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {procedimentos.map((proc, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg bg-muted/30">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1">Selecionar Serviço</Label>
                  <Select onValueChange={(value) => selectServico(index, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um serviço cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id}>
                          <div className="flex items-center gap-2">
                            <span>{servico.nome}</span>
                            {servico.categoria && (
                              <Badge variant="secondary" className="text-xs">
                                {servico.categoria}
                              </Badge>
                            )}
                            <span className="text-muted-foreground text-xs">
                              - R$ {servico.valor_padrao.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {procedimentos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProcedimento(index)}
                    disabled={loading}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1">Descrição</Label>
                  <Input
                    placeholder="Ou digite manualmente"
                    value={proc.descricao}
                    onChange={(e) => updateProcedimento(index, "descricao", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs text-muted-foreground mb-1">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={proc.valor}
                    onChange={(e) => updateProcedimento(index, "valor", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                R$ {procedimentos.reduce((sum, p) => sum + (Number.parseFloat(p.valor) || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          disabled={loading}
          rows={4}
          placeholder="Informações adicionais sobre o serviço..."
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {ordem ? "Atualizar" : "Criar"} Ordem de Serviço
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
