import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Especifica que esta rota precisa do runtime Node.js (para usar crypto)
export const runtime = 'nodejs'

// Client Secret API Key do Kiwify
const KIWIFY_SECRET = '21364efa13a31bfb4401175b07c9f1b05530fedb44e67fcd9685e4eb8ae6f0ea'

// Tipos de eventos do Kiwify
type KiwifyEventType = 
  | 'order.paid' 
  | 'order.refunded' 
  | 'order.chargeback'
  | 'subscription.started'
  | 'subscription.canceled'

interface KiwifyWebhookPayload {
  event: KiwifyEventType
  order_id: string
  order_ref: string
  customer: {
    email: string
    name: string
    phone?: string
  }
  product: {
    product_id: string
    product_name: string
  }
  commissions: {
    charge_amount: number
    product_base_price: number
  }
  subscription?: {
    subscription_id: string
    status: string
  }
  created_at: string
}

// Função para verificar a assinatura do webhook
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', KIWIFY_SECRET)
    .update(payload)
    .digest('hex')
  
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    // Pega o body como texto para verificar assinatura
    const rawBody = await request.text()
    const signature = request.headers.get('x-kiwify-signature') || ''

    // Verifica a assinatura do webhook (segurança)
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.error('❌ Assinatura inválida do webhook')
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      )
    }

    // Parse do body da requisição
    const payload: KiwifyWebhookPayload = JSON.parse(rawBody)

    console.log('📥 Webhook recebido do Kiwify:', {
      event: payload.event,
      order_id: payload.order_id,
      customer_email: payload.customer.email
    })

    // Validação básica dos dados
    if (!payload.event || !payload.order_id) {
      return NextResponse.json(
        { error: 'Dados inválidos no webhook' },
        { status: 400 }
      )
    }

    // Salva a transação no banco de dados
    const { data, error } = await supabase
      .from('kiwify_transactions')
      .insert({
        event_type: payload.event,
        order_id: payload.order_id,
        order_ref: payload.order_ref,
        customer_email: payload.customer.email,
        customer_name: payload.customer.name,
        customer_phone: payload.customer.phone || null,
        product_id: payload.product.product_id,
        product_name: payload.product.product_name,
        charge_amount: payload.commissions.charge_amount,
        product_base_price: payload.commissions.product_base_price,
        subscription_id: payload.subscription?.subscription_id || null,
        subscription_status: payload.subscription?.status || null,
        webhook_data: payload,
        created_at: payload.created_at
      })

    if (error) {
      console.error('❌ Erro ao salvar transação:', error)
      return NextResponse.json(
        { error: 'Erro ao processar webhook', details: error.message },
        { status: 500 }
      )
    }

    // Processa o evento específico
    await processKiwifyEvent(payload)

    console.log('✅ Webhook processado com sucesso:', data)

    // Retorna sucesso para o Kiwify
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook' },
      { status: 500 }
    )
  }
}

// Função para processar eventos específicos
async function processKiwifyEvent(payload: KiwifyWebhookPayload) {
  switch (payload.event) {
    case 'order.paid':
      console.log('💰 Pagamento aprovado:', {
        order_id: payload.order_id,
        customer: payload.customer.email,
        amount: payload.commissions.charge_amount
      })
      
      // LIBERAR ACESSO AO LAUDO
      // Buscar teste pendente do usuário pelo email
      const { data: testResults, error: searchError } = await supabase
        .from('test_results')
        .select('*')
        .eq('customer_email', payload.customer.email)
        .eq('payment_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (searchError) {
        console.error('❌ Erro ao buscar teste:', searchError)
        return
      }

      if (testResults && testResults.length > 0) {
        // Atualizar teste para marcar pagamento como verificado
        const { error: updateError } = await supabase
          .from('test_results')
          .update({
            payment_verified: true,
            order_id: payload.order_id
          })
          .eq('id', testResults[0].id)

        if (updateError) {
          console.error('❌ Erro ao atualizar teste:', updateError)
        } else {
          console.log('✅ Acesso ao laudo liberado para:', payload.customer.email)
        }
      } else {
        console.log('⚠️ Nenhum teste pendente encontrado para:', payload.customer.email)
      }
      break

    case 'order.refunded':
      console.log('↩️ Reembolso processado:', {
        order_id: payload.order_id,
        customer: payload.customer.email
      })
      
      // REMOVER ACESSO AO LAUDO
      const { error: refundError } = await supabase
        .from('test_results')
        .update({
          payment_verified: false
        })
        .eq('order_id', payload.order_id)

      if (refundError) {
        console.error('❌ Erro ao processar reembolso:', refundError)
      } else {
        console.log('✅ Acesso removido após reembolso')
      }
      break

    case 'order.chargeback':
      console.log('⚠️ Chargeback recebido:', {
        order_id: payload.order_id,
        customer: payload.customer.email
      })
      
      // BLOQUEAR ACESSO
      const { error: chargebackError } = await supabase
        .from('test_results')
        .update({
          payment_verified: false
        })
        .eq('order_id', payload.order_id)

      if (chargebackError) {
        console.error('❌ Erro ao processar chargeback:', chargebackError)
      } else {
        console.log('✅ Acesso bloqueado após chargeback')
      }
      break

    case 'subscription.started':
      console.log('🔄 Assinatura iniciada:', {
        subscription_id: payload.subscription?.subscription_id,
        customer: payload.customer.email
      })
      break

    case 'subscription.canceled':
      console.log('❌ Assinatura cancelada:', {
        subscription_id: payload.subscription?.subscription_id,
        customer: payload.customer.email
      })
      break

    default:
      console.log('❓ Evento desconhecido:', payload.event)
  }
}

// Endpoint GET para testar se a rota está funcionando
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook endpoint do Kiwify está funcionando',
    timestamp: new Date().toISOString()
  })
}
