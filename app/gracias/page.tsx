"use client"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GraciasPage() {
  useEffect(() => {
    (window as any).fbq?.("track", "Lead")
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center px-4">
        <h1 className="text-3xl font-bold mb-4">¡Gracias por contactarnos!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Nos pondremos en contacto con vos a la brevedad.
        </p>
        <Button asChild className="bg-black text-white hover:bg-gray-800">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
