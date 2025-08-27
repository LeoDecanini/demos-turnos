"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck,
  Star,
  Users,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  ChevronRight,
  ShieldCheck,
  HeartHandshake,
  Leaf,
} from "lucide-react"

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
      <div className="min-h-screen">
        {/* Hero Section con imagen grande a todo lo ancho */}
        <section className="relative h-[80vh] min-h-[600px] w-full">
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/instalanciones-1.jpg"
              alt="Centro de estética"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
          </div>

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <Badge className="mb-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 w-fit">
              Centro de Medicina Estética
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-2xl">
              Belleza y Bienestar <span className="text-yellow-300">Profesional</span>
            </h1>
            <p className="text-xl text-gray-100 max-w-2xl mb-8">
              Descubre nuestros tratamientos personalizados para realzar tu belleza natural con los mejores
              profesionales y tecnología de vanguardia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-8 bg-yellow-600 hover:bg-yellow-700" onClick={() => handleNavigation("/reservar")}>
                Reservar Cita <CalendarCheck className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-8 text-black hover:text-white border-white hover:bg-white/20"
                onClick={() => handleSectionScroll("servicios")}
              >
                Ver Servicios <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Servicios Destacados */}
        {/*  <section id="servicios" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Nuestros Servicios</Badge>
                <h2 className="text-3xl font-bold text-gray-900">Tratamientos Exclusivos</h2>
                <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                  Ofrecemos una amplia gama de tratamientos estéticos y médicos para realzar tu belleza natural.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: "Tratamientos Faciales",
                    description: "Rejuvenecimiento, hidratación y limpieza profunda para tu rostro",
                    image:
                        "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2070&auto=format&fit=crop",
                    popular: true,
                    treatments: ["Limpieza Facial Profunda", "Peeling Químico", "Hidrafacial"],
                  },
                  {
                    title: "Tratamientos Corporales",
                    description: "Moldea tu figura y mejora la apariencia de tu piel",
                    image:
                        "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=2044&auto=format&fit=crop",
                    popular: false,
                    treatments: ["Criolipólisis", "Radiofrecuencia", "Cavitación"],
                  },
                  {
                    title: "Medicina Estética",
                    description: "Procedimientos médicos para rejuvenecer y embellecer",
                    image:
                        "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?q=80&w=2070&auto=format&fit=crop",
                    popular: false,
                    treatments: ["Botox", "Ácido Hialurónico", "Hilos Tensores"],
                  },
                ].map((service, i) => (
                    <Card key={i} className="pt-0 overflow-hidden border-0 shadow-lg">
                      <div className="h-64 overflow-hidden">
                        <img
                            src={service.image || "/placeholder.svg"}
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>{service.title}</CardTitle>
                          {service.popular && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Popular</Badge>
                          )}
                        </div>
                        <CardDescription>{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {service.treatments.map((treatment, j) => (
                              <li key={j} className="flex items-center">
                                <div className="mr-2 h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                                {treatment}
                              </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleNavigation("/reservar")}>
                          Ver Detalles
                        </Button>
                      </CardFooter>
                    </Card>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700" onClick={() => handleNavigation("/reservar")}>
                  Ver Todos los Servicios <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </section> */}

        <section id="diferenciales" className="py-20 bg-gradient-to-b from-white to-yellow-50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge className="mb-4 bg-yellow-100 text-yellow-800">¿Por qué elegirnos?</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Tu bienestar, nuestra prioridad</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              No solo ofrecemos tratamientos, sino una experiencia completa de cuidado y confianza.
            </p>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Seguridad",
                    desc: "Protocolos médicos y equipos certificados",
                    image:
                      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=1974&auto=format&fit=crop",
                  },
                  {
                    icon: HeartHandshake,
                    title: "Acompañamiento",
                    desc: "Plan personalizado y seguimiento post tratamiento",
                    image:
                      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2069&auto=format&fit=crop",
                  },
                  {
                    icon: Leaf,
                    title: "Resultados Naturales",
                    desc: "Enfoque estético que respeta tu esencia",
                    image:
                      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=2069&auto=format&fit=crop",
                  },
                ].map((item, i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg group">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center mb-3">
                        <div className="bg-yellow-500 p-2 rounded-full mr-3">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-xl">{item.title}</h3>
                      </div>
                      <p className="text-gray-100">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Banner de promoción */}
        <section className="relative py-16">
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
        </section>

        {/* Sobre Nosotros */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Nuestra Historia</Badge>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Más de 10 años de experiencia en medicina estética
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  Fundado en 2013, nuestro centro de medicina estética ha sido pionero en introducir las técnicas más
                  avanzadas y seguras para realzar la belleza natural de nuestros pacientes.
                </p>
                <p className="text-lg text-gray-700 mb-8">
                  Contamos con un equipo de profesionales altamente cualificados y en constante formación, que trabajan
                  con la tecnología más innovadora para ofrecer resultados excepcionales.
                </p>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {[
                    { number: "5,000+", label: "Pacientes Satisfechos" },
                    { number: "15+", label: "Profesionales" },
                    { number: "30+", label: "Tratamientos" },
                    { number: "3", label: "Premios de Excelencia" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 bg-gray-50 rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-yellow-600">{stat.number}</p>
                      <p className="text-gray-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={() => handleSectionScroll("equipo")}>
                  Conoce a Nuestro Equipo
                </Button>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=2070&auto=format&fit=crop"
                    alt="Nuestro centro"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-16 sm:-bottom-6 -left-3 sm:-left-6 w-64 h-64 rounded-2xl overflow-hidden border-8 border-white shadow-xl">
                  <img
                    src="/instalanciones-1.jpg"
                    alt="Tratamiento"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Galería de imágenes */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Galería</Badge>
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
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Testimonios</Badge>
              <h2 className="text-3xl font-bold text-gray-900">Lo que dicen nuestros pacientes</h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                La satisfacción de nuestros pacientes es nuestra mejor carta de presentación.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Laura Martínez",
                  image:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop",
                  treatment: "Tratamiento Facial",
                  quote:
                    "Increíble experiencia. Los resultados superaron mis expectativas y el trato fue excelente. Recomiendo totalmente el tratamiento de hidrafacial.",
                },
                {
                  name: "Carlos Rodríguez",
                  image:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
                  treatment: "Botox",
                  quote:
                    "Muy profesionales y atentos. Me explicaron todo el procedimiento y me sentí muy seguro. Los resultados son naturales, justo lo que buscaba.",
                },
                {
                  name: "María González",
                  image:
                    "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
                  treatment: "Criolipólisis",
                  quote:
                    "Después de dos sesiones, los resultados son visibles. El personal es muy amable y las instalaciones son modernas y limpias. Volveré sin duda.",
                },
              ].map((testimonial, i) => (
                <Card key={i} className="bg-gray-50 border-0 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full overflow-hidden">
                        <img
                          src={testimonial.image || "/placeholder.svg"}
                          alt={testimonial.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.treatment}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic">&quot;{testimonial.quote}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Equipo */}
        {/* <section id="equipo" className="py-20 bg-gradient-to-r from-yellow-50 to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Nuestro Equipo</Badge>
                <h2 className="text-3xl font-bold text-gray-900">Profesionales Cualificados</h2>
                <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                  Contamos con un equipo de especialistas con amplia experiencia en medicina estética.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    name: "Dra. María González",
                    position: "Directora Médica",
                    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
                    specialty: "Medicina Estética",
                    experience: "8 años",
                  },
                  {
                    name: "Dr. Carlos Mendez",
                    position: "Dermatólogo",
                    image:
                        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop",
                    specialty: "Dermatología Estética",
                    experience: "12 años",
                  },
                  {
                    name: "Lic. Ana Rodríguez",
                    position: "Cosmetóloga",
                    image:
                        "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?q=80&w=1976&auto=format&fit=crop",
                    specialty: "Cosmetología",
                    experience: "5 años",
                  },
                  {
                    name: "Lic. Sofia López",
                    position: "Especialista Corporal",
                    image:
                        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1974&auto=format&fit=crop",
                    specialty: "Tratamientos Corporales",
                    experience: "6 años",
                  },
                ].map((member, i) => (
                    <Card key={i} className="pt-0 overflow-hidden border-0 shadow-lg">
                      <div className="h-80 overflow-hidden">
                        <img
                            src={member.image || "/placeholder.svg"}
                            alt={member.name}
                            className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle>{member.name}</CardTitle>
                        <CardDescription>{member.position}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <div className="mr-2 h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                            <span className="text-gray-700">Especialidad: {member.specialty}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="mr-2 h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                            <span className="text-gray-700">Experiencia: {member.experience}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleNavigation("/reservar")}>
                          Reservar Cita
                        </Button>
                      </CardFooter>
                    </Card>
                ))}
              </div>
            </div>
          </section> */}

        {/* Contacto */}
        <section id="contacto" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <Badge className="mb-4 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Contacto</Badge>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Tienes alguna pregunta?</h2>
                <p className="text-lg text-gray-700 mb-8">
                  Estamos aquí para ayudarte. Contáctanos para más información sobre nuestros servicios o para programar
                  una consulta.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <MapPin className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Ubicación</h3>
                      <p className="mt-1 text-gray-600">
                        Av. Principal 123, Ciudad
                        <br />
                        Código Postal 12345
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Phone className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Teléfono</h3>
                      <p className="mt-1 text-gray-600">+54 11 1234-5678</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Mail className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Email</h3>
                      <p className="mt-1 text-gray-600">info@centrodeestetica.com</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Horario</h3>
                      <p className="mt-1 text-gray-600">
                        Lunes a Viernes: 9:00 - 20:00
                        <br />
                        Sábados: 9:00 - 14:00
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex space-x-4">
                  <Button variant="outline" size="icon">
                    <Instagram className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Facebook className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Envíanos un mensaje</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Asunto
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    ></textarea>
                  </div>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">Enviar Mensaje</Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
