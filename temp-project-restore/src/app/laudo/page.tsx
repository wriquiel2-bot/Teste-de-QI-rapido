"use client"

import { Suspense } from "react"
import LaudoContent from "./laudo-content"

export default function LaudoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-lg shadow-2xl">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Carregando seu laudo...</p>
        </div>
      </div>
    }>
      <LaudoContent />
    </Suspense>
  )
}
