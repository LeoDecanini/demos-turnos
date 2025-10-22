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
                            className={`h-2.5 w-2.5 rounded-full ${i === idx ? "bg-amber-500" : "bg-white/80 hover:bg-white"}`}
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
                                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0 px-3 py-1 font-semibold">
                                    Popular
                                </Badge>
                            )}
                        </div>
                        {s.description && <p className="text-gray-700 leading-relaxed-moveup">{s.description}</p>}
                        {s.groups && (
                            <div className="space-y-3 md:space-y-4">
                                {s.groups.map((g, i) => (
                                    <div key={i} className="rounded-2xl ring-1 ring-amber-100/60 bg-amber-50/40 px-4 py-3 md:px-4 md:py-3">
                                        <div className="text-sm font-semibold tracking-wide text-amber-700 mb-2">{g.label}</div>
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
            title: "Ácido hialurónico",
            popular: true,
            description:
                "El ácido hialurónico es un componente natural de la piel que utilizamos como relleno dérmico para restaurar volumen, proyectar e hidratar áreas específicas del rostro. Con la edad su producción disminuye, apareciendo arrugas y pérdida de volumen. Beneficios: restaurar volumen, hidratación profunda, suavizar arrugas y mejorar zonas con déficit de volumen como ojeras. Utilizamos Juvederm de Allergan. El efecto es inmediato y bien tolerado.",
            media: [
                { type: "image", src: "/servicios/serv1-img1.jpg" },
                { type: "image", src: "/servicios/serv1-img2.jpg" },
                { type: "image", src: "/servicios/serv1-img3.jpg" },
                { type: "image", src: "/servicios/serv1-img4.jpg" }
            ],
            groups: [{ label: "Inyectables", items: ["💉 Hidratación y perfilado de labios", "💉 Rinomodelación"] }]
        },
        {
            title: "Mesoterapia francesa NCTF",
            description:
                "La mesoterapia francesa es un tratamiento que se administra mediante microinyecciones en la capa media de la piel. Su fórmula combina 60 ingredientes (vitaminas, minerales, aminoácidos y ácido hialurónico, entre otros) para hidratar, estimular colágeno, aportar luminosidad y suavizar líneas finas. Zonas de aplicación: rostro completo, cuello y escote. Especialmente pensada para contorno ocular y peribucal. Tratamiento bien tolerado. Se aplica cada 21 días a 1 mes. Protocolo completo: 3 a 5 sesiones.",
            media: [
                { type: "video", src: "/servicios/serv2-vid1.mp4", poster: "/servicios/serv2-vid1.jpg" },
                { type: "video", src: "/servicios/serv2-vid2.mp4", poster: "/servicios/serv2-vid2.jpg" },
                { type: "image", src: "/servicios/serv2-img1.jpg" }
            ],
            groups: [{ label: "Beneficios", items: ["💉 Periocular", "💉 Peribucal"] }]
        },
        {
            title: "Bioestimuladores",
            description:
                "Los bioestimuladores son sustancias inyectables que estimulan la producción de colágeno y elastina, mejorando la firmeza y la elasticidad de la piel. Resultados naturales que comienzan a verse al mes. La duración total del tratamiento varía entre 12 y 15 meses.",
            media: [
                { type: "image", src: "/servicios/serv3-img1.jpg" },
                { type: "image", src: "/servicios/serv3-img2.jpg" },
                { type: "image", src: "/servicios/serv3-img3.jpg" },
                { type: "image", src: "/servicios/serv3-img4.jpg" },
                { type: "image", src: "/servicios/serv3-img6.jpg" }
            ],
            groups: [
                {
                    label: "Marcas disponibles",
                    items: [
                        "🔬 radiesse (hidroxiapatita de calcio) – importado",
                        "🔬 sculptra (ácido poliláctico) – importado",
                        "🔬 harmonyca (hidroxiapatita de calcio + ácido hialurónico) – importado",
                        "🔬 cientific (hidroxiapatita de calcio) – nacional",
                        "🔬 profhilo (ácido hialurónico ultrapuro) – importado",
                        "🔬 profhilo structura (ácido hialurónico) – importado"
                    ]
                }
            ]
        },
        {
            title: "Alidya",
            description:
                "Es un tratamiento innovador anticelulítico compuesto por aminoácidos y antioxidantes. Actúa a tres niveles diferentes: linfático, celular y vascular. Sus beneficios incluyen disolver la adiposidad localizada, eliminar líquidos y toxinas, y aportar micronutrientes para lograr una piel más suave y firme.",
            media: [
                { type: "image", src: "/servicios/serv4-img1.jpg" },
                { type: "image", src: "/servicios/serv4-img2.jpg" }
            ],
            groups: [
                {
                    label: "Beneficios",
                    items: ["✨ disuelve adiposidad localizada", "✨ elimina líquidos y toxinas", "✨ mejora la suavidad y firmeza de la piel"]
                },
                { label: "Acción", items: ["💧 nivel linfático", "💧 nivel celular", "💧 nivel vascular"] }
            ]
        },
        {
            title: "skin booster",
            description:
                "Tratamiento compuesto por ácido hialurónico, utilizado para mejorar la calidad de la piel, hidratar y tratar arrugas estáticas (aquellas marcadas en capas profundas). Los resultados son naturales, duraderos y el tratamiento es bien tolerado.",
            media: [{ type: "image", src: "/servicios/gal-img1.jpg" }, { type: "image", src: "/servicios/gal-img2.jpg" }, { type: "image", src: "/servicios/serv5-img1.jpg" }],
            groups: [
                { label: "Beneficios", items: ["💧 mejora calidad de piel", "💧 hidrata en profundidad", "💧 trata arrugas estáticas"] },
                { label: "Características", items: ["🌿 resultados naturales y duraderos", "🌿 tratamiento bien tolerado"] }
            ]
        },
        {
            title: "Toxina botulínica / Botox",
            description:
                "La toxina botulínica, en nuestro caso marca BOTOX de Allergan, es un tratamiento no invasivo que relaja los músculos faciales para reducir arrugas y líneas de expresión. Se aplica mediante microinyecciones en músculos específicos.",
            media: [
                { type: "image", src: "/servicios/serv6-img1.jpg" },
                { type: "image", src: "/servicios/serv6-img2.jpg" },
                { type: "image", src: "/servicios/serv6-img3.jpg" },
                { type: "image", src: "/servicios/serv6-img4.jpg" }
            ],
            groups: [
                { label: "Beneficios", items: ["✨ suaviza arrugas y líneas de expresión", "✨ relaja músculos faciales", "✨ efecto rejuvenecedor natural"] },
                { label: "Marca utilizada", items: ["💉 Botox – Allergan"] }
            ]
        },
        {
            title: "Exosomas",
            description:
                "Son nanovesículas que contienen factores de crecimiento, PDRN (derivado del ADN del esperma de salmón), vitamina C, sustancias calmantes e hidratantes. La aplicación se realiza en dos etapas: 1️⃣ aplicación intradérmica con dermapen, 2️⃣ mascarilla facial. Beneficios: mejora la firmeza, textura, luminosidad e hidratación de la piel, atenúa arrugas y brinda efecto antioxidante.",
            media: [{ type: "image", src: "/servicios/serv7-img1.jpg" }],
            groups: [
                { label: "Beneficios", items: ["✨ mejora firmeza y textura", "✨ aporta luminosidad", "✨ atenúa arrugas", "✨ hidratación profunda", "✨ efecto antioxidante"] },
                { label: "Etapas del tratamiento", items: ["1️⃣ aplicación intradérmica con dermapen", "2️⃣ mascarilla facial"] }
            ]
        },
        {
            title: "Profhilo",
            description:
                "Compuesto por ácido hialurónico ultrapuro de alto y bajo peso molecular. Mejora integralmente la calidad de la piel mediante hidratación profunda, elasticidad y tono cutáneo. Aplicación sencilla, bien tolerada y sin tiempo de recuperación.",
            media: [
                { type: "video", src: "/servicios/serv8-vid1.mp4", poster: "/servicios/serv2-vid1.jpg" },
                { type: "image", src: "/servicios/serv8-img1.jpg" }
            ],
            groups: [
                { label: "Beneficios", items: ["💧 mejora elasticidad y tono", "💧 hidrata profundamente", "💧 rejuvenece sin alterar rasgos"] },
                { label: "Características", items: ["🌿 ácido hialurónico ultrapuro", "🌿 aplicación sencilla y bien tolerada", "🌿 sin tiempo de recuperación"] }
            ]
        },
        {
            title: "PRP capilar",
            description:
                "Tratamiento que utiliza el plasma rico en plaquetas del propio paciente para estimular el crecimiento capilar, disminuir la caída y fortalecer el cabello. Se extrae sangre, se procesa y se aplica con microinyecciones. Frecuencia mensual. Resultados variables según el paciente, pero la constancia mejora los resultados. El objetivo inicial es detener la caída y fortalecer el cabello.",
            media: [
                { type: "video", src: "/servicios/serv9-vid1.mp4", poster: "/servicios/serv2-vid1.jpg" },
                { type: "image", src: "/servicios/serv9-img1.jpg" },
                { type: "image", src: "/servicios/serv9-img2.jpg" }
            ],
            groups: [
                { label: "Beneficios", items: ["✨ estimula crecimiento capilar", "✨ disminuye caída", "✨ fortalece el cabello"] },
                { label: "Frecuencia", items: ["📅 sesiones mensuales", "📅 resultados progresivos", "📅 constancia es clave"] }
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
                        <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-4 rounded-full" />
                        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed-moveup">
                            Realizamos tratamientos estéticos faciales y corporales no invasivos para realzar tu belleza de la forma más natural posible.
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
                                    className={`h-2.5 w-2.5 rounded-full ${i === page ? "bg-amber-500" : "bg-amber-200 hover:bg-amber-300"}`}
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
                            <Button variant="outline" className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 hover:from-amber-500 hover:to-yellow-600 hover:text-white transition-all duration-300 font-semibold py-3">
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
                            className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-amber-900/40"></div>
                        <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>

                    <div
                        className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                        <div
                            className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 max-w-2xl">
                            <Badge
                                className="mb-3 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 hover:from-amber-200 hover:to-yellow-200 border-0 px-4 py-2 text-sm font-medium shadow-lg transition-colors">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Centro de Medicina Estética
                            </Badge>
                            <h1 className="text-2xl md:text-5xl font-bold text-white mb-3 leading-tight">
                                Belleza y Bienestar{" "}
                                <span
                                    className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
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
                                        className="h-14 px-8 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                                    >
                                        <CalendarCheck className="mr-3 h-6 w-6" />
                                        Reservar Cita
                                    </Button>
                                </Link>
                                <Link href={"#servicios"}>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="h-14 px-8 text-white hover:text-amber-900 border-2 border-white/30 hover:bg-white/90 bg-white/10 backdrop-blur-sm font-semibold transition-all duration-300 hover:scale-105"
                                    >
                                        Ver Servicios
                                        <ChevronRight className="ml-3 h-6 w-6" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* <section id="servicios"
                    className="py-24 relative overflow-hidden">
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8">
                            <ReusableBadge
                                className={"mb-2"}
                            >
                                Nuestros Servicios
                            </ReusableBadge>

                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
                                Nuestros tratamientos
                            </h2>
                            <div
                                className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-4 rounded-full"></div>
                            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed-moveup">
                                Realizamos tratamientos o procedimientos estéticos tanto faciales como corporales no invasivos. Nuestro objetivo es resaltar tu belleza y mejorar ciertos rasgos de la forma más natural posible.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-10 max-w-4xl mx-auto">
                            {[
                                {
                                    title: "Tratamientos Faciales",
                                    image:
                                        "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2070&auto=format&fit=crop",
                                    popular: true,
                                    groups: [
                                        {
                                            label: "Inyectables",
                                            items: [
                                                "💉 Toxina Botulínica (BOTOX – arrugas, bruxismo, hiperhidrosis)",
                                                "💉 Ácido Hialurónico (Juvederm Allergan)",
                                                "💉 Bioestimuladores (Radiesse, Sculptra, Harmonyca, Profhilo…)",
                                            ],
                                        },
                                        {
                                            label: "Hidratación & Luminosidad",
                                            items: [
                                                "✨ Hidratación Profunda / Skinbooster",
                                                "✨ Mesoterapia Francesa NCTF",
                                                "✨ Viscoderm",
                                                "✨ Profhilo / Profhilo Structura",
                                            ],
                                        },
                                        {
                                            label: "Regenerativos",
                                            items: [
                                                "🌱 PRP Facial",
                                                "🌱 Exosomas",
                                                "🌱 Dermapen con Mesoterapia",
                                                "🌱 Mesoterapia Facial",
                                            ],
                                        },
                                    ],
                                },
                            ].map((service, i) => (
                                <Card
                                    key={i}
                                    className="group overflow-hidden py-0 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/80 backdrop-blur-sm pt-0"
                                >
                                    <div className="relative h-72 overflow-hidden">
                                        <img
                                            src={service.image}
                                            alt={service.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        {service.popular && (
                                            <div className="absolute top-4 right-4">
                                                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0 px-4 py-2 font-semibold shadow-lg">
                                                    <Star className="w-4 h-4 mr-1 fill-current" />
                                                    Popular
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <CardHeader className="pb-0">
                                        <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                            {service.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="pb-6 space-y-5 pt-0">
                                        {service.groups.map((g, k) => (
                                            <div
                                                key={k}
                                                className="rounded-2xl ring-1 ring-amber-100/60 bg-amber-50/40 px-4 py-3"
                                            >
                                                <div className="text-sm font-semibold tracking-wide text-amber-700 mb-2">
                                                    {g.label}
                                                </div>
                                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                                    {g.items.map((it, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="text-gray-700 leading-relaxed-moveup font-medium"
                                                        >
                                                            {it}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {[
                                    {
                                        title: "Tratamientos Corporales",
                                        image:
                                            "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=2044&auto=format&fit=crop",
                                        popular: false,
                                        groups: [
                                            { label: "Modelado & Reducción", items: ["🏷️ Fosfatidilcolina (adiposidad localizada)"] },
                                            { label: "Anticelulítico", items: ["🏷️ Alidya"] },
                                            {
                                                label: "Reafirmación & Calidad de piel",
                                                items: ["🏷️ Mesoterapia Corporal (celulitis, flacidez, calidad de piel)"],
                                            },
                                        ],
                                    },
                                    {
                                        title: "Tratamientos Capilares",
                                        image:
                                            "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?q=80&w=2070&auto=format&fit=crop",
                                        popular: false,
                                        groups: [
                                            { label: "Regenerativos", items: ["🌱 PRP Capilar"] },
                                            { label: "Fármacos", items: ["🌱 Mesoterapia Capilar (minoxidil, finasteride, biotina, etc.)"] },
                                        ],
                                    },
                                ].map((service, i) => (
                                    <Card
                                        key={i}
                                        className="group overflow-hidden py-0 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/80 backdrop-blur-sm pt-0"
                                    >
                                        <div className="relative h-72 overflow-hidden">
                                            <img
                                                src={service.image}
                                                alt={service.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        </div>

                                        <CardHeader className="pb-0">
                                            <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                                {service.title}
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="pb-6 space-y-5 pt-0">
                                            {service.groups.map((g, k) => (
                                                <div
                                                    key={k}
                                                    className="rounded-2xl ring-1 ring-amber-100/60 bg-amber-50/40 px-4 py-3"
                                                >
                                                    <div className="text-sm font-semibold tracking-wide text-amber-700 mb-2">
                                                        {g.label}
                                                    </div>
                                                    <ul className="grid grid-cols-1 gap-y-2">
                                                        {g.items.map((it, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="text-gray-700 leading-relaxed-moveup font-medium"
                                                            >
                                                                {it}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="mt-16 text-center">
                            <Link href={"/reservar"}>
                                <Button
                                    variant="outline"
                                    className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 hover:from-amber-500 hover:to-yellow-600 hover:text-white transition-all duration-300 font-semibold py-3"
                                >
                                    Ver todos los servicios
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section> */}

                {ServiciosSection()}

                {/*  <section id="servicios" className="py-24 relative overflow-hidden">
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8">
                            <ReusableBadge className="mb-2">Nuestros Servicios</ReusableBadge>
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
                                Nuestros tratamientos
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-4 rounded-full"></div>
                            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed-moveup">
                                Realizamos tratamientos o procedimientos estéticos tanto faciales como corporales no invasivos. Nuestro objetivo es resaltar tu belleza y mejorar ciertos rasgos de la forma más natural posible.
                            </p>
                        </div>

                        <div className="space-y-14">
                            {[
                                {
                                    title: "Tratamientos Faciales",
                                    popular: true,
                                    media: [
                                        { type: "image", src: "/servicios/serv1-img1.jpg" },
                                        { type: "image", src: "/servicios/serv1-img2.jpg" },
                                        { type: "image", src: "/servicios/serv1-img3.jpg" },
                                        { type: "image", src: "/servicios/serv1-img4.jpg" },
                                        { type: "video", src: "/servicios/serv2-vid1.mp4", poster: "/servicios/serv2-vid1.jpg" },
                                        { type: "video", src: "/servicios/serv2-vid2.mp4", poster: "/servicios/serv2-vid2.jpg" },
                                        { type: "image", src: "/servicios/serv2-img1.jpg" },
                                        { type: "image", src: "/servicios/serv3-img1.jpg" },
                                        { type: "image", src: "/servicios/serv3-img2.jpg" },
                                        { type: "image", src: "/servicios/serv3-img3.jpg" },
                                        { type: "image", src: "/servicios/serv3-img4.jpg" },
                                        { type: "image", src: "/servicios/serv3-img6.jpg" },
                                    ],
                                    groups: [
                                        {
                                            label: "Inyectables",
                                            items: [
                                                "💉 Toxina Botulínica (BOTOX – arrugas, bruxismo, hiperhidrosis)",
                                                "💉 Ácido Hialurónico (Juvederm Allergan)",
                                                "💉 Bioestimuladores (Radiesse, Sculptra, Harmonyca, Profhilo…)",
                                            ],
                                        },
                                        {
                                            label: "Hidratación & Luminosidad",
                                            items: ["✨ Hidratación Profunda / Skinbooster", "✨ Mesoterapia Francesa NCTF", "✨ Viscoderm", "✨ Profhilo / Profhilo Structura"],
                                        },
                                        {
                                            label: "Regenerativos",
                                            items: ["🌱 PRP Facial", "🌱 Exosomas", "🌱 Dermapen con Mesoterapia", "🌱 Mesoterapia Facial"],
                                        },
                                    ],
                                },
                                {
                                    title: "Tratamientos Corporales",
                                    popular: false,
                                    media: [
                                        { type: "video", src: "/servicios/serv2-vid1.mp4", poster: "/servicios/serv2-vid1.jpg" },
                                        { type: "video", src: "/servicios/serv2-vid2.mp4", poster: "/servicios/serv2-vid2.jpg" },
                                        { type: "image", src: "/servicios/serv2-img1.jpg" },
                                    ],
                                    groups: [
                                        { label: "Modelado & Reducción", items: ["🏷️ Fosfatidilcolina (adiposidad localizada)"] },
                                        { label: "Anticelulítico", items: ["🏷️ Alidya"] },
                                        { label: "Reafirmación & Calidad de piel", items: ["🏷️ Mesoterapia Corporal (celulitis, flacidez, calidad de piel)"] },
                                    ],
                                },
                                {
                                    title: "Tratamientos Capilares",
                                    popular: false,
                                    media: [
                                        { type: "image", src: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?q=80&w=2070&auto=format&fit=crop" },
                                        { type: "video", src: "/videos/capilares-1.mp4", poster: "/videos/capilares-1.jpg" },
                                    ],
                                    groups: [
                                        { label: "Regenerativos", items: ["🌱 PRP Capilar"] },
                                        { label: "Fármacos", items: ["🌱 Mesoterapia Capilar (minoxidil, finasteride, biotina, etc.)"] },
                                    ],
                                },
                            ].map((service, i) => {
                                return (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                                        <Card className="order-1 md:order-none border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-2xl font-bold text-gray-900">{service.title}</h3>
                                                    {service.popular && (
                                                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0 px-3 py-1 font-semibold">
                                                            Popular
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="space-y-5">
                                                    {service.groups.map((g, k) => (
                                                        <div key={k} className="rounded-2xl ring-1 ring-amber-100/60 bg-amber-50/40 px-4 py-3">
                                                            <div className="text-sm font-semibold tracking-wide text-amber-700 mb-2">{g.label}</div>
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
                                                <div className="mt-6">
                                                    <Link href={"/reservar"}>
                                                        <Button variant="outline" className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 hover:from-amber-500 hover:to-yellow-600 hover:text-white transition-all duration-300 font-semibold w-full">
                                                            Reservar turno
                                                        </Button>
                                                    </Link>
                                                </div> 
                                            </div>
                                        </Card>

                                        <div className="flex items-center justify-center">
                                            <div className="relative w-full max-w-[560px] md:max-w-[680px] aspect-square rounded-2xl overflow-hidden">
                                              
                                                <MediaSlider items={service.media} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-16 text-center">
                            <Link href={"/reservar"}>
                                <Button variant="outline" className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 hover:from-amber-500 hover:to-yellow-600 hover:text-white transition-all duration-300 font-semibold py-3">
                                    Ver todos los servicios
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section> */}


                {/* <Servicios /> */}

                <section
                    id="diferenciales"
                    className="py-24 bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 relative overflow-hidden"
                >
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]"></div>
                    <div className="relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <ReusableBadge
                        >
                            ¿Por qué elegirnos?
                        </ReusableBadge>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
                            Tu bienestar, nuestra prioridad
                        </h2>
                        <div
                            className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-8 rounded-full"></div>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed-moveup mb-16">
                            No solo ofrecemos tratamientos, sino una experiencia completa de cuidado y confianza
                            respaldada por años
                            de excelencia.
                        </p>

                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {[
                                    {
                                        icon: ShieldCheck,
                                        title: "Seguridad",
                                        desc: "Protocolos médicos y equipos certificados",
                                        image:
                                            "/servicios/seguridad.jpg", // médico con guantes y mascarilla
                                    },
                                    {
                                        icon: HeartHandshake,
                                        title: "Acompañamiento",
                                        desc: "Plan personalizado y seguimiento post tratamiento",
                                        image:
                                            "/servicios/acompañamiento.jpg", // doctora acompañando paciente
                                    },
                                    {
                                        icon: Leaf,
                                        title: "Resultados Naturales",
                                        desc: "Enfoque estético que respeta tu esencia",
                                        image:
                                            "/servicios/resultados.jpg", // mujer en la naturaleza, luz suave
                                    },
                                ]
                                    .map((item, i) => (
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
                                                <div
                                                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                                                <div
                                                    className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-yellow-900/20 group-hover:from-amber-800/30 group-hover:to-yellow-800/30 transition-all duration-500"></div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                                <div className="flex items-center mb-4">
                                                    <div
                                                        className="bg-gradient-to-r from-amber-500 to-yellow-600 p-3 rounded-2xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                        <item.icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <h3 className="font-bold text-2xl group-hover:text-amber-300 transition-colors duration-300">
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

                {/* <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?q=80&w=2069&auto=format&fit=crop"
                            alt="Promoción especial"
                            className="w-full h-full object-cover scale-105"
                        />
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-amber-900/80 via-yellow-900/70 to-amber-800/80"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div
                            className="backdrop-blur-sm bg-white/10 rounded-3xl p-12 border border-white/20 max-w-4xl mx-auto">
                            <Badge
                                className="mb-6 bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/30 px-6 py-3 text-base font-medium backdrop-blur-sm">
                                <Sparkles className="w-5 h-5 mr-2"/>
                                Oferta Limitada
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Promoción
                                Especial</h2>
                            <div
                                className="w-24 h-1 bg-gradient-to-r from-white to-amber-200 mx-auto mb-8 rounded-full"></div>
                            <p className="text-xl md:text-2xl text-amber-100 mb-10 max-w-3xl mx-auto leading-relaxed-moveup font-light">
                                20% de descuento en tu primer tratamiento facial al reservar este mes. No pierdas esta
                                oportunidad
                                única.
                            </p>
                            <Button
                                size="lg"
                                className="h-14 px-10 bg-white text-amber-900 hover:bg-amber-50 font-bold shadow-xl transition-all duration-300 hover:scale-105"
                                onClick={() => handleNavigation("/reservar")}
                            >
                                <CalendarCheck className="mr-3 h-6 w-6"/>
                                Reservar Ahora
                            </Button>
                        </div>
                    </div>
                </section> */}

                {/* Banner de promoción */}
                {/* <section className="relative py-16">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?q=80&w=2069&auto=format&fit=crop"
                            alt="Promoción especial"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-yellow-900/70"></div>
                    </div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Promoción Especial</h2>
                        <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
                            20% de descuento en tu primer tratamiento facial al reservar este mes
                        </p>
                        <Button size="lg" variant="secondary" onClick={() => handleNavigation("/reservar")}>
                            Reservar Ahora
                        </Button>
                    </div>
                </section> */}

                {/* Sobre Nosotros */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <div>
                                    <ReusableBadge>Nuestra Historia</ReusableBadge>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                        Más de 7 años de experiencia en medicina estética
                                    </h2>
                                    <p className="text-lg text-gray-700 mb-6">
                                        Somos Gastón Adonis Franco y Melanye Guirland, dos médicos con más de 10 años de experiencia en el campo de la medicina. Nuestra historia comenzó en el Sanatorio Güemes, donde nos conocimos durante nuestra formación en Clínica Médica. Fue allí donde descubrimos nuestra pasión por la estética y decidimos especializarnos en este campo.
                                    </p>
                                    <p className="text-lg text-gray-700 mb-8">
                                        En 2018, comenzamos a explorar el mundo de la medicina estética y realizamos nuestros primeros posgrados en SAENI (Asociación Médica Argentina) y SAEME (Universidad de Buenos Aires). Desde entonces, este mundo nos ha apasionado y hemos seguido actualizándonos constantemente para ofrecer los mejores tratamientos y resultados a nuestros pacientes.
                                    </p>
                                    <p className="text-lg text-gray-700 mb-8">
                                        En 2022, después de años de formación y dedicación, decidimos abrir nuestro primer consultorio gracias a la ayuda de nuestra familia y amigos. Desde entonces, hemos podido crecer y desarrollarnos como profesionales, y estamos comprometidos con brindar la mejor atención posible a nuestros pacientes.
                                    </p>
                                </div>

                                {/* <div className="grid grid-cols-2 gap-6">
                                    {[
                                        { number: "5,000+", label: "Pacientes Satisfechos" },
                                        { number: "15+", label: "Profesionales" },
                                        { number: "30+", label: "Tratamientos" },
                                        { number: "3", label: "Premios de Excelencia" },
                                    ].map((stat, i) => (
                                        <div
                                            key={i}
                                            className="text-center p-4 bg-gray-50 rounded-lg shadow-sm"
                                        >
                                            <p className="text-3xl font-bold text-yellow-600">{stat.number}</p>
                                            <p className="text-gray-600">{stat.label}</p>
                                        </div>
                                    ))}
                                </div> */}

                                <Link href={"#equipo"}>
                                    <Button
                                        variant="outline"
                                        className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 hover:from-amber-500 hover:to-yellow-600 hover:text-white transition-all duration-300 font-semibold py-3"
                                    >
                                        Conocé a Nuestro Equipo
                                        <ChevronDown className="h-6 w-6" />
                                    </Button>
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                                    <img
                                        src="/servicios/local.jpg"
                                        alt="Nuestro centro"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div
                                    className="absolute -bottom-16 sm:-bottom-6 -left-3 sm:-left-6 w-64 h-64 rounded-2xl overflow-hidden border-8 border-white shadow-xl">
                                    <img src="/servicios/local2.jpg" alt="Tratamiento"
                                        className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Galería de imágenes */}
{/*                 <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <ReusableBadge>
                                Galería
                            </ReusableBadge>
                            <h2 className="text-3xl font-bold text-gray-900">Práctica clínica y resultados</h2>
                            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                                Un recorrido visual por nuestras instalaciones, el trabajo del equipo de salud y casos reales que reflejan nuestro enfoque.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                "/servicios/gal-img10.jpg",
                                "/servicios/gal-img3.jpg",
                                "/servicios/gal-img6.jpg",
                                "/servicios/gal-img7.jpg",
                                "/servicios/gal-img9.jpg",
                                "/servicios/gal-img2.jpg",
                            ].map((img, i) => (
                                <div
                                    key={i}
                                    className={`overflow-hidden rounded-lg shadow-md ${i === 0 || i === 3 ? "col-span-2 row-span-2" : ""}`}
                                >
                                    <img
                                        src={img || "/placeholder.svg"}
                                        alt={`Instalación ${i + 1}`}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                        style={{ height: i === 0 || i === 3 ? "400px" : "200px" }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section> */}

                {/* Testimonios */}
                <section
                    className="py-24 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <ReusableBadge>
                                Testimonios
                            </ReusableBadge>
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
                                Lo que dicen nuestros pacientes
                            </h2>
                            <div
                                className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-4 rounded-full"></div>
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
                <section
                    id="equipo"
                    className="py-24 relative overflow-hidden"
                >
                    {/*<div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(251,191,36,0.08),transparent_60%)]"></div>*/}
                    <div className="relative mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <ReusableBadge>
                                Nuestro Equipo
                            </ReusableBadge>
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4 leading-tight">
                                Profesionales Cualificados
                            </h2>
                            <div
                                className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-4 rounded-full"></div>
                            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed-moveup">
                                Contamos con un equipo de especialistas con amplia experiencia en medicina estética,
                                comprometidos con
                                tu bienestar y belleza.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                            {[
                                {
                                    name: "Dra. Melanye Guirland",
                                    position: "(cambiar) Directora Médica",
                                    image: "/foto-1.jpg",
                                    specialty: "(cambiar) Medicina Estética",
                                    experience: "(cambiar) 8 años",
                                },
                                {
                                    name: "Dr. Franco Gaston Adonis",
                                    position: "(cambiar) Dermatólogo",
                                    image: "/foto-1.jpg",
                                    specialty: "(cambiar) Dermatología Estética",
                                    experience: "(cambiar) 12 años",
                                },
                            ].map((member, i) => (
                                <Card
                                    key={i}
                                    className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/90 backdrop-blur-sm pt-0"
                                >
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-yellow-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative">
                                        <div className="h-96 overflow-hidden relative">
                                            <img
                                                src={member.image || "/placeholder.svg"}
                                                alt={member.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div
                                                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div
                                                className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div
                                                                className="bg-gradient-to-r from-amber-500 to-yellow-600 p-2 rounded-full">
                                                                <Award className="h-4 w-4 text-white" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">Especialista Certificado</span>
                                                        </div>
                                                        {/*  <Badge
                                                            className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 px-3 py-1 text-xs">
                                                            Activo
                                                        </Badge> */}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <CardHeader className=" pt-4">
                                            <CardTitle
                                                className="text-2xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                                {member.name}
                                            </CardTitle>
                                            {/*  {member.position && (
                                                <CardDescription className="text-amber-600 font-medium text-lg">
                                                    {member.position}
                                                </CardDescription>
                                            )} */}

                                        </CardHeader>
                                        {/* <CardContent className="">
                                            <div className="space-y-4">
                                                <div className="flex items-center group/item">
                                                    <div
                                                        className="bg-gradient-to-r from-amber-100 to-yellow-100 p-2 rounded-xl mr-4 group-hover/item:from-amber-200 group-hover/item:to-yellow-200 transition-all duration-300">
                                                        <Sparkles className="h-4 w-4 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <span
                                                            className="text-sm text-gray-500 font-medium">Especialidad</span>
                                                        <p className="text-gray-800 font-semibold">{member.specialty}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center group/item">
                                                    <div
                                                        className="bg-gradient-to-r from-amber-100 to-yellow-100 p-2 rounded-xl mr-4 group-hover/item:from-amber-200 group-hover/item:to-yellow-200 transition-all duration-300">
                                                        <Clock className="h-4 w-4 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <span
                                                            className="text-sm text-gray-500 font-medium">Experiencia</span>
                                                        <p className="text-gray-800 font-semibold">{member.experience}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent> */}
                                        {/*<CardFooter>
                                            <Button
                                                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg border-0 transition-all duration-300 hover:scale-105 py-3"
                                                onClick={() => handleNavigation("/reservar")}
                                            >
                                                <CalendarCheck className="mr-2 h-5 w-5"/>
                                                Reservar Cita
                                            </Button>
                                        </CardFooter>*/}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contacto */}
                <Contacto />
            </div>
        </>
    )
}

