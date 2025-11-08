import type { StatusOS } from "@/lib/types/database"

/**
 * Sanitiza strings removendo caracteres potencialmente perigosos
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return ""
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < e > para prevenir XSS básico
    .substring(0, 1000) // Limita tamanho
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "")
  return cleaned.length >= 10 && cleaned.length <= 11
}

/**
 * Valida CPF/CNPJ (formato básico)
 */
export function isValidCpfCnpj(doc: string): boolean {
  const cleaned = doc.replace(/\D/g, "")
  return cleaned.length === 11 || cleaned.length === 14
}

/**
 * Valida placa de veículo (formato brasileiro)
 */
export function isValidPlaca(placa: string): boolean {
  // Suporta formato antigo (ABC1234) e Mercosul (ABC1D23)
  const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
  const cleaned = placa.replace(/[^A-Z0-9]/gi, "").toUpperCase()
  return placaRegex.test(cleaned)
}

/**
 * Valida status de OS
 */
export function isValidStatus(status: string): status is StatusOS {
  const validStatuses: StatusOS[] = [
    "pendente",
    "aguardando_pecas",
    "em_andamento",
    "pronto_retirada",
    "finalizado",
    "cancelado",
  ]
  return validStatuses.includes(status as StatusOS)
}

/**
 * Valida número de OS
 */
export function isValidNumeroOS(numero: number): boolean {
  return Number.isInteger(numero) && numero > 0 && numero <= 9999999
}

/**
 * Valida URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Limita tamanho de strings
 */
export function limitString(input: string, maxLength: number): string {
  return input.substring(0, maxLength)
}

/**
 * Valida objeto de criação de OS
 */
export interface ValidatedCriarOSPayload {
  cliente: {
    nome: string
    telefone: string
    email?: string
    cpf_cnpj?: string
    carro?: string
    placa?: string
    marca?: string
    modelo?: string
    ano?: number
    cor?: string
  }
  procedimento: {
    descricao: string
    observacoes?: string
    valor?: number
  }
}

export function validateCriarOSPayload(payload: any): {
  valid: boolean
  data?: ValidatedCriarOSPayload
  errors?: string[]
} {
  const errors: string[] = []

  // Valida cliente
  if (!payload.cliente || typeof payload.cliente !== "object") {
    errors.push("Cliente é obrigatório")
  } else {
    if (!payload.cliente.nome || typeof payload.cliente.nome !== "string") {
      errors.push("Nome do cliente é obrigatório")
    } else if (payload.cliente.nome.length < 2 || payload.cliente.nome.length > 200) {
      errors.push("Nome do cliente deve ter entre 2 e 200 caracteres")
    }

    if (!payload.cliente.telefone || typeof payload.cliente.telefone !== "string") {
      errors.push("Telefone do cliente é obrigatório")
    } else if (!isValidPhone(payload.cliente.telefone)) {
      errors.push("Telefone inválido")
    }

    if (payload.cliente.email && !isValidEmail(payload.cliente.email)) {
      errors.push("Email inválido")
    }

    if (payload.cliente.cpf_cnpj && !isValidCpfCnpj(payload.cliente.cpf_cnpj)) {
      errors.push("CPF/CNPJ inválido")
    }

    if (payload.cliente.placa && !isValidPlaca(payload.cliente.placa)) {
      errors.push("Placa inválida")
    }

    if (payload.cliente.ano && (payload.cliente.ano < 1900 || payload.cliente.ano > new Date().getFullYear() + 1)) {
      errors.push("Ano do veículo inválido")
    }
  }

  // Valida procedimento
  if (!payload.procedimento || typeof payload.procedimento !== "object") {
    errors.push("Procedimento é obrigatório")
  } else {
    if (!payload.procedimento.descricao || typeof payload.procedimento.descricao !== "string") {
      errors.push("Descrição do procedimento é obrigatória")
    } else if (payload.procedimento.descricao.length < 3 || payload.procedimento.descricao.length > 500) {
      errors.push("Descrição do procedimento deve ter entre 3 e 500 caracteres")
    }

    if (payload.procedimento.valor !== undefined && (typeof payload.procedimento.valor !== "number" || payload.procedimento.valor < 0)) {
      errors.push("Valor do procedimento deve ser um número positivo")
    }

    if (payload.procedimento.observacoes && payload.procedimento.observacoes.length > 1000) {
      errors.push("Observações muito longas (máximo 1000 caracteres)")
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  // Sanitiza dados
  const validated: ValidatedCriarOSPayload = {
    cliente: {
      nome: sanitizeString(payload.cliente.nome),
      telefone: payload.cliente.telefone.replace(/\D/g, ""),
      email: payload.cliente.email ? sanitizeString(payload.cliente.email) : undefined,
      cpf_cnpj: payload.cliente.cpf_cnpj ? payload.cliente.cpf_cnpj.replace(/\D/g, "") : undefined,
      carro: payload.cliente.carro ? sanitizeString(payload.cliente.carro) : undefined,
      placa: payload.cliente.placa ? payload.cliente.placa.replace(/[^A-Z0-9]/gi, "").toUpperCase() : undefined,
      marca: payload.cliente.marca ? sanitizeString(payload.cliente.marca) : undefined,
      modelo: payload.cliente.modelo ? sanitizeString(payload.cliente.modelo) : undefined,
      ano: payload.cliente.ano,
      cor: payload.cliente.cor ? sanitizeString(payload.cliente.cor) : undefined,
    },
    procedimento: {
      descricao: sanitizeString(payload.procedimento.descricao),
      observacoes: payload.procedimento.observacoes ? sanitizeString(payload.procedimento.observacoes) : undefined,
      valor: payload.procedimento.valor,
    },
  }

  return { valid: true, data: validated }
}

