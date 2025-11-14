import type { KiwifyConfig, KiwifyTransaction, KiwifyWebhookPayload } from '@/types/kiwify'

// Configuração do Kiwify (variáveis de ambiente)
export const kiwifyConfig: KiwifyConfig = {
  apiKey: process.env.KIWIFY_API_KEY,
  webhookSecret: process.env.KIWIFY_WEBHOOK_SECRET,
  productId: process.env.KIWIFY_PRODUCT_ID,
  checkoutUrl: process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || 'https://pay.kiwify.com.br/MnYsExS'
}

// Validar assinatura do webhook (segurança)
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implementação básica - Kiwify usa HMAC SHA256
  // Em produção, use crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return true // Por enquanto aceita todos (configure o secret depois)
}

// Processar webhook do Kiwify
export function processKiwifyWebhook(payload: KiwifyWebhookPayload): KiwifyTransaction {
  return {
    id: `txn_${Date.now()}`,
    orderId: payload.order_id,
    orderRef: payload.order_ref,
    customerName: payload.customer.name,
    customerEmail: payload.customer.email,
    productName: payload.product_name,
    amount: payload.payment.amount,
    status: payload.payment.status,
    paymentMethod: payload.payment.method,
    createdAt: new Date(payload.created_at),
    updatedAt: new Date(payload.updated_at)
  }
}

// Gerar URL de checkout com dados do cliente
export function generateCheckoutUrl(customerData: {
  name: string
  email: string
  productId?: string
}): string {
  const baseUrl = kiwifyConfig.checkoutUrl
  const params = new URLSearchParams({
    name: customerData.name,
    email: customerData.email,
    ...(customerData.productId && { product_id: customerData.productId })
  })
  
  return `${baseUrl}?${params.toString()}`
}
