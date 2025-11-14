"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"

export default function PagamentoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')
  const email = searchParams.get('email')
  const [checking, setChecking] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)

  useEffect(() => {
    if (!sessionId || !email) {
      router.push('/')
      return
    }

    // Abrir Kiwify automaticamente com a URL atualizada
    const kiwifyUrl = `https://pay.kiwify.com.br/tuCgVCt?email=${encodeURIComponent(email)}`
    window.open(kiwifyUrl, '_blank')

    // Verificar pagamento a cada 3 segundos
    const interval = setInterval(async () => {
      await checkPayment()
    }, 3000)

    return () => clearInterval(interval)
  }, [sessionId, email])

  const checkPayment = async () => {
    if (!sessionId) return

    try {
      setChecking(true)
      const response = await fetch(`/api/test-result?session=${sessionId}`)
      const data = await response.json()

      if (data.payment_verified) {
        setPaymentVerified(true)
        // Redirecionar para o laudo após 2 segundos
        setTimeout(() => {
          router.push(`/laudo?session=${sessionId}`)
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
    } finally {
      setChecking(false)
    }
  }

  if (paymentVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 shadow-2xl">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
            Pagamento Confirmado!
          </CardTitle>
          <p className="text-gray-600 mb-6">
            Redirecionando para seu laudo...
          </p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-orange-600 to-red-600 p-4 rounded-full">
              <ExternalLink className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Complete seu Pagamento
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Instruções */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 p-6 rounded-lg">
            <h3 className="font-bold text-lg text-blue-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Instruções:
            </h3>
            <ol className="space-y-2 text-blue-900">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Uma nova aba foi aberta com a página de pagamento do Kiwify</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Complete o pagamento de <strong>R$ 5,00</strong> nessa aba</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Aguarde a confirmação (geralmente 10-30 segundos)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Você será redirecionado automaticamente para seu laudo</span>
              </li>
            </ol>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <div className="flex items-center justify-center gap-3 mb-4">
              {checking ? (
                <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
              ) : (
                <div className="w-6 h-6 rounded-full border-4 border-yellow-600 border-t-transparent animate-spin" />
              )}
              <p className="font-bold text-yellow-900">
                Aguardando confirmação do pagamento...
              </p>
            </div>
            <p className="text-sm text-yellow-800 text-center">
              Verificando automaticamente a cada 3 segundos
            </p>
          </div>

          {/* Botão manual */}
          <Button 
            onClick={checkPayment}
            disabled={checking}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar Pagamento Agora"
            )}
          </Button>

          {/* Alerta importante */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  ⚠️ Não feche esta página!
                </p>
                <p className="text-xs text-red-800">
                  Mantenha esta aba aberta enquanto completa o pagamento. Você será redirecionado automaticamente após a confirmação.
                </p>
              </div>
            </div>
          </div>

          {/* Link para reabrir Kiwify */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">A página de pagamento não abriu?</p>
            <Button
              variant="outline"
              onClick={() => {
                const kiwifyUrl = `https://pay.kiwify.com.br/tuCgVCt?email=${encodeURIComponent(email || '')}`
                window.open(kiwifyUrl, '_blank')
              }}
              className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <ExternalLink className="mr-2 w-4 h-4" />
              Abrir Página de Pagamento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
