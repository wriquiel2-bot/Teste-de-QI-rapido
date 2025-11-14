"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Brain, TrendingUp, Award, Download, Share2, Loader2 } from "lucide-react"

interface TestResult {
  iq_score: number
  score: number
  total_questions: number
  customer_email: string
  completed_at: string
  payment_verified: boolean
}

export default function LaudoContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!sessionId) {
      setError("Sessão não encontrada. Por favor, complete o teste primeiro.")
      setLoading(false)
      return
    }

    // Buscar resultado do teste
    fetchTestResult()
  }, [sessionId])

  const fetchTestResult = async () => {
    try {
      const response = await fetch(`/api/test-result?session=${sessionId}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError("Erro ao carregar o laudo. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const getIQCategory = (iq: number) => {
    if (iq >= 140) return { label: "Genialidade", color: "text-purple-600", bg: "bg-purple-50" }
    if (iq >= 130) return { label: "Muito Superior", color: "text-blue-600", bg: "bg-blue-50" }
    if (iq >= 120) return { label: "Superior", color: "text-green-600", bg: "bg-green-50" }
    if (iq >= 110) return { label: "Acima da Média", color: "text-teal-600", bg: "bg-teal-50" }
    if (iq >= 90) return { label: "Média", color: "text-yellow-600", bg: "bg-yellow-50" }
    if (iq >= 80) return { label: "Abaixo da Média", color: "text-orange-600", bg: "bg-orange-50" }
    return { label: "Baixo", color: "text-red-600", bg: "bg-red-50" }
  }

  const handleDownload = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Meu QI é ${result?.iq_score}!`,
        text: `Acabei de descobrir que meu QI é ${result?.iq_score}! Faça você também o teste.`,
        url: window.location.origin
      })
    }
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
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
          <p className="text-gray-600 mb-6">{error || "Não foi possível carregar seu laudo."}</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            Voltar ao Início
          </Button>
        </Card>
      </div>
    )
  }

  if (!result.payment_verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aguardando Pagamento</h2>
          <p className="text-gray-600 mb-6">
            Seu teste foi concluído! Assim que confirmarmos seu pagamento, você receberá acesso ao laudo completo.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Isso geralmente leva alguns minutos. Você pode atualizar esta página ou aguardar.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-600 to-red-600"
          >
            Atualizar Página
          </Button>
        </Card>
      </div>
    )
  }

  const category = getIQCategory(result.iq_score)
  const percentage = (result.score / result.total_questions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full">
                <Award className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Seu Laudo Completo de QI
            </CardTitle>
            <p className="text-gray-600 mt-2">Análise detalhada do seu desempenho</p>
          </CardHeader>
        </Card>

        {/* Pontuação Principal */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-2">Seu QI é</p>
              <div className="text-8xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {result.iq_score}
              </div>
              <div className={`inline-block px-6 py-3 rounded-full ${category.bg}`}>
                <p className={`text-xl font-bold ${category.color}`}>
                  {category.label}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg text-center">
                <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600">{result.score}</p>
                <p className="text-sm text-gray-600">Respostas Corretas</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{percentage.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Taxa de Acerto</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg text-center">
                <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600">{result.total_questions}</p>
                <p className="text-sm text-gray-600">Total de Questões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análise Detalhada */}
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">📊 Análise Detalhada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-2">O que significa seu QI?</h3>
              <p className="text-gray-700">
                Com um QI de <strong>{result.iq_score}</strong>, você está na categoria <strong>{category.label}</strong>. 
                {result.iq_score >= 120 && " Isso coloca você entre os 10% mais inteligentes da população!"}
                {result.iq_score >= 100 && result.iq_score < 120 && " Você está acima ou na média da população geral."}
                {result.iq_score < 100 && " Continue desenvolvendo suas habilidades cognitivas!"}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Comparação com a População</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Média Mundial (100)</span>
                  <span className="font-bold text-blue-600">
                    {result.iq_score >= 100 ? `+${result.iq_score - 100}` : result.iq_score - 100} pontos
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min((result.iq_score / 160) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-2">💡 Dicas para Desenvolvimento</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Pratique jogos de lógica e quebra-cabeças regularmente</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Leia livros variados para expandir seu vocabulário</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Aprenda novas habilidades e idiomas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Mantenha uma rotina de exercícios físicos</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleDownload}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Download className="mr-2 w-5 h-5" />
                Baixar Certificado (PDF)
              </Button>
              <Button 
                onClick={handleShare}
                className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Share2 className="mr-2 w-5 h-5" />
                Compartilhar Resultado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-white text-sm">
          <p>Teste realizado em {new Date(result.completed_at).toLocaleDateString('pt-BR')}</p>
          <p className="mt-2 opacity-75">© 2024 Teste de QI - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  )
}
