import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    console.log('🔍 [VERIFY-PAYMENT] Iniciando verificação de pagamento')
    console.log('📧 [VERIFY-PAYMENT] Email recebido:', email)

    if (!email) {
      console.error('❌ [VERIFY-PAYMENT] Email não fornecido')
      return NextResponse.json({ 
        ok: false, 
        error: 'Email não fornecido' 
      }, { status: 400 })
    }

    // Verificar variáveis de ambiente com trim para remover espaços
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    console.log('🔑 [VERIFY-PAYMENT] Verificando configuração do Supabase...')
    console.log('🔑 [VERIFY-PAYMENT] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✅ Configurado` : '❌ AUSENTE')
    console.log('🔑 [VERIFY-PAYMENT] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `✅ Configurado (${supabaseServiceKey.length} chars)` : '❌ AUSENTE')

    // Validação mais específica
    if (!supabaseUrl) {
      console.error('❌ [VERIFY-PAYMENT] NEXT_PUBLIC_SUPABASE_URL não está configurada')
      return NextResponse.json({ 
        ok: false, 
        error: '🔧 Configuração incompleta: A URL do Supabase não está configurada. Vá em Configurações do Projeto → Integrações → Conectar Supabase.' 
      }, { status: 500 })
    }

    if (!supabaseServiceKey) {
      console.error('❌ [VERIFY-PAYMENT] SUPABASE_SERVICE_ROLE_KEY não está configurada')
      return NextResponse.json({ 
        ok: false, 
        error: '🔧 Configuração incompleta: A chave de serviço do Supabase não está configurada. Vá em Configurações do Projeto → Integrações → Conectar Supabase.' 
      }, { status: 500 })
    }

    // Validar formato da URL
    if (!supabaseUrl.startsWith('https://')) {
      console.error('❌ [VERIFY-PAYMENT] URL do Supabase inválida:', supabaseUrl)
      return NextResponse.json({ 
        ok: false, 
        error: `🔧 URL do Supabase inválida. Deve começar com https://. Reconecte o Supabase nas Configurações do Projeto.` 
      }, { status: 500 })
    }

    // Validar formato da chave
    if (supabaseServiceKey.length < 100) {
      console.error('❌ [VERIFY-PAYMENT] Service Role Key muito curta:', supabaseServiceKey.length, 'caracteres')
      return NextResponse.json({ 
        ok: false, 
        error: `🔧 Chave de serviço do Supabase inválida (muito curta). Reconecte o Supabase nas Configurações do Projeto → Integrações.` 
      }, { status: 500 })
    }

    console.log('✅ [VERIFY-PAYMENT] Configuração do Supabase validada com sucesso')

    // Criar cliente Supabase
    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { 
          persistSession: false,
          autoRefreshToken: false
        }
      })
      console.log('✅ [VERIFY-PAYMENT] Cliente Supabase criado com sucesso')
    } catch (createError) {
      console.error('❌ [VERIFY-PAYMENT] Erro ao criar cliente Supabase:', createError)
      return NextResponse.json({ 
        ok: false, 
        error: `🔧 Erro ao conectar com o Supabase. Reconecte nas Configurações do Projeto → Integrações.` 
      }, { status: 500 })
    }

    console.log('🔍 [VERIFY-PAYMENT] Buscando teste para email:', email)

    // Buscar teste mais recente não pago deste email
    const { data: testResults, error: fetchError } = await supabase
      .from('test_results')
      .select('*')
      .eq('customer_email', email)
      .eq('payment_verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('❌ [VERIFY-PAYMENT] Erro ao buscar teste:', fetchError)
      console.error('❌ [VERIFY-PAYMENT] Código do erro:', fetchError.code)
      console.error('❌ [VERIFY-PAYMENT] Mensagem:', fetchError.message)
      console.error('❌ [VERIFY-PAYMENT] Detalhes completos:', JSON.stringify(fetchError, null, 2))
      
      // Mensagens de erro mais específicas e amigáveis
      if (fetchError.message.includes('Invalid API key') || 
          fetchError.message.includes('JWT') || 
          fetchError.message.includes('expired') ||
          fetchError.code === 'PGRST301') {
        return NextResponse.json({ 
          ok: false, 
          error: '🔑 Chave da API do Supabase expirada ou inválida. Por favor, reconecte sua conta do Supabase em: Configurações do Projeto → Integrações → Supabase → Reconectar.' 
        }, { status: 500 })
      }
      
      if (fetchError.message.includes('relation') || fetchError.message.includes('does not exist')) {
        return NextResponse.json({ 
          ok: false, 
          error: '🗄️ Tabela não encontrada no banco de dados. Verifique se o Supabase está configurado corretamente.' 
        }, { status: 500 })
      }

      if (fetchError.message.includes('permission') || fetchError.message.includes('policy')) {
        return NextResponse.json({ 
          ok: false, 
          error: '🔒 Sem permissão para acessar o banco de dados. Verifique as políticas RLS no Supabase.' 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: `❌ Erro ao buscar teste: ${fetchError.message}. Tente reconectar o Supabase nas Configurações.` 
      }, { status: 500 })
    }

    console.log('📊 [VERIFY-PAYMENT] Testes encontrados:', testResults?.length || 0)
    
    if (testResults && testResults.length > 0) {
      console.log('📋 [VERIFY-PAYMENT] Primeiro teste:', JSON.stringify(testResults[0], null, 2))
    }

    if (!testResults || testResults.length === 0) {
      console.log(`⚠️ [VERIFY-PAYMENT] Nenhum teste pendente encontrado para: ${email}`)
      
      // Tentar buscar qualquer teste deste email (mesmo já pago)
      const { data: allTests } = await supabase
        .from('test_results')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (allTests && allTests.length > 0) {
        console.log('ℹ️ [VERIFY-PAYMENT] Teste encontrado mas já está pago:', allTests[0].id)
        return NextResponse.json({ 
          ok: false, 
          error: '✅ Este teste já foi marcado como pago! Recarregue a página para ver seu laudo.' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: '🔍 Nenhum teste encontrado para este email. Verifique se o email está correto ou complete o teste primeiro.' 
      }, { status: 404 })
    }

    const testResult = testResults[0]
    console.log(`✅ [VERIFY-PAYMENT] Teste encontrado! ID: ${testResult.id}`)

    // Marcar como pago manualmente
    const { error: updateError } = await supabase
      .from('test_results')
      .update({
        payment_verified: true,
        order_id: `manual_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', testResult.id)

    if (updateError) {
      console.error('❌ [VERIFY-PAYMENT] Erro ao atualizar pagamento:', updateError)
      console.error('❌ [VERIFY-PAYMENT] Detalhes do erro:', JSON.stringify(updateError, null, 2))
      
      // Verificar se é erro de JWT também no update
      if (updateError.message.includes('Invalid API key') || 
          updateError.message.includes('JWT') || 
          updateError.message.includes('expired')) {
        return NextResponse.json({ 
          ok: false, 
          error: '🔑 Chave da API do Supabase expirada. Reconecte sua conta em: Configurações do Projeto → Integrações → Supabase.' 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: `❌ Erro ao atualizar pagamento: ${updateError.message}` 
      }, { status: 500 })
    }

    console.log('🎉 [VERIFY-PAYMENT] Pagamento verificado manualmente com sucesso!')

    return NextResponse.json({ 
      ok: true, 
      message: '✅ Pagamento verificado com sucesso! Recarregando página...',
      test_id: testResult.id
    })

  } catch (error) {
    console.error('❌ [VERIFY-PAYMENT] Erro geral:', error)
    console.error('❌ [VERIFY-PAYMENT] Stack:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json({ 
      ok: false, 
      error: `❌ Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente ou reconecte o Supabase nas Configurações.` 
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
