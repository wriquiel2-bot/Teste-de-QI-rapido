import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase ausente' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Buscar resultado do teste
    const { data: testResult, error: testError } = await supabase
      .from('test_results')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (testError || !testResult) {
      console.error('❌ Erro ao buscar teste:', testError)
      return NextResponse.json(
        { error: 'Teste não encontrado' },
        { status: 404 }
      )
    }

    // Calcular total de questões
    const answers = testResult.answers as Record<string, string>
    const totalQuestions = Object.keys(answers).length

    return NextResponse.json({
      iq_score: testResult.iq_score,
      score: testResult.score,
      total_questions: totalQuestions,
      customer_email: testResult.customer_email,
      completed_at: testResult.completed_at,
      payment_verified: testResult.payment_verified
    })

  } catch (error) {
    console.error('❌ Erro ao buscar resultado:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resultado do teste' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, email, answers, score, iqScore } = body

    if (!sessionId || !email || !answers) {
      return NextResponse.json(
        { error: 'Session ID, email e respostas são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase ausente' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Salvar resultado no banco
    const { data, error } = await supabase
      .from('test_results')
      .insert({
        session_id: sessionId,
        customer_email: email,
        answers: answers,
        score: score,
        iq_score: iqScore,
        payment_verified: false,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao salvar resultado:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar resultado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      message: 'Resultado salvo com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao processar resultado:', error)
    return NextResponse.json(
      { error: 'Erro ao processar resultado' },
      { status: 500 }
    )
  }
}
