import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('📥 Webhook Kiwify recebido:', JSON.stringify(body, null, 2))

    // TODO: Validar assinatura com HMAC usando body.signature e KIWIFY_WEBHOOK_SECRET

    // Verificar se é um evento de pagamento aprovado
    const orderStatus = body.order?.order_status
    const webhookEventType = body.order?.webhook_event_type
    const email = body.order?.Customer?.email
    const orderId = body.order?.order_id

    if (!email) {
      console.log('⚠️ Email não encontrado no webhook')
      return NextResponse.json({ ok: true })
    }

    // Processar apenas eventos de pagamento aprovado
    if (orderStatus === 'paid' || webhookEventType === 'order_approved') {
      console.log(`✅ Pagamento aprovado para: ${email}`)

      // Buscar o último teste não pago deste email
      const { data, error } = await supabaseAdmin
        .from('test_results')
        .select('*')
        .eq('customer_email', email)
        .eq('payment_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        console.log(`⚠️ Nenhum teste pendente encontrado para: ${email}`)
        return NextResponse.json({ ok: true })
      }

      // Atualizar o teste para marcar como pago
      const { error: updateError } = await supabaseAdmin
        .from('test_results')
        .update({
          payment_verified: true,
          order_id: orderId
        })
        .eq('id', data.id)

      if (updateError) {
        console.error('❌ Erro ao atualizar pagamento:', updateError)
        return NextResponse.json({ ok: true })
      }

      console.log(`✅ Pagamento verificado para teste ID: ${data.id}`)
    } else {
      console.log(`ℹ️ Evento ignorado: ${orderStatus} / ${webhookEventType}`)
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json({ ok: true })
  }
}
