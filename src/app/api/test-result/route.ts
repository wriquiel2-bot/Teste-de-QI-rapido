import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Interface para o resultado do teste
interface TestResult {
  sessionId: string
  email: string
  answers: Record<number, string>
  score: number
  iqScore: number
  timestamp: string
  paymentStatus: 'pending' | 'paid' | 'refused' | 'refunded'
}

// Simulação de banco de dados em memória (em produção, use um banco real)
// IMPORTANTE: Este Map persiste apenas durante a execução do servidor
// Para produção, use Supabase, MongoDB, PostgreSQL, etc.
const testResults = new Map<string, TestResult>()

// Índice por email para busca rápida
const emailIndex = new Map<string, string[]>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, email, answers, score, iqScore } = body

    // Validar dados
    if (!sessionId || !email || !answers || score === undefined || iqScore === undefined) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Criar resultado do teste
    const testResult: TestResult = {
      sessionId,
      email: email.toLowerCase().trim(),
      answers,
      score,
      iqScore,
      timestamp: new Date().toISOString(),
      paymentStatus: 'pending'
    }

    // Salvar resultado
    testResults.set(sessionId, testResult)
    
    // Atualizar índice por email
    const emailKey = email.toLowerCase().trim()
    const sessions = emailIndex.get(emailKey) || []
    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId)
      emailIndex.set(emailKey, sessions)
    }

    console.log('✅ Resultado do teste salvo:', {
      sessionId,
      email: emailKey,
      score,
      iqScore,
      totalResults: testResults.size
    })

    // Criar cookie com sessionId para persistência
    const cookieStore = await cookies()
    cookieStore.set('test_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })

    return NextResponse.json({
      success: true,
      message: 'Resultado salvo com sucesso',
      data: {
        sessionId,
        score,
        iqScore,
        email: emailKey
      }
    })

  } catch (error) {
    console.error('❌ Erro ao salvar resultado:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar resultado' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const email = searchParams.get('email')

    console.log('🔍 Buscando resultado:', { sessionId, email, totalResults: testResults.size })

    if (!sessionId && !email) {
      return NextResponse.json(
        { error: 'sessionId ou email é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar por sessionId
    if (sessionId) {
      const result = testResults.get(sessionId)
      if (!result) {
        console.log('❌ Resultado não encontrado para sessionId:', sessionId)
        return NextResponse.json(
          { error: 'Resultado não encontrado' },
          { status: 404 }
        )
      }
      console.log('✅ Resultado encontrado:', { sessionId, paymentStatus: result.paymentStatus })
      return NextResponse.json({ success: true, data: result })
    }

    // Buscar por email (retorna o mais recente)
    if (email) {
      const emailKey = email.toLowerCase().trim()
      const sessionIds = emailIndex.get(emailKey) || []
      
      console.log('📧 Buscando por email:', emailKey, 'Sessions encontradas:', sessionIds.length)
      
      if (sessionIds.length === 0) {
        console.log('❌ Nenhuma sessão encontrada para email:', emailKey)
        return NextResponse.json(
          { error: 'Nenhum resultado encontrado para este email' },
          { status: 404 }
        )
      }

      // Pegar todas as sessões deste email
      const results = sessionIds
        .map(sid => testResults.get(sid))
        .filter((r): r is TestResult => r !== undefined)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      if (results.length === 0) {
        return NextResponse.json(
          { error: 'Nenhum resultado encontrado para este email' },
          { status: 404 }
        )
      }

      console.log('✅ Resultado encontrado por email:', { 
        email: emailKey, 
        sessionId: results[0].sessionId,
        paymentStatus: results[0].paymentStatus 
      })

      return NextResponse.json({ 
        success: true, 
        data: results[0],
        total: results.length
      })
    }

  } catch (error) {
    console.error('❌ Erro ao buscar resultado:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resultado' },
      { status: 500 }
    )
  }
}

// Endpoint para atualizar status de pagamento
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, email, paymentStatus } = body

    console.log('🔄 Atualizando status de pagamento:', { sessionId, email, paymentStatus })

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'paymentStatus é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar resultado
    let result: TestResult | undefined

    if (sessionId) {
      result = testResults.get(sessionId)
    } else if (email) {
      const emailKey = email.toLowerCase().trim()
      const sessionIds = emailIndex.get(emailKey) || []
      
      console.log('📧 Buscando sessões por email:', emailKey, 'Total:', sessionIds.length)
      
      if (sessionIds.length > 0) {
        // Pegar a sessão mais recente
        const results = sessionIds
          .map(sid => testResults.get(sid))
          .filter((r): r is TestResult => r !== undefined)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        
        result = results[0]
      }
    }

    if (!result) {
      console.log('❌ Resultado não encontrado para atualização:', { sessionId, email })
      return NextResponse.json(
        { error: 'Resultado não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar status
    result.paymentStatus = paymentStatus
    testResults.set(result.sessionId, result)

    console.log('✅ Status de pagamento atualizado com sucesso:', {
      sessionId: result.sessionId,
      email: result.email,
      paymentStatus,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: result
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    )
  }
}
