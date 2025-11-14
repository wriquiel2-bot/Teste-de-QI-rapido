// Tipos para integração com Kiwify

export interface KiwifyWebhookPayload {
  order_id: string
  order_ref: string
  product_id: string
  product_name: string
  customer: {
    name: string
    email: string
    phone?: string
  }
  payment: {
    status: 'paid' | 'refused' | 'refunded' | 'chargeback' | 'pending'
    method: 'credit_card' | 'pix' | 'boleto'
    amount: number
    installments?: number
  }
  created_at: string
  updated_at: string
  webhook_type: 'order.paid' | 'order.refused' | 'order.refunded' | 'order.chargeback'
}

export interface KiwifyTransaction {
  id: string
  orderId: string
  orderRef: string
  customerName: string
  customerEmail: string
  productName: string
  amount: number
  status: 'paid' | 'refused' | 'refunded' | 'chargeback' | 'pending'
  paymentMethod: string
  createdAt: Date
  updatedAt: Date
}

export interface KiwifyConfig {
  apiKey?: string
  webhookSecret?: string
  productId?: string
  checkoutUrl: string
}
