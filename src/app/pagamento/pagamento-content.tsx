"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CreditCard, FileText, QrCode, CheckCircle2, Copy, AlertCircle } from "lucide-react"

export default function PagamentoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')
  const emailParam = searchParams.get('email')
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'boleto' | 'pix'>('pix')
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: emailParam || '',
    cpf: '',
    phone: ''
  })

  useEffect(() => {
    if (!sessionId || !emailParam) {
      router.push('/')
      return
    }

    // Verificar pagamento a cada 5 segundos quando Pix for gerado
    let interval: NodeJS.Timeout
    if (pixData) {
      interval = setInterval(async () => {
        await checkPayment()
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionId, emailParam, pixData])

  const checkPayment = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/test-result?session=${sessionId}`)
      const data = await response.json()

      if (data.payment_verified) {
        router.push(`/laudo?session=${sessionId}`)
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const handleGeneratePix = async () => {
    // Validações
    if (!formData.name || !formData.email || !formData.cpf) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Por favor, insira um email válido')
      return
    }

    const cpfNumbers = formData.cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11 && cpfNumbers.length !== 14) {
      setError('CPF/CNPJ inválido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          cpf: cpfNumbers,
          phone: formData.phone.replace(/\D/g, ''),
          amount: 5.00
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar Pix')
      }

      setPixData(data)
      console.log('✅ Pix gerado com sucesso!')

    } catch (err) {
      console.error('❌ Erro ao gerar Pix:', err)
      setError(err instanceof Error ? err.message : 'Erro ao gerar chave Pix. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Se Pix foi gerado, mostrar QR Code
  if (pixData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-full">
                <QrCode className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Pague com Pix
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg border-2 border-green-500">
              <div className="flex justify-center mb-4">
                {pixData.qr_code_base64 && (
                  <img 
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="w-64 h-64"
                  />
                )}
              </div>
              
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-green-600">R$ 5,00</p>
                <p className="text-sm text-gray-600">Escaneie o QR Code com seu app de banco</p>
              </div>

              {/* Código Pix Copia e Cola */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ou copie o código Pix:</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixData.qr_code}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={copyPixCode}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 font-semibold">✓ Código copiado!</p>
                )}
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 p-6 rounded-lg">
              <h3 className="font-bold text-lg text-blue-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">📋</span>
                Como pagar:
              </h3>
              <ol className="space-y-2 text-blue-900">
                <li className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span>Abra o app do seu banco</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span>Escolha pagar com Pix QR Code</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">3.</span>
                  <span>Escaneie o código acima ou cole o código Pix</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">4.</span>
                  <span>Confirme o pagamento de R$ 5,00</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">5.</span>
                  <span>Aguarde alguns segundos - você será redirecionado automaticamente!</span>
                </li>
              </ol>
            </div>

            {/* Status */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
                <p className="font-bold text-yellow-900">
                  Aguardando pagamento...
                </p>
              </div>
              <p className="text-sm text-yellow-800 text-center mt-2">
                Verificando automaticamente a cada 5 segundos
              </p>
            </div>

            {/* Alerta */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">
                    ⚠️ Não feche esta página!
                  </p>
                  <p className="text-xs text-red-800">
                    Mantenha esta aba aberta. Você será redirecionado automaticamente após o pagamento.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulário de pagamento
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-orange-600 to-red-600 p-4 rounded-full">
              <QrCode className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Finalize seu Pagamento
          </CardTitle>
          <p className="text-gray-600 mt-2">Preencha os dados abaixo para gerar seu Pix</p>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Erro */}
          {error && (
            <div className="bg-red-50 border-2 border-red-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">{error}</p>
              </div>
            </div>
          )}

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="João da Silva"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF/CNPJ *</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                maxLength={18}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                maxLength={15}
                className="h-12"
              />
            </div>
          </div>

          {/* Métodos de Pagamento */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Método de Pagamento</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('card')}
                disabled
                className={`p-4 rounded-lg border-2 transition-all opacity-50 cursor-not-allowed ${
                  paymentMethod === 'card'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-semibold text-gray-400">Cartão</p>
                <p className="text-xs text-gray-400">Em breve</p>
              </button>

              <button
                onClick={() => setPaymentMethod('boleto')}
                disabled
                className={`p-4 rounded-lg border-2 transition-all opacity-50 cursor-not-allowed ${
                  paymentMethod === 'boleto'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-semibold text-gray-400">Boleto</p>
                <p className="text-xs text-gray-400">Em breve</p>
              </button>

              <button
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <QrCode className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-semibold text-green-600">Pix</p>
                <p className="text-xs text-green-600">Instantâneo</p>
              </button>
            </div>
          </div>

          {/* Informações do Pix */}
          {paymentMethod === 'pix' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 p-6 rounded-lg">
              <h3 className="font-bold text-lg text-green-900 mb-3 flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                Pagamento via Pix
              </h3>
              <ul className="space-y-2 text-green-900 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Aprovação instantânea</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Acesso imediato ao laudo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Pagamento 100% seguro</span>
                </li>
              </ul>
            </div>
          )}

          {/* Preço e Botão */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-500 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">Valor total</p>
            <p className="text-6xl font-bold text-orange-600 mb-4">R$ 5,00</p>
            
            <Button 
              onClick={handleGeneratePix}
              disabled={loading || !formData.name || !formData.email || !formData.cpf}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                  Gerando Pix...
                </>
              ) : (
                <>
                  <QrCode className="mr-3 w-6 h-6" />
                  Pagar Agora
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-600 mt-4">
              🔒 Pagamento 100% seguro via Mercado Pago
            </p>
          </div>

          {/* Garantia */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900 font-semibold mb-1">
              💯 Garantia de 7 dias
            </p>
            <p className="text-xs text-blue-800">
              Se não ficar satisfeito com seu laudo, devolvemos 100% do seu dinheiro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
