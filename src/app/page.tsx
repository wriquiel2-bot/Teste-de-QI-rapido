"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Brain, CheckCircle2, ArrowRight, CreditCard } from "lucide-react"
import Link from "next/link"

// Perguntas do teste de QI - 35 perguntas
const questions = [
  {
    id: 1,
    question: "Qual número completa a sequência: 2, 4, 8, 16, ?",
    options: ["24", "32", "20", "28"],
    correct: "32"
  },
  {
    id: 2,
    question: "Se todos os Bloops são Razzies e todos os Razzies são Lazzies, então todos os Bloops são necessariamente Lazzies?",
    options: ["Sim", "Não", "Impossível determinar", "Depende"],
    correct: "Sim"
  },
  {
    id: 3,
    question: "Qual palavra não pertence ao grupo: Cachorro, Gato, Leão, Mesa?",
    options: ["Cachorro", "Gato", "Leão", "Mesa"],
    correct: "Mesa"
  },
  {
    id: 4,
    question: "Se 5 máquinas fazem 5 produtos em 5 minutos, quanto tempo levam 100 máquinas para fazer 100 produtos?",
    options: ["5 minutos", "100 minutos", "20 minutos", "10 minutos"],
    correct: "5 minutos"
  },
  {
    id: 5,
    question: "Qual é o próximo número na sequência: 1, 1, 2, 3, 5, 8, ?",
    options: ["10", "11", "13", "15"],
    correct: "13"
  },
  {
    id: 6,
    question: "Analógico é para Digital assim como Livro é para ?",
    options: ["Papel", "E-book", "Biblioteca", "Leitura"],
    correct: "E-book"
  },
  {
    id: 7,
    question: "Se você reorganizar as letras 'CIFAIPC', você obtém o nome de um(a):",
    options: ["Cidade", "Animal", "Oceano", "País"],
    correct: "Oceano"
  },
  {
    id: 8,
    question: "Qual número é diferente dos outros: 3, 5, 11, 14, 17, 21?",
    options: ["3", "5", "14", "17"],
    correct: "14"
  },
  {
    id: 9,
    question: "Qual é o próximo número: 100, 96, 92, 88, ?",
    options: ["84", "82", "86", "80"],
    correct: "84"
  },
  {
    id: 10,
    question: "Se A = 1, B = 2, C = 3, qual é o valor de CAB?",
    options: ["312", "321", "123", "213"],
    correct: "312"
  },
  {
    id: 11,
    question: "Qual forma completa o padrão: Círculo, Quadrado, Triângulo, Círculo, Quadrado, ?",
    options: ["Círculo", "Quadrado", "Triângulo", "Retângulo"],
    correct: "Triângulo"
  },
  {
    id: 12,
    question: "Se João é mais alto que Maria e Maria é mais alta que Pedro, quem é o mais baixo?",
    options: ["João", "Maria", "Pedro", "Impossível determinar"],
    correct: "Pedro"
  },
  {
    id: 13,
    question: "Qual número vem a seguir: 2, 6, 12, 20, 30, ?",
    options: ["40", "42", "38", "44"],
    correct: "42"
  },
  {
    id: 14,
    question: "Médico está para Hospital assim como Professor está para ?",
    options: ["Livro", "Escola", "Aluno", "Ensino"],
    correct: "Escola"
  },
  {
    id: 15,
    question: "Quantos triângulos existem em um pentágono dividido por todas as suas diagonais?",
    options: ["5", "10", "15", "20"],
    correct: "10"
  },
  {
    id: 16,
    question: "Se CASA = 3141 e SACA = 1431, quanto é ASSA?",
    options: ["4114", "1441", "4141", "1414"],
    correct: "4114"
  },
  {
    id: 17,
    question: "Qual é o oposto de EXPANDIR?",
    options: ["Crescer", "Contrair", "Aumentar", "Ampliar"],
    correct: "Contrair"
  },
  {
    id: 18,
    question: "Complete: 1, 4, 9, 16, 25, ?",
    options: ["30", "35", "36", "40"],
    correct: "36"
  },
  {
    id: 19,
    question: "Se todos os X são Y e alguns Y são Z, então:",
    options: ["Todos X são Z", "Alguns X são Z", "Nenhum X é Z", "Impossível determinar"],
    correct: "Impossível determinar"
  },
  {
    id: 20,
    question: "Qual palavra está mais relacionada com OCEANO?",
    options: ["Montanha", "Deserto", "Mar", "Floresta"],
    correct: "Mar"
  },
  {
    id: 21,
    question: "Se 3 gatos pegam 3 ratos em 3 minutos, quantos gatos são necessários para pegar 100 ratos em 100 minutos?",
    options: ["3", "33", "100", "300"],
    correct: "3"
  },
  {
    id: 22,
    question: "Qual letra completa a sequência: A, C, F, J, ?",
    options: ["M", "N", "O", "P"],
    correct: "O"
  },
  {
    id: 23,
    question: "Se você tem 6 maçãs e tira 4, quantas você tem?",
    options: ["2", "4", "6", "10"],
    correct: "4"
  },
  {
    id: 24,
    question: "Qual número não pertence: 2, 3, 5, 7, 9, 11?",
    options: ["2", "3", "9", "11"],
    correct: "9"
  },
  {
    id: 25,
    question: "Complete a analogia: Dia está para Noite assim como Verão está para ?",
    options: ["Primavera", "Outono", "Inverno", "Calor"],
    correct: "Inverno"
  },
  {
    id: 26,
    question: "Qual é o próximo na sequência: Z, Y, X, W, ?",
    options: ["V", "U", "T", "S"],
    correct: "V"
  },
  {
    id: 27,
    question: "Se um relógio marca 3:15, qual é o ângulo entre os ponteiros?",
    options: ["0°", "7.5°", "15°", "22.5°"],
    correct: "7.5°"
  },
  {
    id: 28,
    question: "Quantos cubos de 1cm cabem em um cubo de 3cm?",
    options: ["9", "18", "27", "36"],
    correct: "27"
  },
  {
    id: 29,
    question: "Qual palavra não se relaciona: Alegre, Feliz, Contente, Triste?",
    options: ["Alegre", "Feliz", "Contente", "Triste"],
    correct: "Triste"
  },
  {
    id: 30,
    question: "Se A > B e B > C, então:",
    options: ["A = C", "A < C", "A > C", "Impossível determinar"],
    correct: "A > C"
  },
  {
    id: 31,
    question: "Complete: 3, 6, 11, 18, 27, ?",
    options: ["36", "38", "40", "42"],
    correct: "38"
  },
  {
    id: 32,
    question: "Qual é o número que falta: 2, 5, 10, 17, ?, 37",
    options: ["24", "26", "28", "30"],
    correct: "26"
  },
  {
    id: 33,
    question: "Se ROMA tem 4 letras e AMOR tem 4 letras, quantas letras tem RAMO?",
    options: ["3", "4", "5", "6"],
    correct: "4"
  },
  {
    id: 34,
    question: "Qual figura geométrica tem exatamente 5 lados?",
    options: ["Quadrado", "Pentágono", "Hexágono", "Triângulo"],
    correct: "Pentágono"
  },
  {
    id: 35,
    question: "Complete a sequência lógica: 1, 2, 4, 7, 11, 16, ?",
    options: ["20", "21", "22", "23"],
    correct: "22"
  }
]

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showPayment, setShowPayment] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [email, setEmail] = useState("")
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value)
  }

  const handleNextQuestion = () => {
    // Salva a resposta atual
    setAnswers({ ...answers, [questions[currentQuestion].id]: selectedAnswer })
    setSelectedAnswer("")

    // Se for a última pergunta, mostra o botão de pagamento
    if (currentQuestion === questions.length - 1) {
      setShowPayment(true)
    } else {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleBuyNow = async () => {
    if (!email || !email.includes('@')) {
      alert('Por favor, insira um email válido para receber seu laudo!')
      return
    }

    // Calcular pontuação
    let score = 0
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === parseInt(questionId))
      if (question && question.correct === answer) {
        score++
      }
    })

    // Calcular QI baseado na pontuação
    const percentage = (score / questions.length) * 100
    const iqScore = Math.round(70 + (percentage / 100) * 60) // Range de 70 a 130

    try {
      // Salvar resultado no banco
      const response = await fetch('/api/test-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          email,
          answers,
          score,
          iqScore
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar resultado')
      }

      // Redirecionar para o Kiwify com email como parâmetro
      const kiwifyUrl = `https://pay.kiwify.com.br/tuCgVCt?email=${encodeURIComponent(email)}`
      window.open(kiwifyUrl, '_blank')

      // Após alguns segundos, redirecionar para a página do laudo
      setTimeout(() => {
        window.location.href = `/laudo?session=${sessionId}`
      }, 2000)

    } catch (error) {
      console.error('Erro ao processar:', error)
      alert('Erro ao processar seu teste. Tente novamente.')
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  // Tela de pagamento após completar o questionário
  if (showPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-0">
          {/* Imagem do Produto */}
          <div className="relative h-64 w-full overflow-hidden rounded-t-lg">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop" 
              alt="Adolescentes fazendo teste de QI"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-2">🎉 Parabéns!</h2>
                <p className="text-lg">Você completou o teste!</p>
              </div>
            </div>
          </div>

          <CardHeader className="text-center space-y-4 pt-8">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-green-500 to-teal-500 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Receba Seu Laudo Completo
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Descubra seu QI exato e receba um certificado digital com análise detalhada!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8">
            {/* Campo de Email */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
              <Label htmlFor="email" className="text-lg font-semibold text-gray-900 mb-2 block">
                📧 Digite seu email para receber o laudo:
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg"
                required
              />
              <p className="text-xs text-gray-600 mt-2">
                Seu laudo será vinculado a este email
              </p>
            </div>

            {/* O que está incluído */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg">
              <h3 className="font-semibold text-xl text-gray-900 mb-4">📊 Seu laudo incluirá:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 flex-shrink-0 text-xl">✓</span>
                  <span><strong>Pontuação exata do seu QI</strong> baseada nas suas respostas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 flex-shrink-0 text-xl">✓</span>
                  <span><strong>Análise detalhada</strong> das suas habilidades cognitivas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 flex-shrink-0 text-xl">✓</span>
                  <span><strong>Comparação com a média</strong> da população mundial</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 flex-shrink-0 text-xl">✓</span>
                  <span><strong>Certificado digital</strong> para compartilhar ou imprimir</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 flex-shrink-0 text-xl">✓</span>
                  <span><strong>Dicas personalizadas</strong> para desenvolver seu potencial</span>
                </li>
              </ul>
            </div>

            {/* Preço e CTA */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Oferta especial por tempo limitado</p>
              <p className="text-6xl font-bold text-green-600 mb-2">R$ 5,00</p>
              <p className="text-sm text-gray-500 mb-6">Pagamento único • Acesso imediato ao laudo</p>
              
              <Button 
                onClick={handleBuyNow}
                disabled={!email || !email.includes('@')}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="mr-3 w-6 h-6" />
                COMPRAR AGORA POR R$ 5,00
              </Button>
              
              <p className="text-xs text-gray-600 mt-4">
                🔒 Pagamento 100% seguro via Kiwify • ⚡ Receba seu laudo instantaneamente
              </p>
            </div>

            {/* Garantia */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-900 font-semibold mb-1">
                💯 Garantia de 7 dias
              </p>
              <p className="text-xs text-blue-800">
                Se não ficar satisfeito com seu laudo, devolvemos 100% do seu dinheiro. Sem perguntas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela do questionário
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-0">
        {/* Header com imagem */}
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop" 
            alt="Adolescentes fazendo teste de QI"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-1">Teste De QI Rápido</h1>
              <p className="text-sm opacity-90">Descubra seu potencial intelectual</p>
            </div>
          </div>
        </div>

        <CardHeader className="pb-4">
          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Pergunta {currentQuestion + 1} de {questions.length}</span>
              <span>{Math.round(progress)}% completo</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Pergunta atual */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                {currentQuestion + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {questions[currentQuestion].question}
                </h3>
                
                {/* Opções de resposta */}
                <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                  <div className="space-y-3">
                    {questions[currentQuestion].options.map((option, index) => (
                      <div 
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedAnswer === option 
                            ? 'border-purple-600 bg-purple-50' 
                            : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                        onClick={() => handleAnswerSelect(option)}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label 
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Botão de próxima pergunta */}
          <Button 
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {currentQuestion === questions.length - 1 ? (
              <>
                <CheckCircle2 className="mr-2 w-5 h-5" />
                FINALIZAR TESTE
              </>
            ) : (
              <>
                PRÓXIMA PERGUNTA
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>

          {/* Dica motivacional */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm text-yellow-900">
              <strong>💡 Dica:</strong> Não se preocupe se achar difícil! O teste é projetado para desafiar diferentes níveis de habilidade.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
