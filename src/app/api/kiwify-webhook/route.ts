import { NextRequest, NextResponse } from 'next/server'

// Tipos de eventos da Kiwify
type KiwifyEventType = 
  | 'order.paid'
  | 'order.refused'
  | 'order.refunded'
  | 'order.chargeback'
  | 'subscription.started'
  | 'subscription.canceled'

interface KiwifyWebhookPayload {
  order_id: string
  order_ref: string
  event: KiwifyEventType
  Customer: {
    full_name: string
    email: string
    mobile: string
  }
  Product: {
    product_name: string
  }
  Producer: {
    name: string
  }
  commissions: Array<{
    name: string
    email: string
    value: number
  }>
  order_amount: number
  order_status: string
  created_at: string
  updated_at: string
}

export async function POST(request: NextRequest) {
  try {
    // Ler o corpo da requisição
    const payload: KiwifyWebhookPayload = await request.json()

    console.log('📥 Webhook recebida da Kiwify:', {
      event: payload.event,
      order_id: payload.order_id,
      customer_email: payload.Customer.email,
      status: payload.order_status,
      timestamp: new Date().toISOString()
    })

    // Processar diferentes tipos de eventos
    switch (payload.event) {
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
      
      case 'subscription.started':
        await handleSubscriptionStarted(payload)
        break
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(payload)
        break
      
      default:
        console.log('⚠️ Evento desconhecido:', payload.event)
    }

    // Retornar sucesso para a Kiwify
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processada com sucesso',
      event: payload.event,
      order_id: payload.order_id
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    
    // Retornar erro mas com status 200 para não reenviar
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar webhook',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 200 })
  }
}

// Handler para pagamento aprovado
async function handleOrderPaid(payload: KiwifyWebhookPayload) {
  console.log('✅ Pagamento aprovado:', {
    order_id: payload.order_id,
    customer: payload.Customer.email,
    amount: payload.order_amount,
    timestamp: new Date().toISOString()
  })

  try {
    const email = payload.Customer.email.toLowerCase().trim()
    
    // Obter a URL base da aplicação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000'
    
    console.log('🔄 Atualizando status de pagamento para:', email)
    
    // Atualizar status do pagamento no banco de dados
    const updateResponse = await fetch(`${baseUrl}/api/test-result`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        paymentStatus: 'paid'
      })
    })

    const updateData = await updateResponse.json()

    if (updateResponse.ok && updateData.success) {
      console.log('✅ Status de pagamento atualizado com sucesso:', {
        email,
        sessionId: updateData.data?.sessionId,
        paymentStatus: 'paid'
      })
      
      // TODO: Enviar email com link do laudo
      console.log('📧 Email com laudo será enviado para:', email)
      
      // TODO: Gerar PDF do certificado
      console.log('📄 Certificado PDF será gerado para:', email)
    } else {
      console.error('❌ Erro ao atualizar status de pagamento:', {
        email,
        status: updateResponse.status,
        error: updateData.error || 'Erro desconhecido'
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar pagamento aprovado:', error)
    throw error
  }
}

// Handler para pagamento recusado
async function handleOrderRefused(payload: KiwifyWebhookPayload) {
  console.log('❌ Pagamento recusado:', {
    order_id: payload.order_id,
    customer: payload.Customer.email,
    timestamp: new Date().toISOString()
  })

  try {
    const email = payload.Customer.email.toLowerCase().trim()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000'
    
    // Atualizar status no banco de dados
    await fetch(`${baseUrl}/api/test-result`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        paymentStatus: 'refused'
      })
    })
    
    console.log('📧 Email de recusa será enviado para:', email)
    
  } catch (error) {
    console.error('❌ Erro ao processar pagamento recusado:', error)
    throw error
  }
}

// Handler para reembolso
async function handleOrderRefunded(payload: KiwifyWebhookPayload) {
  console.log('💰 Reembolso processado:', {
    order_id: payload.order_id,
    customer: payload.Customer.email,
    amount: payload.order_amount,
    timestamp: new Date().toISOString()
  })

  try {
    const email = payload.Customer.email.toLowerCase().trim()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000'
    
    // Atualizar status no banco de dados
    await fetch(`${baseUrl}/api/test-result`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        paymentStatus: 'refunded'
      })
    })
    
    console.log('🔒 Acesso revogado para:', email)
    
  } catch (error) {
    console.error('❌ Erro ao processar reembolso:', error)
    throw error
  }
}

// Handler para chargeback
async function handleOrderChargeback(payload: KiwifyWebhookPayload) {
  console.log('⚠️ Chargeback detectado:', {
    order_id: payload.order_id,
    customer: payload.Customer.email,
    timestamp: new Date().toISOString()
  })

  try {
    const email = payload.Customer.email.toLowerCase().trim()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000'
    
    // Atualizar status no banco de dados
    await fetch(`${baseUrl}/api/test-result`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        paymentStatus: 'refunded'
      })
    })
    
    console.log('🚨 Chargeback - acesso revogado para:', email)
    
  } catch (error) {
    console.error('❌ Erro ao processar chargeback:', error)
    throw error
  }
}

// Handler para assinatura iniciada
async function handleSubscriptionStarted(payload: KiwifyWebhookPayload) {
  console.log('🔄 Assinatura iniciada:', {
    order_id: payload.order_id,
    customer: payload.Customer.email,
    timestamp: new Date().toISOString()
  })

  try {
    console.log('✅ Assinatura ativada para:', payload.Customer.email)
  } catch (error) {
    console.error('❌ Erro ao processar início de assinatura:', error)
    throw error
  }
}

// Handler para assinatura cancelada
async function handleSubscriptionCanceled(payload: KiwifyWebhookPayload) {
  console.log('🔴 Assinatura cancelada:', {
    order_id: payload.order_id,
    customer: payload.Customer.email,
    timestamp: new Date().toISOString()
  })

  try {
    console.log('⏰ Assinatura cancelada para:', payload.Customer.email)
  } catch (error) {
    console.error('❌ Erro ao processar cancelamento de assinatura:', error)
    throw error
  }
}

// Endpoint GET para verificar se a webhook está funcionando
export async function GET() {
  return NextResponse.json({ 
    status: 'online',
    message: 'Webhook da Kiwify está funcionando!',
    endpoint: '/api/kiwify-webhook',
    methods: ['POST'],
    events_supported: [
      'order.paid',
      'order.refused', 
      'order.refunded',
      'order.chargeback',
      'subscription.started',
      'subscription.canceled'
    ],
    timestamp: new Date().toISOString()
  })
}
