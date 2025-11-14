import { NextRequest, NextResponse } from 'next/server'
import type { KiwifyWebhookPayload } from '@/types/kiwify'
import { processKiwifyWebhook, validateWebhookSignature } from '@/lib/kiwify'

export async function POST(request: NextRequest) {
  try {
    // Ler o corpo da requisição
    const body = await request.text()
    const payload: KiwifyWebhookPayload = JSON.parse(body)

    // Validar assinatura do webhook (segurança)
    const signature = request.headers.get('x-kiwify-signature') || ''
    const secret = process.env.KIWIFY_WEBHOOK_SECRET || ''
    
    if (secret && !validateWebhookSignature(body, signature, secret)) {
      console.error('❌ Webhook signature inválida')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log('📥 Webhook recebido do Kiwify:', {
      type: payload.webhook_type,
      orderId: payload.order_id,
      status: payload.payment.status,
      customer: payload.customer.email
    })

    // Processar webhook baseado no tipo
    switch (payload.webhook_type) {
      case 'order.paid':
        await handleOrderPaid(payload)
        break
      
      case 'order.refused':
        await handleOrderRefused(payload)
        break
      
      case 'order.refunded':
        await handleOrderRefunded(payload)
        break
      
      case 'order.chargeback':
        await handleOrderChargeback(payload)
        break
      
      default:
        console.warn('⚠️ Tipo de webhook desconhecido:', payload.webhook_type)
    }

    // Retornar sucesso para o Kiwify
    return NextResponse.json({ 
      success: true,
      message: 'Webhook processado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handler para pagamento aprovado
async function handleOrderPaid(payload: KiwifyWebhookPayload) {
  console.log('✅ Pagamento aprovado:', payload.order_id)
  
  const transaction = processKiwifyWebhook(payload)
  
  // AQUI: Implemente sua lógica de negócio
  // Exemplos:
  // - Liberar acesso ao produto/curso
  // - Enviar email de boas-vindas
  // - Atualizar status do usuário no banco
  // - Enviar para CRM/automação
  
  // Por enquanto, apenas log
  console.log('💰 Transação processada:', {
    customer: transaction.customerEmail,
    amount: transaction.amount,
    product: transaction.productName
  })
  
  // Em produção, salve no banco de dados:
  // await db.transactions.create({ data: transaction })
}

// Handler para pagamento recusado
async function handleOrderRefused(payload: KiwifyWebhookPayload) {
  console.log('❌ Pagamento recusado:', payload.order_id)
  
  // AQUI: Implemente lógica para pagamento recusado
  // Exemplos:
  // - Enviar email informando problema
  // - Oferecer outro método de pagamento
  // - Registrar tentativa falhada
}

// Handler para reembolso
async function handleOrderRefunded(payload: KiwifyWebhookPayload) {
  console.log('💸 Reembolso processado:', payload.order_id)
  
  // AQUI: Implemente lógica de reembolso
  // Exemplos:
  // - Remover acesso ao produto
  // - Enviar email de confirmação
  // - Atualizar status no banco
}

// Handler para chargeback
async function handleOrderChargeback(payload: KiwifyWebhookPayload) {
  console.log('⚠️ Chargeback recebido:', payload.order_id)
  
  // AQUI: Implemente lógica de chargeback
  // Exemplos:
  // - Bloquear acesso imediatamente
  // - Notificar equipe de suporte
  // - Registrar para análise
}

// Permitir GET para verificar se a rota está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Kiwify está funcionando!',
    endpoint: '/api/webhooks/kiwify',
    methods: ['POST'],
    status: 'active'
  })
}
