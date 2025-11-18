import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, cpf, phone, amount = 5.00 } = body

    // Validações
    if (!email || !name || !cpf) {
      return NextResponse.json(
        { error: 'Email, nome e CPF são obrigatórios' },
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

    // Criar pagamento Pix no Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description: 'Teste de QI - Laudo Completo',
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
        identification: {
          type: 'CPF',
          number: cpf.replace(/\D/g, '')
        }
      }
    }

    console.log('🔄 Criando pagamento Pix no Mercado Pago...')
    console.log('📧 Email:', email)
    console.log('👤 Nome:', name)
    console.log('💰 Valor:', amount)

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro do Mercado Pago:', data)
      return NextResponse.json(
        { 
          error: 'Erro ao gerar Pix',
          details: data.message || 'Erro desconhecido'
        },
        { status: response.status }
      )
    }

    console.log('✅ Pagamento Pix criado com sucesso!')
    console.log('🆔 Payment ID:', data.id)
    console.log('🔑 Chave Pix gerada!')

    // Retornar dados do Pix
    return NextResponse.json({
      success: true,
      payment_id: data.id,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: data.point_of_interaction?.transaction_data?.ticket_url,
      expiration_date: data.date_of_expiration,
      amount: data.transaction_amount
    })

  } catch (error) {
    console.error('❌ Erro ao criar Pix:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno ao gerar Pix',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
