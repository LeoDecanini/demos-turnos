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
    Repeat,
    Flashlight,
    ChartBar,
} from "lucide-react"
import ReusableBadge from "@/components/reusable-badge";
import Link from "next/link";
import OpinionesPage from "@/components/testimonials-section"
import Contacto from "@/components/Contacto"
import Servicios from "@/components/Servicios"
import React from "react"
import { HeroSection } from "@/components/hero-section"

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
    function Servicios() {
        return (
            <section id="servicios" className="py-28 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-32">

                    {/* Título principal */}
                    <div className="text-center max-w-2xl mx-auto">
                        <ReusableBadge>Nuestros Servicios</ReusableBadge>
                        <h2 className="text-5xl font-bold text-gray-900 mt-4 leading-tight">
                            Tratamientos diseñados para transformar tu salud
                        </h2>
                        <p className="text-xl text-gray-600 mt-4">
                            Planes personalizados basados en evidencia y adaptados a tu vida real.
                        </p>
                    </div>

                    {/* Servicio 1 */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="rounded-3xl overflow-hidden shadow-xl">
                            <img
                                src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1932&auto=format&fit=crop"
                                className="w-full h-[420px] object-cover"
                            />
                        </div>
                        <div className="space-y-6">
                            <ReusableBadge>Más elegido</ReusableBadge>
                            <h3 className="text-4xl font-bold text-gray-900">
                                Consulta Nutricional Inicial
                            </h3>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Evaluación completa, hábitos, mediciones y plan personalizado adaptado a tus objetivos.
                            </p>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                    Evaluación antropométrica completa
                                </li>
                                <li className="flex items-center gap-3">
                                    <Sparkles className="h-5 w-5 text-green-600" />
                                    Plan nutricional personalizado
                                </li>
                                <li className="flex items-center gap-3">
                                    <Heart className="h-5 w-5 text-green-600" />
                                    Recomendaciones y educación alimentaria
                                </li>
                            </ul>
                            <Button
                                className="bg-[#4CCB89] hover:bg-[#3BAB71] text-white shadow-lg mt-4"
                                asChild
                            >
                                <Link href="/reservar">Reservar Consulta</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Servicio 2 */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                        <div className="rounded-3xl overflow-hidden shadow-xl">
                            <img
                                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
                                className="w-full h-[420px] object-cover"
                            />
                        </div>
                        <div className="space-y-6">
                            <ReusableBadge>Rendimiento</ReusableBadge>
                            <h3 className="text-4xl font-bold text-gray-900">
                                Nutrición Deportiva
                            </h3>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Alimentación para rendimiento, fuerza, recuperación y composición corporal.
                            </p>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-center gap-3">
                                    <Award className="h-5 w-5 text-green-600" />
                                    Plan según tu deporte y volumen de entrenamiento
                                </li>
                                <li className="flex items-center gap-3">
                                    <Flashlight className="h-5 w-5 text-green-600" />
                                    Suplementación inteligente
                                </li>
                                <li className="flex items-center gap-3">
                                    <ChartBar className="h-5 w-5 text-green-600" />
                                    Optimización de recuperación muscular
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Servicio 3 */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="rounded-3xl overflow-hidden shadow-xl">
                            <img
                                src="https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?q=80&w=2087&auto=format&fit=crop"
                                className="w-full h-[420px] object-cover"
                            />
                        </div>
                        <div className="space-y-6">
                            <ReusableBadge>Seguimiento</ReusableBadge>
                            <h3 className="text-4xl font-bold text-gray-900">
                                Control y Seguimiento Mensual
                            </h3>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Ajustes continuos del plan, mediciones actualizadas y monitoreo real de tu progreso.
                            </p>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-green-600" />
                                    Controles antropométricos
                                </li>
                                <li className="flex items-center gap-3">
                                    <Repeat className="h-5 w-5 text-green-600" />
                                    Ajustes del plan según resultados
                                </li>
                                <li className="flex items-center gap-3">
                                    <HeartHandshake className="h-5 w-5 text-green-600" />
                                    Acompañamiento sostenido
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </section>
        )
    }

    return (
        <>
            <div className="min-h-svh">
                <HeroSection />

                {Servicios()}

                <section
                    id="diferenciales"
                    className="py-24 bg-white relative"
                >
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">

                        {/* Encabezado */}
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <ReusableBadge>¿Por qué elegirnos?</ReusableBadge>

                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                Nutrición basada en evidencia
                            </h2>

                            <div className="w-24 h-1 bg-gradient-to-r from-[#4CCB89] to-[#157347] mx-auto mb-6 rounded-full"></div>

                            <p className="text-xl text-gray-600 leading-relaxed">
                                Te acompañamos con claridad, evidencia y seguimiento real para que los
                                cambios sean sostenibles.
                            </p>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: "Evidencia y claridad",
                                    desc: "Recomendaciones actualizadas, sin mitos ni modas.",
                                    image: "/nutricion/evidencia.jpg",
                                },
                                {
                                    icon: HeartHandshake,
                                    title: "Acompañamiento real",
                                    desc: "Seguimiento periódico y ajustes personalizados.",
                                    image: "/nutricion/acompanamiento.jpg",
                                },
                                {
                                    icon: Leaf,
                                    title: "Plan sostenible",
                                    desc: "Flexibilidad real sin dietas extremas ni prohibiciones.",
                                    image: "/nutricion/sostenible.jpg",
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="
            group rounded-3xl overflow-hidden bg-white 
            border border-gray-200 shadow-sm 
            hover:shadow-xl hover:-translate-y-2 
            transition-all duration-500
          "
                                >
                                    {/* Imagen */}
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Contenido */}
                                    <div className="p-8 text-left">
                                        <div className="flex items-center mb-4">
                                            <div className="p-3 rounded-2xl bg-[#E8F9EF] border border-[#4CCB89]/20 shadow-sm">
                                                <item.icon className="h-6 w-6 text-[#157347]" />
                                            </div>
                                            <h3 className="ml-4 text-2xl font-semibold text-gray-900">
                                                {item.title}
                                            </h3>
                                        </div>

                                        <p className="text-gray-600 text-lg leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </section>

                <section className="py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-20 items-center">

                        {/* Columna de texto */}
                        <div className="space-y-10">

                            <div className="space-y-4">
                                <ReusableBadge>Nuestra Historia</ReusableBadge>

                                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                                    7 años acompañando cambios reales
                                </h2>

                                <p className="text-xl text-gray-600 leading-relaxed">
                                    Somos la Lic. Sofía Rivas y el Lic. Martín Valdez. Desde 2016 nos dedicamos a que comer mejor sea posible en la vida real: con claridad, evidencia y un acompañamiento humano.
                                </p>
                            </div>

                            {/* 3 bloques destacados con íconos */}
                            <div className="space-y-8">

                                {[
                                    {
                                        icon: Leaf,
                                        text: "Experiencia en hospitales, centros deportivos y consultorios. Siempre con enfoque práctico y basado en evidencia."
                                    },
                                    {
                                        icon: HeartHandshake,
                                        text: "En 2019 abrimos nuestro espacio propio y desde entonces acompañamos a cientos de pacientes con seguimiento cercano."
                                    },
                                    {
                                        icon: ShieldCheck,
                                        text: "Nuestro método combina evidencia, flexibilidad y ajustes constantes según tu contexto y tus objetivos reales."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start">

                                        {/* Ícono cuadrado pegado arriba */}
                                        <div className="
        p-3 rounded-xl 
        bg-[#E8F9EF] 
        border border-[#4CCB89]/30 
        flex items-start justify-center
      ">
                                            <item.icon className="h-5 w-5 text-[#157347]" />
                                        </div>

                                        {/* Texto */}
                                        <p className="text-gray-700 text-lg leading-relaxed">
                                            {item.text}
                                        </p>

                                    </div>
                                ))}

                            </div>

                            {/* Botón premium */}
                            <Link href="#equipo">
                                <Button className="bg-[#4CCB89] hover:bg-[#3BAB71] text-white shadow-md text-lg px-6 py-6 rounded-xl">
                                    Conocé a Nuestro Equipo
                                    <ChevronDown className="h-6 w-6 ml-2" />
                                </Button>
                            </Link>

                        </div>

                        {/* Columna de imágenes mejoradas */}
                        <div className="relative">

                            <div className="rounded-3xl overflow-hidden shadow-xl">
                                <img
                                    src="/nutricion/espacio-1.jpg"
                                    alt="Consultorio"
                                    className="w-full h-[500px] object-cover"
                                />
                            </div>

                            {/* Imagen flotante premium */}
                            <div className="absolute -bottom-14 -left-8 w-64 h-64 rounded-3xl overflow-hidden shadow-lg border-4 border-white">
                                <img
                                    src="/nutricion/espacio-2.jpg"
                                    alt="Atención nutricional"
                                    className="w-full h-full object-cover"
                                />
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

