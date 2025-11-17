"use client"

import { Suspense } from "react"
import PagamentoContent from "./pagamento-content"

export default function PagamentoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-lg shadow-2xl">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <PagamentoContent />
    </Suspense>
  )
}
