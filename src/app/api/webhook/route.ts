import { NextRequest, NextResponse } from 'next/server'
import { processKiwifyWebhook, validateWebhookSignature } from '@/lib/kiwify'
import type { KiwifyWebhookPayload } from '@/types/kiwify'

export async function POST(request: NextRequest) {
  try {
    // Ler o payload do webhook
    const body = await request.text()
    const payload: KiwifyWebhookPayload = JSON.parse(body)
    
    // Validar assinatura (segurança)
    const signature = request.headers.get('x-kiwify-signature') || ''
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET || ''
    
    if (webhookSecret && !validateWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Processar transação
    const transaction = processKiwifyWebhook(payload)
    
    // Verificar se pagamento foi aprovado
    if (transaction.status === 'paid' || transaction.status === 'approved') {
      console.log('✅ Pagamento aprovado:', transaction)
      
      // Aqui você pode:
      // 1. Salvar no banco de dados
      // 2. Enviar email com o laudo
      // 3. Liberar acesso ao resultado
      
      // Por enquanto, apenas retorna sucesso
      return NextResponse.json({
        success: true,
        message: 'Pagamento processado com sucesso',
        transaction
      })
    }
    
    // Outros status (pending, failed, etc)
    console.log('⏳ Status do pagamento:', transaction.status)
    return NextResponse.json({
      success: true,
      message: 'Webhook recebido',
      status: transaction.status
    })
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Permitir apenas POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
