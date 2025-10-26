"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    CalendarCheck,
    Star,
    MapPin,
    Phone,
    Mail,
    Clock,
    Instagram,
    ChevronRight,
    ShieldCheck,
    HeartHandshake,
    Leaf,
    Sparkles,
    Award,
    Heart, ChevronDown,
} from "lucide-react"
import ReusableBadge from "@/components/reusable-badge";
import Link from "next/link";
import OpinionesPage from "@/components/testimonials-section"
import Contacto from "@/components/Contacto"
import Servicios from "@/components/Servicios"
import React from "react"

export default function Home() {
    const router = useRouter()

    const handleNavigation = (path: string) => {
        router.push(path)
        // Force scroll to top immediately
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "auto" })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
        }, 0)
    }

    const handleSectionScroll = (sectionId: string) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }

    type MediaItem = { type?: "image" | "video"; src: string; poster?: string }

    function MediaSlider({ items }: { items: MediaItem[] }) {
        const [idx, setIdx] = React.useState(0)
        const goPrev = () => setIdx((v) => (v - 1 + items.length) % items.length)
        const goNext = () => setIdx((v) => (v + 1) % items.length)

        const isVideo = (m: MediaItem) => m.type === "video" || /\.(mp4|webm|ogv|ogg)(\?.*)?$/i.test(m.src)
        const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([])

        // drag
        const containerRef = React.useRef<HTMLDivElement | null>(null)
        const startX = React.useRef<number | null>(null)
        const deltaX = React.useRef(0)
        const containerW = React.useRef(1)
        const [dragging, setDragging] = React.useState(false)
        const THRESHOLD_PX = 60

        React.useEffect(() => {
            videoRefs.current.forEach((v, i) => {
                if (!v) return
                if (i === idx) { v.currentTime = 0; v.play().catch(() => { }) } else { v.pause() }
            })
        }, [idx])

        const onDown = (e: React.PointerEvent) => {
            setDragging(true)
            startX.current = e.clientX
            deltaX.current = 0
            containerW.current = containerRef.current?.clientWidth || 1
                ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }
        const onMove = (e: React.PointerEvent) => {
            if (!dragging || startX.current == null) return
            deltaX.current = e.clientX - startX.current
            setFake((v) => v + 1) // re-render para ver arrastre
        }
        const onUp = (e: React.PointerEvent) => {
            if (!dragging) return
            setDragging(false)
                ; (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
            const dx = deltaX.current
            deltaX.current = 0
            startX.current = null
            if (Math.abs(dx) > THRESHOLD_PX) {
                dx < 0 ? goNext() : goPrev()
            } else {
                setFake((v) => v + 1) // snap back
            }
        }

        const [, setFake] = React.useState(0)

        const offsetPctWhileDrag = dragging
            ? (-idx * 100) + (deltaX.current / containerW.current) * 100
            : (-idx * 100)

        return (
            <div
                ref={containerRef}
                className="relative w-full h-full overflow-hidden group rounded-lg select-none touch-pan-y"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onPointerLeave={(e) => dragging && onUp(e as any)}
            >
                {/* Track horizontal */}
                <div
                    className="absolute inset-0 flex"
                    style={{
                        transform: `translateX(${offsetPctWhileDrag}%)`,
                        transition: dragging ? "none" : "transform 400ms cubic-bezier(.22,.61,.36,1)",
                        willChange: "transform",
                    }}
                >
                    {items.map((m, i) => (
                        <div key={i} className="shrink-0 grow-0 basis-full h-full relative">
                            {isVideo(m) ? (
                                <video
                                    /* @ts-ignore */
                                    ref={(el) => (videoRefs.current[i] = el)}
                                    src={m.src}
                                    poster={m.poster}
                                    className="w-full h-full object-cover object-center"
                                    controls
                                    playsInline
                                    muted
                                    loop
                                    preload="metadata"
                                />
                            ) : (
                                <img src={m.src} alt="" className="w-full h-full object-cover object-center" loading="lazy" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Dots */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-20">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Ir a slide ${i + 1}`}
                            onClick={() => setIdx(i)}
                            className={`h-2.5 w-2.5 rounded-full ${i === idx ? "bg-green-500" : "bg-white/80 hover:bg-white"}`}
                        />
                    ))}
                </div>

                {/* Flechas (md+) - sin sombra, con stopPropagation */}
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center h-10 w-10 rounded-full
                   bg-white/85 backdrop-blur border border-black/10 hover:bg-white focus:outline-none z-20"
                    aria-label="Anterior"
                >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                </button>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center h-10 w-10 rounded-full
                   bg-white/85 backdrop-blur border border-black/10 hover:bg-white focus:outline-none z-20"
                    aria-label="Siguiente"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        )
    }

    type Service = {
        title: string
        description?: string
        media: MediaItem[]
        groups?: { label: string; items: string[] }[]
        popular?: boolean
    }

    // ServiceCard: sin card en mobile; en md+ borde sutil, sin sombras y más padding
    function ServiceCard({ s }: { s: Service }) {
        return (
            <Card
                className="
        bg-transparent border shadow-none
        md:bg-white md:border-gray-200/70 p-4 md:shadow-none md:rounded-2xl
      "
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 p-0 md:p-8">
                    <div className="flex flex-col gap-3 md:gap-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">{s.title}</h3>
                            {s.popular && (
                                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-3 py-1 font-semibold">
                                    Popular
                                </Badge>
                            )}
                        </div>
                        {s.description && <p className="text-gray-700 leading-relaxed-moveup">{s.description}</p>}
                        {s.groups && (
                            <div className="space-y-3 md:space-y-4">
                                {s.groups.map((g, i) => (
                                    <div key={i} className="rounded-2xl ring-1 ring-green-100/60 bg-green-50/40 px-4 py-3 md:px-4 md:py-3">
                                        <div className="text-sm font-semibold tracking-wide text-green-700 mb-2">{g.label}</div>
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                            {g.items.map((it, idx) => (
                                                <li key={idx} className="text-gray-700 leading-relaxed-moveup font-medium">
                                                    {it}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative w-full rounded-lg h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px]">
                        <MediaSlider items={s.media} />
                    </div>
                </div>
            </Card>
        )
    }


    const services: Service[] = [
        {
            title: "Consulta Nutricional Inicial",
            popular: true,
            description:
                "Primera consulta completa que incluye evaluación nutricional, antropométrica y diseño de plan personalizado. Analizamos tus hábitos alimentarios, estilo de vida y objetivos para crear un plan adaptado a tus necesidades.",
            media: [
                { type: "image", src: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1932&auto=format&fit=crop" }
            ],
            groups: [
                {
                    label: "Incluye",
                    items: [
                        "� Evaluación antropométrica completa",
                        "🎯 Plan nutricional personalizado",
                        "� Análisis de hábitos alimentarios",
                        "� Recomendaciones de actividad física"
                    ]
                }
            ]
        },
        {
            title: "Plan de Alimentación Deportiva",
            description:
                "Asesoramiento nutricional especializado para deportistas y personas activas. Optimizamos tu alimentación para mejorar el rendimiento deportivo, la recuperación muscular y alcanzar tus objetivos físicos.",
            media: [
                { type: "image", src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" }
            ],
            groups: [
                {
                    label: "Beneficios",
                    items: [
                        "🏃‍♂️ Mejora del rendimiento deportivo",
                        "💪 Optimización de la recuperación",
                        "⚡ Plan de suplementación deportiva",
                        "📊 Seguimiento del progreso"
                    ]
                }
            ]
        },
        {
            title: "Control y Seguimiento Nutricional",
            description:
                "Sesiones de seguimiento para ajustar tu plan nutricional, evaluar progresos y superar obstáculos. Incluye mediciones antropométricas actualizadas y ajustes en tu plan según los resultados.",
            media: [
                { type: "image", src: "https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?q=80&w=2087&auto=format&fit=crop" }
            ],
            groups: [
                {
                    label: "Características",
                    items: [
                        "📈 Evaluación de progreso",
                        "🔄 Ajustes del plan nutricional",
                        "💡 Solución de dudas y obstáculos",
                        "🎯 Refuerzo de objetivos"
                    ]
                }
            ]
        }
    ]


    // === En ServiciosSection: carrusel grande con deslizamiento horizontal + drag ===
    // === Carrusel grande con deslizamiento horizontal + drag ===
    function ServiciosSection() {
        const pages = services.map((s) => [s]) // 1 por página
        const [page, setPage] = React.useState(0)
        const goPrev = () => setPage((p) => (p - 1 + pages.length) % pages.length)
        const goNext = () => setPage((p) => (p + 1) % pages.length)

        // refs y drag
        const trackRef = React.useRef<HTMLDivElement | null>(null)
        const viewportRef = React.useRef<HTMLDivElement | null>(null)
        const startX = React.useRef<number | null>(null)
        const deltaX = React.useRef(0)
        const [dragging, setDragging] = React.useState(false)
        const viewportW = React.useRef(1)
        const THRESHOLD_PX = 80
        const [, setBump] = React.useState(0)

        const onOuterDown = (e: React.PointerEvent) => {
            setDragging(true)
            startX.current = e.clientX
            deltaX.current = 0
            viewportW.current = viewportRef.current?.clientWidth || 1
                ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }
        const onOuterMove = (e: React.PointerEvent) => {
            if (!dragging || startX.current == null) return
            deltaX.current = e.clientX - startX.current
            setBump((v) => v + 1)
        }
        const onOuterUp = (e: React.PointerEvent) => {
            if (!dragging) return
            setDragging(false)
                ; (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
            const dx = deltaX.current
            deltaX.current = 0
            startX.current = null
            if (Math.abs(dx) > THRESHOLD_PX) dx < 0 ? goNext() : goPrev()
            else setBump((v) => v + 1)
        }

        React.useEffect(() => {
            const h = (ev: KeyboardEvent) => {
                if (ev.key === "ArrowLeft") goPrev()
                if (ev.key === "ArrowRight") goNext()
            }
            window.addEventListener("keydown", h)
            return () => window.removeEventListener("keydown", h)
        }, [])

        const offsetPctWhileDrag = dragging
            ? (-page * 100) + (deltaX.current / (viewportW.current || 1)) * 100
            : (-page * 100)

        return (
            <section id="servicios" className="py-24 relative overflow-hidden">
                <div className="relative max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <ReusableBadge className="mb-2">Nuestros Servicios</ReusableBadge>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
                            Nuestros tratamientos
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-green-600 mx-auto mb-4 rounded-full" />
                        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed-moveup">
                            Ofrecemos servicios de nutrición personalizados para ayudarte a alcanzar tus objetivos de salud y bienestar de forma sostenible.
                        </p>
                    </div>

                    {/* Viewport: overflow-hidden, separación lateral de cada página */}
                    <div
                        ref={viewportRef}
                        className="relative overflow-hidden select-none touch-pan-y"
                        onPointerDown={onOuterDown}
                        onPointerMove={onOuterMove}
                        onPointerUp={onOuterUp}
                        onPointerCancel={onOuterUp}
                        onPointerLeave={(e) => dragging && onOuterUp(e as any)}
                    >
                        {/* Track horizontal */}
                        <div
                            ref={trackRef}
                            className="flex w-full"
                            style={{
                                transform: `translateX(${offsetPctWhileDrag}%)`,
                                transition: dragging ? "none" : "transform 450ms cubic-bezier(.22,.61,.36,1)",
                                willChange: "transform",
                            }}
                        >
                            {pages.map((group, i) => (
                                <div key={i} className="basis-full shrink-0 grow-0 px-4 md:px-6">
                                    {group.map((s, idx) => (
                                        <div key={`${i}-${idx}-${s.title}`} className="mb-8">
                                            <ServiceCard s={s} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Dots */}
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {pages.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`h-2.5 w-2.5 rounded-full ${i === page ? "bg-green-500" : "bg-green-200 hover:bg-green-300"}`}
                                    aria-label={`Ir a servicio ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Flechas externas (md+) visibles en desktop */}
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:grid place-items-center h-11 w-11 rounded-full
             bg-white/90 backdrop-blur border border-black/10 hover:bg-white z-30"
                        >
                            <ChevronRight className="h-5 w-5 rotate-180" />
                        </button>

                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:grid place-items-center h-11 w-11 rounded-full
             bg-white/90 backdrop-blur border border-black/10 hover:bg-white z-30"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* CTA igual */}
                    <div className="mt-16 text-center">
                        <Link href={"/reservar"}>
                            <Button variant="outline" className="bg-gradient-to-r from-green-50 to-green-50 border-2 border-green-200 hover:from-green-500 hover:to-green-600 hover:text-white transition-all duration-300 font-semibold py-3">
                                Ver todos los servicios
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        )
    }


    return (
        <>
            <div className="min-h-svh">
                <section className="relative h-[92vh] min-h-[700px] w-full overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                        <img
                            src="/instalanciones-1.jpg"
                            alt="Centro de estética"
                            className="w-full h-full object-cover scale-105"
                        />
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-green-900/40"></div>
                        <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>

                    <div
                        className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                        <div
                            className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 max-w-2xl">
                            <Badge
                                className="mb-3 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 hover:from-green-200 hover:to-emerald-200 border-0 px-4 py-2 text-sm font-medium shadow-lg transition-colors">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Centro de Nutrición
                            </Badge>
                            <h1 className="text-2xl md:text-5xl font-bold text-white mb-3 leading-tight">
                                Belleza y Bienestar{" "}
                                <span
                                    className="bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                                    Profesional
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-100 mb-6 leading-relaxed-moveup font-light">
                                Descubre nuestros tratamientos personalizados para realzar tu belleza natural con los
                                mejores
                                profesionales y tecnología de vanguardia.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link href={"/reservar"}>
                                    <Button
                                        size="lg"
                                        className="h-14 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                                    >
                                        <CalendarCheck className="mr-3 h-6 w-6" />
                                        Reservar Cita
                                    </Button>
                                </Link>
                                <Link href={"#servicios"}>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="h-14 px-8 text-white hover:text-green-900 border-2 border-white/30 hover:bg-white/90 bg-white/10 backdrop-blur-sm font-semibold transition-all duration-300 hover:scale-105"
                                    >
                                        Ver Servicios
                                        <ChevronRight className="ml-3 h-6 w-6" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {ServiciosSection()}

                <section
                    id="diferenciales"
                    className="py-24 bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]"></div>
                    <div className="relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <ReusableBadge>¿Por qué elegirnos?</ReusableBadge>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
                            Nutrición basada en evidencia
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-600 mx-auto mb-8 rounded-full"></div>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed-moveup mb-16">
                            Te acompañamos con planes realistas, educación alimentaria y seguimiento cercano para que los cambios sean sostenibles.
                        </p>

                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {[
                                    {
                                        icon: ShieldCheck,
                                        title: "Evidencia y claridad",
                                        desc: "Recomendaciones actualizadas, sin mitos ni modas. Educación simple para tomar mejores decisiones.",
                                        image: "/nutricion/evidencia.jpg",
                                    },
                                    {
                                        icon: HeartHandshake,
                                        title: "Acompañamiento real",
                                        desc: "Seguimiento periódico, ajustes por progreso y herramientas prácticas para construir hábitos.",
                                        image: "/nutricion/acompanamiento.jpg",
                                    },
                                    {
                                        icon: Leaf,
                                        title: "Plan sostenible",
                                        desc: "Flexibilidad, gustos y contexto personal. Comer mejor sin dietas extremas ni prohibiciones.",
                                        image: "/nutricion/sostenible.jpg",
                                    },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3"
                                    >
                                        <div className="relative h-80 overflow-hidden">
                                            <img
                                                src={item.image || "/placeholder.svg"}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-green-900/20 group-hover:from-emerald-800/30 group-hover:to-green-800/30 transition-all duration-500"></div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                            <div className="flex items-center mb-4">
                                                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-2xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <item.icon className="h-6 w-6 text-white" />
                                                </div>
                                                <h3 className="font-bold text-2xl group-hover:text-emerald-200 transition-colors duration-300">
                                                    {item.title}
                                                </h3>
                                            </div>
                                            <p className="text-gray-100 text-left text-lg leading-relaxed-moveup font-light">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sobre Nosotros */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <div>
                                    <ReusableBadge>Nuestra Historia</ReusableBadge>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                        Más de 7 años acompañando cambios reales
                                    </h2>
                                    <p className="text-lg text-gray-700 mb-6">
                                        Somos la Lic. Sofía Rivas y el Lic. Martín Valdez, un equipo de nutrición que nació en 2016 con una idea simple: comer mejor tiene que ser posible en la vida real. Empezamos atendiendo en consultorios pequeños y, con el tiempo, fuimos sumando experiencia en hospitales y centros deportivos, siempre con enfoque humano y basado en evidencia.
                                    </p>
                                    <p className="text-lg text-gray-700 mb-8">
                                        En 2019 abrimos nuestro primer espacio propio y desde entonces trabajamos en planes personalizados, educación alimentaria y seguimiento cercano. Durante 2021 incorporamos atención online y herramientas digitales para que cada persona pueda sostener hábitos sin dietas extremas ni culpas.
                                    </p>
                                    <p className="text-lg text-gray-700 mb-8">
                                        Hoy acompañamos a adolescentes y adultos con objetivos diversos: recomposición corporal, salud cardiometabólica, digestiva y mejora del rendimiento. Nuestro método combina claridad, flexibilidad y ajustes constantes según tu contexto.
                                    </p>
                                </div>

                                <Link href={"#equipo"}>
                                    <Button
                                        variant="outline"
                                        className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 hover:from-emerald-500 hover:to-green-600 hover:text-white transition-all duration-300 font-semibold py-3"
                                    >
                                        Conocé a Nuestro Equipo
                                        <ChevronDown className="h-6 w-6" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="relative">
                                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                                    <img
                                        src="/nutricion/espacio-1.jpg"
                                        alt="Nuestro consultorio de nutrición"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-16 sm:-bottom-6 -left-3 sm:-left-6 w-64 h-64 rounded-2xl overflow-hidden border-8 border-white shadow-xl">
                                    <img
                                        src="/nutricion/espacio-2.jpg"
                                        alt="Sesión de educación alimentaria"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonios */}
                <section
                    className="py-24 bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(77, 169, 48, 0.1),transparent_50%)]"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <ReusableBadge>
                                Testimonios
                            </ReusableBadge>
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
                                Lo que dicen nuestros pacientes
                            </h2>
                            <div
                                className="w-24 h-1 bg-gradient-to-r from-green-500 to-green-600 mx-auto mb-4 rounded-full"></div>
                            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed-moveup">
                                La satisfacción de nuestros pacientes es nuestra mejor carta de presentación y el
                                testimonio de nuestro
                                compromiso con la excelencia.
                            </p>
                        </div>
                    </div>
                    <OpinionesPage />
                </section>

                {/* Equipo */}
                <section id="equipo" className="py-24 relative overflow-hidden">
                    <div className="relative mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <ReusableBadge>Nuestro Equipo</ReusableBadge>
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
                                Profesionales en Nutrición
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-600 mx-auto mb-4 rounded-full"></div>
                            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed-moveup">
                                Un equipo humano, basado en evidencia y enfocado en acompañarte con planes reales y sostenibles.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                            {[
                                {
                                    name: "Lic. Sofía Rivas",
                                    image: "/nutricion/sofia.jpg",
                                },
                                {
                                    name: "Lic. Martín Valdez",
                                    image: "/nutricion/martin.jpg",
                                },
                            ].map((member, i) => (
                                <Card
                                    key={i}
                                    className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/90 backdrop-blur-sm pt-0"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-green-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative">
                                        <div className="h-96 overflow-hidden relative">
                                            <img
                                                src={member.image || "/placeholder.svg"}
                                                alt={member.name}
                                                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-2 rounded-full">
                                                                <Award className="h-4 w-4 text-white" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">Licenciatura en Nutrición</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <CardHeader className="pt-4">
                                            <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300">
                                                {member.name}
                                            </CardTitle>
                                        </CardHeader>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contacto */}
                {/* <Contacto /> */}
            </div>
        </>
    )
}

