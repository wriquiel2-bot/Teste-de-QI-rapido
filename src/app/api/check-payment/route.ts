import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o Access Token do Mercado Pago está configurado
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Mercado Pago não configurado',
          message: 'Configure a variável MERCADO_PAGO_ACCESS_TOKEN nas configurações do projeto'
        },
        { status: 500 }
      )
    }

    console.log('🔍 Verificando status do pagamento:', paymentId)

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro ao verificar pagamento:', data)
      return NextResponse.json(
        { 
          error: 'Erro ao verificar pagamento',
          details: data.message || 'Erro desconhecido'
        },
        { status: response.status }
      )
    }

    console.log('✅ Status do pagamento:', data.status)

    return NextResponse.json({
      success: true,
      payment_id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      transaction_amount: data.transaction_amount,
      date_approved: data.date_approved,
      date_created: data.date_created,
      payer: {
        email: data.payer?.email,
        identification: data.payer?.identification
      }
    })

  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno ao verificar pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
