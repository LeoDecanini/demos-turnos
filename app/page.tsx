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

                <section id="servicios"
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
                            {/* Card grande (Faciales) */}
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

                            {/* Grid con los 2 cards chicos */}
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
                </section>

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
                                            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1974&auto=format&fit=crop", // médico con guantes y mascarilla
                                    },
                                    {
                                        icon: HeartHandshake,
                                        title: "Acompañamiento",
                                        desc: "Plan personalizado y seguimiento post tratamiento",
                                        image:
                                            "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=1974&auto=format&fit=crop", // doctora acompañando paciente
                                    },
                                    {
                                        icon: Leaf,
                                        title: "Resultados Naturales",
                                        desc: "Enfoque estético que respeta tu esencia",
                                        image:
                                            "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop", // mujer en la naturaleza, luz suave
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

                {/*<section className="relative py-20 overflow-hidden">
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
                </section>*/}

                {/* Banner de promoción */}
                {/*<section className="relative py-16">
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
                </section>*/}

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
                                        src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=2070&auto=format&fit=crop"
                                        alt="Nuestro centro"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div
                                    className="absolute -bottom-16 sm:-bottom-6 -left-3 sm:-left-6 w-64 h-64 rounded-2xl overflow-hidden border-8 border-white shadow-xl">
                                    <img src="/instalanciones-1.jpg" alt="Tratamiento"
                                        className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Galería de imágenes */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <ReusableBadge>
                                Galería
                            </ReusableBadge>
                            <h2 className="text-3xl font-bold text-gray-900">Nuestras Instalaciones</h2>
                            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                                Conoce nuestro centro y los espacios donde realizamos los tratamientos
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                "/instalanciones-1.jpg",
                                "/instalanciones-2.jpg",
                                "/instalanciones-3.jpg",
                                "/instalanciones-6.avif",
                                "/instalanciones-4.jpg",
                                "/instalanciones-5.png",
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
                </section>

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
                                    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
                                    specialty: "(cambiar) Medicina Estética",
                                    experience: "(cambiar) 8 años",
                                },
                                {
                                    name: "Dr. Franco Gaston Adonis",
                                    position: "(cambiar) Dermatólogo",
                                    image:
                                        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop",
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
                                                        {/*<Badge
                                                            className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 px-3 py-1 text-xs">
                                                            Activo
                                                        </Badge>*/}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <CardHeader className="pb-4 pt-4">
                                            <CardTitle
                                                className="text-2xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                                {member.name}
                                            </CardTitle>
                                            {member.position && (
                                                <CardDescription className="text-amber-600 font-medium text-lg">
                                                    {member.position}
                                                </CardDescription>
                                            )}


                                        </CardHeader>
                                        <CardContent className="">
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
                                        </CardContent>
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
