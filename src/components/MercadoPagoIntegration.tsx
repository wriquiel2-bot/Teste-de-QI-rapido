'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Copy, QrCode, AlertCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function KiwifyIntegration() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    cpf: '',
    phone: '',
    amount: '5.00'
  })
  const [pixData, setPixData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorInstructions, setErrorInstructions] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setFormData(prev => ({ ...prev, cpf: formatted }))
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  const handleCreatePix = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setPixData(null)
    setError(null)
    setErrorInstructions([])

    try {
      const response = await fetch('/api/create-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 500 && data.error === 'Kiwify não configurado') {
          setError(data.message)
          setErrorInstructions(data.instructions || [])
          toast.error('Kiwify não configurado')
          throw new Error(data.message)
        }

        if (response.status === 401) {
          setError(data.message)
          setErrorInstructions(data.instructions || [])
          toast.error('Token de API inválido')
          throw new Error(data.message)
        }

        setError(data.message || data.error)
        throw new Error(data.error || 'Erro ao gerar Pix')
      }

      setPixData(data)
      toast.success('Pix gerado com sucesso!')
    } catch (error) {
      console.error('Erro:', error)
      if (!error) {
        toast.error('Erro ao gerar Pix')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Pagamento via Kiwify
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de pagamento Pix integrado com Kiwify
          </p>
        </div>

        {error && (
          <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <div className="space-y-2">
                <p className="font-semibold">{error}</p>
                {errorInstructions.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    {errorInstructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Gerar Pagamento Pix</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para gerar um pagamento via Pix com a Kiwify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePix} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="joao@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="5.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Pix...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar Pix
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {pixData && (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento Gerado</CardTitle>
              <CardDescription>
                Use o QR Code ou copie o código Pix para realizar o pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {pixData.qr_code_base64 && (
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code Pix"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                {pixData.qr_code && (
                  <div className="w-full space-y-2">
                    <Label>Código Pix (Copia e Cola)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={pixData.qr_code || ''}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(pixData.qr_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {pixData.payment_url && (
                  <Button
                    onClick={() => window.open(pixData.payment_url, '_blank')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Página de Pagamento
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-4 w-full text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">ID do Pedido:</p>
                    <p className="font-mono font-semibold">{pixData.order_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Valor:</p>
                    <p className="font-semibold">
                      R$ {pixData.amount?.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
          <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            <div className="space-y-3">
              <p className="font-semibold text-lg">
                🔑 Como configurar a Kiwify:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Acesse sua conta na{' '}
                  <a 
                    href="https://dashboard.kiwify.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Kiwify
                  </a>
                </li>
                <li>
                  Vá em <strong>Configurações → Integrações → API</strong>
                </li>
                <li>
                  Copie seu <strong>Token de API</strong>
                </li>
                <li>
                  Copie também o <strong>ID do Produto</strong> que deseja vender
                </li>
                <li>
                  Vá em <strong>Configurações do Projeto → Variáveis de Ambiente</strong>
                </li>
                <li>
                  Adicione duas variáveis:
                  <div className="mt-2 space-y-2 bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs">
                    <div>
                      <strong>Nome:</strong> KIWIFY_API_TOKEN<br/>
                      <strong>Valor:</strong> [seu token da Kiwify]
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-700 pt-2">
                      <strong>Nome:</strong> KIWIFY_PRODUCT_ID<br/>
                      <strong>Valor:</strong> [ID do seu produto]
                    </div>
                  </div>
                </li>
                <li>Salve e teste a integração!</li>
              </ol>
              <p className="text-xs mt-3">
                💡 <strong>Vantagens da Kiwify:</strong> Interface simples, suporte em português, ideal para infoprodutos e produtos digitais.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
