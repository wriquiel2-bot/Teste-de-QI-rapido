import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, cpf, phone, amount = 5.00 } = body

    // Validações
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o Token da Kiwify está configurado
    const kiwifyToken = process.env.KIWIFY_API_TOKEN

    if (!kiwifyToken) {
      return NextResponse.json(
        { 
          error: 'Kiwify não configurado',
          message: 'Configure a variável KIWIFY_API_TOKEN nas configurações do projeto.',
          instructions: [
            '1. Acesse sua conta na Kiwify: https://dashboard.kiwify.com.br',
            '2. Vá em Configurações → Integrações → API',
            '3. Copie seu Token de API',
            '4. Adicione como variável de ambiente: KIWIFY_API_TOKEN'
          ]
        },
        { status: 500 }
      )
    }

    // Criar pagamento na Kiwify
    const paymentData = {
      product_id: process.env.KIWIFY_PRODUCT_ID || 'seu_produto_id',
      customer: {
        email: email,
        name: name,
        cpf: cpf?.replace(/\D/g, ''),
        phone: phone?.replace(/\D/g, '')
      },
      payment: {
        method: 'pix',
        amount: Number(amount) * 100 // Kiwify usa centavos
      }
    }

    console.log('🔄 Criando pagamento Pix na Kiwify...')
    console.log('📧 Email:', email)
    console.log('👤 Nome:', name)
    console.log('💰 Valor:', amount)

    const response = await fetch('https://api.kiwify.com.br/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kiwifyToken}`
      },
      body: JSON.stringify(paymentData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro da Kiwify:', data)
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Token de API inválido',
            message: 'Verifique se você está usando o Token correto da Kiwify.',
            instructions: [
              '1. Acesse: https://dashboard.kiwify.com.br',
              '2. Vá em Configurações → Integrações → API',
              '3. Copie o Token de API',
              '4. Atualize a variável KIWIFY_API_TOKEN'
            ],
            details: data
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Erro ao gerar Pix',
          message: data.message || 'Erro desconhecido',
          details: data
        },
        { status: response.status }
      )
    }

    console.log('✅ Pagamento Pix criado com sucesso na Kiwify!')
    console.log('🆔 Order ID:', data.id)

    // Retornar dados do Pix
    return NextResponse.json({
      success: true,
      order_id: data.id,
      qr_code: data.pix?.qr_code,
      qr_code_base64: data.pix?.qr_code_base64,
      payment_url: data.payment_url,
      amount: amount,
      status: data.status
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
