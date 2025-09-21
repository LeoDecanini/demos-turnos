"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

function isStandalone() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches ||
      // iOS Safari
      // @ts-expect-error
      !!window.navigator.standalone)
  )
}

export default function StandalonePwaGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isStandalone()) {
      document.documentElement.classList.remove("pwa-standalone")
      return
    }

    // marca el DOM para ocultar header/footer con CSS
    document.documentElement.classList.add("pwa-standalone")

    // si por cualquier motivo no estás en /reservar, forzá redirect
    if (!pathname.startsWith("/reservar")) {
      router.replace("/reservar")
    }

    // opcional: cualquier link fuera de /reservar abre “afuera” del shell
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
      if (!a) return
      const url = new URL(a.href, location.origin)
      if (!url.pathname.startsWith("/reservar")) {
        e.preventDefault()
        window.open(a.href, "_blank", "noopener")
      }
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [pathname, router])

  return null
}
