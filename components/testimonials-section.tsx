"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle2, Star } from "lucide-react"
import clsx from "clsx"

type Testimonial = {
  id: number
  name: string
  date: string
  avatar: string
  rating: number
  text: string
}

const BASE: Omit<Testimonial, "id">[] = [
  { name: "Luciana Perez Zamora", date: "Hace 1 año", avatar: "/1.png", rating: 5, text: "Los recomiendo 100%! Amables, atentos y predispuestos. Hace años que me atiendo con ellos y siempre con excelentes resultados." },
  { name: "Carolina Rodríguez", date: "Hace 11 meses", avatar: "/2.png", rating: 5, text: "Profesionales capacitados, ambiente cálido y prolijo, atención personalizada. 100% recomendable." },
  { name: "Federico C", date: "Hace 1 año", avatar: "/3.png", rating: 5, text: "Excelentes profesionales, muy amables y explican todo sin problemas. Buenos precios y muy buena ubicación." },
  { name: "Walter Wally Canella", date: "Hace 1 año", avatar: "/4.png", rating: 5, text: "Muchísimos tratamientos y atención personalizada por sus dueños. Si te gusta cuidarte, no dudes en consultarlos." },
  { name: "Cyn EN LONDRES", date: "Hace 1 año", avatar: "/5.png", rating: 5, text: "Me hice botox y tuve una gran experiencia. Me sentí contenida y el resultado fue espectacular." },
  { name: "Mirta Nieves Zamora", date: "Hace 11 meses", avatar: "/6.png", rating: 5, text: "Impecable consultorio, amorosos los médicos, muy atentos. Súper recomendable." },
  { name: "Ceres Manon", date: "Hace 1 año", avatar: "/7.png", rating: 5, text: "Amo ir a esta estética, me siento segura y confiada. Los recomiendo siempre!" },
  { name: "Maria Lujan Flores", date: "Hace 1 año", avatar: "/8.png", rating: 5, text: "Excelente atención y servicios. Realmente las mejores manos y productos." },
]

function Stars({ n = 5, size = 16 }: { n?: number; size?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} style={{ width: size, height: size }} className="text-green-400 fill-green-400" />
      ))}
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.8 0-.7-.1-1.2-.2-1.7H12z" />
      <path fill="#4285F4" d="M3.7 7.5l3.2 2.3C7.6 8.4 9.6 6.9 12 6.9c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3 14.7 2 12 2 8.3 2 5.2 4.1 3.7 7.5z" />
      <path fill="#FBBC05" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-2.8-2.3C14.8 18 13.6 18.5 12 18.5c-2.9 0-5.4-2-6.2-4.7l-3 2.3C4.2 19.8 7.8 22 12 22z" />
      <path fill="#34A853" d="M5.8 13.8c-.2-.6-.3-1.3-.3-1.8s.1-1.2.3-1.8L2.8 7.9C2.3 9 2 10.5 2 12s.3 3 1 4.1l2.8-2.3z" />
    </svg>
  )
}

export default function OpinionesPage() {
  const [perPage, setPerPage] = useState(4)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 640) setPerPage(1)
      else if (w < 1024) setPerPage(2)
      else setPerPage(4)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const slides = useMemo(() => {
    const out: Testimonial[][] = []
    /* @ts-ignore */
    for (let i = 0; i < BASE.length; i += perPage) out.push(BASE.slice(i, i + perPage))
    return out
  }, [perPage])

  useEffect(() => setPage(0), [perPage])

  const pages = slides.length
  const goTo = (i: number) => setPage(((i % pages) + pages) % pages)
  const next = () => goTo(page + 1)
  const prev = () => goTo(page - 1)

  useEffect(() => {
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [page, pages])

  return (
    <section id="testimonios" className="relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/*         <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Opiniones verificadas</h2>
          <p className="text-muted-foreground mt-2">Reseñas reales de nuestros clientes en Google.</p>
        </div> */}

        <div className="relative md:px-6">
          <div className="overflow-hidden">
            <div
              className="grid grid-flow-col auto-cols-[100%] transition-transform duration-500"
              style={{ transform: `translateX(-${page * 100}%)` }}
            >
              {slides.map((group, idx) => (
                <div key={idx} className="w-full">
                  <div
                    className={clsx(
                      "grid gap-5",
                      perPage === 1 ? "grid-cols-1" : perPage === 2 ? "grid-cols-2" : "grid-cols-4"
                    )}
                  >
                    {group.map((t) => (
                      <Card key={t.id} className="rounded-2xl border shadow-sm">
                        <CardContent className="px-3 py-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="font-semibold leading-tight">{t.name}</p>
                                <p className="text-xs text-gray-500">{t.date}</p>
                              </div>
                            </div>
                            <GoogleLogo />
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Stars n={t.rating} />
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          </div>

                          <p className="text-sm text-gray-700 line-clamp-4">{t.text}</p>
                         {/*  <button className="mt-3 text-sm text-gray-500 hover:text-gray-700">Leer más</button> */}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={prev}
              className="hidden md:flex hover:cursor-pointer absolute md:-left-8 left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white shadow-md border z-10 pointer-events-auto"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={next}
              className="hidden md:flex absolute hover:cursor-pointer md:-right-8 right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white shadow-md border z-10 pointer-events-auto"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="md:hidden mt-4 flex justify-center gap-3">
            <Button type="button" variant="outline" size="icon" onClick={prev} aria-label="Anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={next} aria-label="Siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {perPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    i === page ? "bg-foreground" : "bg-foreground/30"
                  )}
                  aria-label={`Ir a página ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
