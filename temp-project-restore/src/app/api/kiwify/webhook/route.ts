import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('📥 Webhook Kiwify recebido:', JSON.stringify(body, null, 2))

    // Criar cliente Supabase com service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente do Supabase não configuradas')
      return NextResponse.json({ 
        ok: false, 
        error: 'Configuração do Supabase ausente' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Extrair dados do webhook (suporta diferentes estruturas da Kiwify)
    const order = body.order || body.data || body
    const orderStatus = order.order_status || order.status || body.status
    const webhookEventType = order.webhook_event_type || order.event_type || body.event_type
    const email = order.Customer?.email || order.customer?.email || order.email || body.email
    const orderId = order.order_id || order.id || body.order_id

    console.log('📊 Dados extraídos:', {
      orderStatus,
      webhookEventType,
      email,
      orderId
    })

    if (!email) {
      console.log('⚠️ Email não encontrado no webhook')
      return NextResponse.json({ 
        ok: true, 
        message: 'Email não encontrado no payload' 
      })
    }

    // Processar apenas eventos de pagamento aprovado
    const isPaid = 
      orderStatus === 'paid' || 
      orderStatus === 'approved' ||
      orderStatus === 'complete' ||
      webhookEventType === 'order_approved' ||
      webhookEventType === 'order.paid' ||
      webhookEventType === 'sale.approved'

    if (isPaid) {
      console.log(`✅ Pagamento aprovado para: ${email}`)

      // Buscar o último teste não pago deste email
      const { data: testResults, error: fetchError } = await supabase
        .from('test_results')
        .select('*')
        .eq('customer_email', email)
        .eq('payment_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError) {
        console.error('❌ Erro ao buscar teste:', fetchError)
        return NextResponse.json({ 
          ok: false, 
          error: 'Erro ao buscar teste no banco' 
        }, { status: 500 })
      }

      if (!testResults || testResults.length === 0) {
        console.log(`⚠️ Nenhum teste pendente encontrado para: ${email}`)
        return NextResponse.json({ 
          ok: true, 
          message: 'Nenhum teste pendente encontrado para este email' 
        })
      }

      const testResult = testResults[0]
      console.log(`📝 Teste encontrado - ID: ${testResult.id}`)

      // Atualizar o teste para marcar como pago
      const { error: updateError } = await supabase
        .from('test_results')
        .update({
          payment_verified: true,
          order_id: orderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', testResult.id)

      if (updateError) {
        console.error('❌ Erro ao atualizar pagamento:', updateError)
        return NextResponse.json({ 
          ok: false, 
          error: 'Erro ao atualizar status de pagamento' 
        }, { status: 500 })
      }

      console.log(`✅ Pagamento verificado com sucesso para teste ID: ${testResult.id}`)
      return NextResponse.json({ 
        ok: true, 
        message: 'Pagamento verificado com sucesso',
        test_id: testResult.id,
        email: email
      })
    } else {
      console.log(`ℹ️ Evento ignorado: ${orderStatus} / ${webhookEventType}`)
      return NextResponse.json({ 
        ok: true, 
        message: `Evento não processado: ${orderStatus || webhookEventType}` 
      })
    }

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao processar webhook' 
    }, { status: 500 })
  }
}

// Permitir requisições sem verificação de CSRF para webhooks externos
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
