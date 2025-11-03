/**
 * Webhook API Usage Examples
 *
 * This file contains TypeScript examples for calling the webhook API
 * from external services like n8n, custom scripts, or other applications.
 */

const WEBHOOK_URL = "https://your-app.vercel.app/api/webhook"
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

// Example 1: Create a new service order
export async function createServiceOrder() {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WEBHOOK_SECRET}`,
    },
    body: JSON.stringify({
      acao: "criar_os",
      cliente: {
        nome: "João Silva",
        telefone: "11999999999",
        email: "joao@example.com",
        carro: "Honda Civic",
        placa: "ABC1D23",
        marca: "Honda",
        modelo: "Civic",
        ano: 2020,
        cor: "Preto",
      },
      procedimento: {
        descricao: "Troca de óleo e filtros",
        observacoes: "Cliente pediu verificar barulho no motor",
        valor: 250.0,
      },
    }),
  })

  const data = await response.json()
  console.log("Service order created:", data)
  return data
}

// Example 2: Update service order status
export async function updateServiceOrderStatus(numeroOS: number, status: string) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WEBHOOK_SECRET}`,
    },
    body: JSON.stringify({
      acao: "atualizar_status",
      numero_os: numeroOS,
      status: status,
      observacao: `Status atualizado para ${status}`,
    }),
  })

  const data = await response.json()
  console.log("Status updated:", data)
  return data
}

// Example 3: Register a photo
export async function registerPhoto(numeroOS: number, fotoUrl: string) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WEBHOOK_SECRET}`,
    },
    body: JSON.stringify({
      acao: "registrar_foto",
      numero_os: numeroOS,
      foto_url: fotoUrl,
    }),
  })

  const data = await response.json()
  console.log("Photo registered:", data)
  return data
}

// Example 4: Query service order
export async function queryServiceOrder(numeroOS: number) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WEBHOOK_SECRET}`,
    },
    body: JSON.stringify({
      acao: "consultar_os",
      numero_os: numeroOS,
    }),
  })

  const data = await response.json()
  console.log("Service order details:", data)
  return data
}

// Example 5: Complete workflow - Create OS and update status
export async function completeWorkflow() {
  // Step 1: Create service order
  const createResult = await createServiceOrder()

  if (!createResult.success) {
    console.error("Failed to create service order:", createResult.error)
    return
  }

  const numeroOS = createResult.data.numero_os

  // Step 2: Update to "in progress"
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
  await updateServiceOrderStatus(numeroOS, "em_andamento")

  // Step 3: Register a photo
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await registerPhoto(numeroOS, "https://example.com/photo1.jpg")

  // Step 4: Update to "ready for pickup"
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await updateServiceOrderStatus(numeroOS, "pronto_retirada")

  // Step 5: Query final status
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const finalStatus = await queryServiceOrder(numeroOS)

  console.log("Workflow completed:", finalStatus)
}

// Example 6: Error handling
export async function createServiceOrderWithErrorHandling() {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        acao: "criar_os",
        cliente: {
          nome: "Maria Santos",
          telefone: "11988888888",
          carro: "Toyota Corolla",
          placa: "XYZ9W87",
        },
        procedimento: {
          descricao: "Revisão completa",
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Unknown error occurred")
    }

    console.log("Success:", data)
    return data
  } catch (error) {
    console.error("Error creating service order:", error)
    throw error
  }
}
