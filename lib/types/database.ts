// Database types for type safety
export type StatusOS = "pendente" | "aguardando_pecas" | "em_andamento" | "pronto_retirada" | "finalizado" | "cancelado"

export type StatusProcedimento = "pendente" | "em_andamento" | "concluido"

export type TipoNotificacao = "whatsapp" | "sms" | "email"

export type StatusNotificacao = "pendente" | "enviado" | "erro"

export interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string
  cpf_cnpj?: string
  endereco?: string
  created_at: string
  updated_at: string
}

export interface Veiculo {
  id: string
  cliente_id: string
  marca: string
  modelo: string
  placa: string
  ano?: number
  cor?: string
  km_atual?: number
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface OrdemServico {
  id: string
  numero_os: number
  cliente_id: string
  veiculo_id: string
  status: StatusOS
  descricao: string
  observacoes?: string
  valor_total: number
  valor_pago: number
  fotos: string[]
  data_entrada: string
  data_prevista?: string
  data_conclusao?: string
  created_at: string
  updated_at: string
}

export interface Procedimento {
  id: string
  ordem_servico_id: string
  descricao: string
  valor: number
  tempo_estimado?: number
  status: StatusProcedimento
  created_at: string
  updated_at: string
}

export interface Estoque {
  id: string
  nome: string
  descricao?: string
  codigo?: string
  quantidade: number
  preco_custo?: number
  preco_venda?: number
  estoque_minimo: number
  categoria?: string
  created_at: string
  updated_at: string
}

export interface Notificacao {
  id: string
  ordem_servico_id: string
  tipo: TipoNotificacao
  destinatario: string
  mensagem: string
  status: StatusNotificacao
  erro_mensagem?: string
  enviado_em?: string
  created_at: string
}

export interface HistoricoOS {
  id: string
  ordem_servico_id: string
  status_anterior?: string
  status_novo: string
  observacao?: string
  usuario?: string
  created_at: string
}
