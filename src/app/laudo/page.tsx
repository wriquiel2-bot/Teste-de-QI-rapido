"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Download, Share2, CheckCircle2, TrendingUp, Award, Loader2, RefreshCw } from "lucide-react"

interface TestResult {
  sessionId: string
  email: string
  score: number
  iqScore: number
  timestamp: string
  paymentStatus: 'pending' | 'paid' | 'refused' | 'refunded'
}

function LaudoContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const fetchResult = async () => {
    if (!sessionId) {
      setError('Sessão não encontrada')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/test-result?sessionId=${sessionId}`)
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setError(null)
      } else {
        setError('Resultado não encontrado')
      }
    } catch (err) {
      console.error('Erro ao buscar resultado:', err)
      setError('Erro ao carregar resultado')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  useEffect(() => {
    fetchResult()
  }, [sessionId])

  // Auto-refresh a cada 10 segundos se pagamento estiver pendente
  useEffect(() => {
    if (result?.paymentStatus === 'pending') {
      const interval = setInterval(() => {
        console.log('🔄 Verificando status de pagamento automaticamente...')
        fetchResult()
      }, 10000) // 10 segundos

      return () => clearInterval(interval)
    }
  }, [result?.paymentStatus])

  const handleCheckPayment = () => {
    setChecking(true)
    fetchResult()
  }

  const getIQCategory = (iq: number) => {
    if (iq >= 130) return { label: "Muito Superior", color: "text-purple-600", bg: "bg-purple-50" }
    if (iq >= 120) return { label: "Superior", color: "text-blue-600", bg: "bg-blue-50" }
    if (iq >= 110) return { label: "Acima da Média", color: "text-green-600", bg: "bg-green-50" }
    if (iq >= 90) return { label: "Média", color: "text-yellow-600", bg: "bg-yellow-50" }
    if (iq >= 80) return { label: "Abaixo da Média", color: "text-orange-600", bg: "bg-orange-50" }
    return { label: "Baixo", color: "text-red-600", bg: "bg-red-50" }
  }

  const getPercentile = (iq: number) => {
    if (iq >= 130) return 98
    if (iq >= 120) return 91
    if (iq >= 110) return 75
    if (iq >= 100) return 50
    if (iq >= 90) return 25
    return 10
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg text-gray-600">Carregando seu laudo...</p>
        </Card>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <p className="text-lg text-red-600 mb-4">{error || 'Resultado não encontrado'}</p>
          <Button onClick={() => window.location.href = '/'}>
            Voltar ao início
          </Button>
        </Card>
      </div>
    )
  }

  // Verificar status do pagamento
  if (result.paymentStatus !== 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 p-4 rounded-full">
                <Loader2 className="w-12 h-12 text-yellow-600 animate-spin" />
              </div>
            </div>
            <CardTitle className="text-3xl">Aguardando Confirmação de Pagamento</CardTitle>
            <CardDescription className="text-lg">
              Seu laudo será liberado automaticamente assim que o pagamento for confirmado
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>📧 Email:</strong> {result.email}
              </p>
              <p className="text-gray-700">
                <strong>🔢 Sessão:</strong> {result.sessionId.substring(0, 8)}...
              </p>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
              <p className="text-gray-700 mb-2">
                ⏱️ <strong>Verificação automática ativa</strong>
              </p>
              <p className="text-sm text-gray-600">
                Esta página está verificando o status do pagamento automaticamente a cada 10 segundos.
              </p>
            </div>

            <p className="text-gray-600">
              O processamento pode levar alguns minutos. Você receberá um email assim que o pagamento for confirmado.
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleCheckPayment} 
                disabled={checking}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Verificar Agora
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Voltar ao início
              </Button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>💡 Dica:</strong> Mantenha esta página aberta. Ela será atualizada automaticamente quando o pagamento for confirmado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const category = getIQCategory(result.iqScore)
  const percentile = getPercentile(result.iqScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do Laudo */}
        <Card className="border-0 shadow-2xl">
          <div className="relative h-32 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-lg">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="bg-white p-4 rounded-full shadow-lg">
                <Brain className="w-16 h-16 text-purple-600" />
              </div>
            </div>
          </div>
          <CardHeader className="text-center pt-16 pb-8">
            <CardTitle className="text-4xl font-bold mb-2">Seu Laudo de QI</CardTitle>
            <CardDescription className="text-lg">
              Análise completa do seu desempenho cognitivo
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Pontuação Principal */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-2">Seu QI é</p>
              <div className="text-8xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {result.iqScore}
              </div>
              <div className={`inline-block px-6 py-3 rounded-full ${category.bg}`}>
                <p className={`text-xl font-semibold ${category.color}`}>
                  {category.label}
                </p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600 mb-1">{result.score}/35</p>
                <p className="text-sm text-gray-600">Respostas Corretas</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600 mb-1">{percentile}%</p>
                <p className="text-sm text-gray-600">Percentil</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600 mb-1">Top {100 - percentile}%</p>
                <p className="text-sm text-gray-600">Da População</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análise Detalhada */}
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">📊 Análise Detalhada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">O que significa seu resultado?</h3>
              <p className="text-gray-700 leading-relaxed">
                Com um QI de {result.iqScore}, você está na categoria <strong>{category.label}</strong>. 
                Isso significa que você pontuou melhor que aproximadamente <strong>{percentile}% da população</strong> em 
                testes de raciocínio lógico, matemático e verbal.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">💡 Suas Habilidades</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Raciocínio lógico e capacidade de resolver problemas complexos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Habilidade de reconhecer padrões e sequências</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Capacidade de análise verbal e compreensão de conceitos abstratos</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">🎯 Recomendações</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">→</span>
                  <span>Continue desafiando seu cérebro com jogos de lógica e quebra-cabeças</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">→</span>
                  <span>Leia regularmente para expandir seu vocabulário e conhecimento</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">→</span>
                  <span>Pratique matemática e resolução de problemas para manter suas habilidades afiadas</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Download className="mr-2 w-5 h-5" />
                Baixar Certificado PDF
              </Button>
              <Button variant="outline" className="flex-1 h-14 text-lg">
                <Share2 className="mr-2 w-5 h-5" />
                Compartilhar Resultado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6 text-center text-sm text-gray-600">
            <p className="mb-2">
              <strong>Importante:</strong> Este teste fornece uma estimativa do seu QI baseada em questões de raciocínio lógico.
            </p>
            <p>
              Para uma avaliação mais completa e precisa, consulte um psicólogo especializado.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Laudo gerado em {new Date(result.timestamp).toLocaleDateString('pt-BR')} • Email: {result.email}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LaudoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg text-gray-600">Carregando...</p>
        </Card>
      </div>
    }>
      <LaudoContent />
    </Suspense>
  )
}
