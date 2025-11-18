import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('🔔 ============================================')
    console.log('📥 WEBHOOK KIWIFY RECEBIDO')
    console.log('🔔 ============================================')
    console.log('📦 Payload completo:', JSON.stringify(body, null, 2))

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

    // Extrair dados do webhook - Kiwify envia em diferentes formatos
    const order = body.order || body.data || body
    const orderStatus = order.order_status || order.status || body.status
    const webhookEventType = order.webhook_event_type || order.event_type || body.event_type
    
    // Tentar extrair email de TODAS as formas possíveis
    const email = 
      order.Customer?.email || 
      order.customer?.email || 
      order.email || 
      body.email ||
      body.Customer?.email ||
      body.customer?.email ||
      body.buyer?.email ||
      order.buyer?.email
    
    const orderId = order.order_id || order.id || body.order_id || body.id

    console.log('📊 ============================================')
    console.log('📊 DADOS EXTRAÍDOS DO WEBHOOK')
    console.log('📊 ============================================')
    console.log('📧 Email:', email || '❌ NÃO ENCONTRADO')
    console.log('🆔 Order ID:', orderId || '❌ NÃO ENCONTRADO')
    console.log('📌 Status:', orderStatus || '❌ NÃO ENCONTRADO')
    console.log('🎯 Event Type:', webhookEventType || '❌ NÃO ENCONTRADO')

    // Verificar se é um evento de pagamento aprovado
    const isPaid = 
      orderStatus === 'paid' || 
      orderStatus === 'approved' ||
      orderStatus === 'complete' ||
      orderStatus === 'completed' ||
      webhookEventType === 'order_approved' ||
      webhookEventType === 'order.paid' ||
      webhookEventType === 'sale.approved' ||
      webhookEventType === 'order.complete' ||
      webhookEventType === 'order.completed'

    console.log('💰 ============================================')
    console.log('💰 VERIFICAÇÃO DE PAGAMENTO')
    console.log('💰 ============================================')
    console.log('✅ É pagamento aprovado?', isPaid ? 'SIM' : 'NÃO')

    if (!isPaid) {
      console.log(`ℹ️ Evento ignorado (não é pagamento aprovado): ${orderStatus || webhookEventType}`)
      return NextResponse.json({ 
        ok: true, 
        message: `Evento não processado: ${orderStatus || webhookEventType}` 
      })
    }

    console.log('🔍 ============================================')
    console.log('🔍 BUSCANDO TESTE PENDENTE NO BANCO')
    console.log('🔍 ============================================')

    // ESTRATÉGIA 1: Buscar por email se disponível
    if (email) {
      console.log(`🔎 Buscando teste pendente para email: ${email}`)
      
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

      if (testResults && testResults.length > 0) {
        const testResult = testResults[0]
        console.log(`✅ Teste encontrado! ID: ${testResult.id}`)
        console.log(`📝 Email do teste: ${testResult.customer_email}`)
        console.log(`📅 Criado em: ${testResult.created_at}`)

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

        console.log('🎉 ============================================')
        console.log('🎉 PAGAMENTO VERIFICADO COM SUCESSO!')
        console.log('🎉 ============================================')
        console.log(`✅ Teste ID: ${testResult.id}`)
        console.log(`✅ Email: ${testResult.customer_email}`)
        console.log(`✅ Order ID: ${orderId}`)

        return NextResponse.json({ 
          ok: true, 
          message: 'Pagamento verificado com sucesso',
          test_id: testResult.id,
          email: email
        })
      }

      console.log(`⚠️ Nenhum teste pendente encontrado para email: ${email}`)
      
      // Debug: buscar TODOS os testes deste email
      const { data: allTests } = await supabase
        .from('test_results')
        .select('*')
        .eq('customer_email', email)
      
      console.log('📋 Todos os testes deste email:', allTests?.length || 0)
      if (allTests && allTests.length > 0) {
        allTests.forEach((test, index) => {
          console.log(`  ${index + 1}. ID: ${test.id}, Pago: ${test.payment_verified}, Criado: ${test.created_at}`)
        })
      }
    }

    // ESTRATÉGIA 2: Se não encontrou por email, buscar o teste mais recente não pago
    console.log('🔄 Tentando estratégia alternativa: buscar teste mais recente não pago')
    
    const { data: latestTest, error: latestError } = await supabase
      .from('test_results')
      .select('*')
      .eq('payment_verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (latestError) {
      console.error('❌ Erro ao buscar teste mais recente:', latestError)
      return NextResponse.json({ 
        ok: false, 
        error: 'Erro ao buscar teste no banco' 
      }, { status: 500 })
    }

    if (latestTest && latestTest.length > 0) {
      const testResult = latestTest[0]
      console.log(`✅ Teste mais recente encontrado! ID: ${testResult.id}`)
      console.log(`📝 Email do teste: ${testResult.customer_email}`)
      console.log(`📅 Criado em: ${testResult.created_at}`)

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

      console.log('🎉 ============================================')
      console.log('🎉 PAGAMENTO VERIFICADO COM SUCESSO!')
      console.log('🎉 ============================================')
      console.log(`✅ Teste ID: ${testResult.id}`)
      console.log(`✅ Email: ${testResult.customer_email}`)
      console.log(`✅ Order ID: ${orderId}`)

      return NextResponse.json({ 
        ok: true, 
        message: 'Pagamento verificado com sucesso (teste mais recente)',
        test_id: testResult.id,
        email: testResult.customer_email
      })
    }

    console.log('⚠️ ============================================')
    console.log('⚠️ NENHUM TESTE PENDENTE ENCONTRADO')
    console.log('⚠️ ============================================')
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Nenhum teste pendente encontrado',
      debug: {
        email: email || 'não fornecido',
        orderId: orderId || 'não fornecido'
      }
    })

  } catch (error) {
    console.error('❌ ============================================')
    console.error('❌ ERRO AO PROCESSAR WEBHOOK')
    console.error('❌ ============================================')
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro interno ao processar webhook' 
    }, { status: 500 })
  }
}

// Permitir requisições sem verificação de CSRF para webhooks externos
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
