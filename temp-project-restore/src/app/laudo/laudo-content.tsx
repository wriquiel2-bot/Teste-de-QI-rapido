"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Brain, TrendingUp, Award, Loader2, RefreshCw } from "lucide-react"

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
    if (iq >= 140) return { label: "Genialidade", color: "text-purple-600", bg: "bg-purple-50", emoji: "🧠" }
    if (iq >= 130) return { label: "Muito Superior", color: "text-blue-600", bg: "bg-blue-50", emoji: "🌟" }
    if (iq >= 120) return { label: "Superior", color: "text-green-600", bg: "bg-green-50", emoji: "⭐" }
    if (iq >= 110) return { label: "Acima da Média", color: "text-teal-600", bg: "bg-teal-50", emoji: "✨" }
    if (iq >= 90) return { label: "Média", color: "text-yellow-600", bg: "bg-yellow-50", emoji: "👍" }
    if (iq >= 80) return { label: "Abaixo da Média", color: "text-orange-600", bg: "bg-orange-50", emoji: "📚" }
    return { label: "Baixo", color: "text-red-600", bg: "bg-red-50", emoji: "💪" }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg text-gray-600">Carregando seu resultado...</p>
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
          <p className="text-gray-600 mb-6">{error || "Não foi possível carregar seu resultado."}</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
            Seu teste foi concluído! Assim que confirmarmos seu pagamento, você receberá acesso ao resultado completo.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Isso geralmente leva alguns minutos. Você pode atualizar esta página.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <RefreshCw className="mr-2 w-4 h-4" />
            Atualizar Página
          </Button>
        </Card>
      </div>
    )
  }

  const category = getIQCategory(result.iq_score)
  const percentage = (result.score / result.total_questions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Resultado Principal */}
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center text-white">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                <Award className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Seu Resultado do Teste de QI</h1>
            <p className="text-white/90">Análise baseada em {result.total_questions} questões</p>
          </div>

          <CardContent className="p-8">
            {/* Pontuação de QI */}
            <div className="text-center mb-8">
              <p className="text-gray-600 text-lg mb-3">Seu QI é</p>
              <div className="relative inline-block">
                <div className="text-8xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {result.iq_score}
                </div>
                <div className="absolute -top-4 -right-4 text-4xl">
                  {category.emoji}
                </div>
              </div>
              <div className={`inline-block px-8 py-3 rounded-full ${category.bg} mt-6`}>
                <p className={`text-2xl font-bold ${category.color}`}>
                  {category.label}
                </p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center">
                <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="text-4xl font-bold text-blue-600 mb-1">{result.score}</p>
                <p className="text-sm text-gray-600 font-medium">Acertos</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center">
                <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <p className="text-4xl font-bold text-green-600 mb-1">{percentage.toFixed(0)}%</p>
                <p className="text-sm text-gray-600 font-medium">Taxa de Acerto</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center">
                <Brain className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <p className="text-4xl font-bold text-purple-600 mb-1">{result.total_questions}</p>
                <p className="text-sm text-gray-600 font-medium">Questões</p>
              </div>
            </div>

            {/* Análise */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <span className="mr-2">📊</span>
                  O que significa seu QI?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Com um QI de <strong className="text-purple-600">{result.iq_score}</strong>, você está na categoria <strong className="text-purple-600">{category.label}</strong>. 
                  {result.iq_score >= 130 && " Parabéns! Você está entre os 2% mais inteligentes da população mundial! 🎉"}
                  {result.iq_score >= 120 && result.iq_score < 130 && " Excelente! Você está entre os 10% mais inteligentes da população! 🌟"}
                  {result.iq_score >= 110 && result.iq_score < 120 && " Muito bem! Você está acima da média da população geral. ⭐"}
                  {result.iq_score >= 90 && result.iq_score < 110 && " Você está na média da população, o que é ótimo! 👍"}
                  {result.iq_score < 90 && " Continue praticando e desenvolvendo suas habilidades cognitivas! 💪"}
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <span className="mr-2">📈</span>
                  Comparação com a Média Mundial
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Média Mundial</span>
                    <span className="text-gray-500 font-bold">100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Seu QI</span>
                    <span className="text-blue-600 font-bold text-xl">{result.iq_score}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.min((result.iq_score / 160) * 100, 100)}%` }}
                    >
                      <span className="text-white text-xs font-bold">
                        {result.iq_score >= 100 ? `+${result.iq_score - 100}` : result.iq_score - 100}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Dicas para Continuar Evoluindo
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span>Pratique jogos de lógica e quebra-cabeças regularmente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span>Leia livros variados para expandir seu conhecimento</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span>Aprenda novas habilidades e idiomas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span>Mantenha uma rotina saudável com exercícios físicos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">✓</span>
                    <span>Desafie-se constantemente com novos problemas</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Ação */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Fazer Novo Teste
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-white text-sm space-y-1 pb-8">
          <p className="font-medium">Teste realizado em {new Date(result.completed_at).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}</p>
          <p className="opacity-75">© 2024 Teste de QI - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  )
}
