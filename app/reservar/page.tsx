"use client"

import { Hammer } from "lucide-react"

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center text-center max-w-md">
        <Hammer className="w-16 h-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Formulario de reservas</h1>
        <p className="text-gray-600">
          Estamos trabajando en esta sección. Muy pronto vas a poder hacer tus reservas desde acá.
        </p>
      </div>
    </div>
  )
}
