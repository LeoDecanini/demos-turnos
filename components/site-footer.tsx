import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react"

export function SiteFooter() {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Logo y descripción */}
                    <div>
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">CE</span>
                            </div>
                            <span className="ml-2 text-xl font-semibold">BeautyCenter</span>
                        </div>
                        <p className="mt-4 text-gray-400">
                            Centro de medicina estética especializado en tratamientos faciales, corporales y medicina estética
                            avanzada.
                        </p>
                        <div className="mt-6 flex space-x-4">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <Instagram className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <Facebook className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <Twitter className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Enlaces rápidos */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Enlaces Rápidos</h3>
                        <ul className="space-y-2">
                            {[
                                { name: "Inicio", href: "/" },
                                { name: "Servicios", href: "/#servicios" },
                                { name: "Sobre Nosotros", href: "/#equipo" },
                                { name: "Testimonios", href: "/#testimonios" },
                                { name: "Contacto", href: "/#contacto" },
                                { name: "Reservar Cita", href: "/reservar" },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Servicios */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Nuestros Servicios</h3>
                        <ul className="space-y-2">
                            {[
                                "Tratamientos Faciales",
                                "Tratamientos Corporales",
                                "Medicina Estética",
                                "Botox",
                                "Ácido Hialurónico",
                                "Criolipólisis",
                                "Radiofrecuencia",
                            ].map((service) => (
                                <li key={service}>
                                    <Link href="/reservar" className="text-gray-400 hover:text-white transition-colors">
                                        {service}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Contacto</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <MapPin className="h-5 w-5 text-pink-500 mr-3 mt-0.5" />
                                <span className="text-gray-400">
                  Av. Principal 123, Ciudad
                  <br />
                  Código Postal 12345
                </span>
                            </li>
                            <li className="flex items-center">
                                <Phone className="h-5 w-5 text-pink-500 mr-3" />
                                <span className="text-gray-400">+54 11 1234-5678</span>
                            </li>
                            <li className="flex items-center">
                                <Mail className="h-5 w-5 text-pink-500 mr-3" />
                                <span className="text-gray-400">info@centrodeestetica.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} BeautyCenter. Todos los derechos reservados.
                    </p>
                    <div className="mt-4 md:mt-0 flex space-x-6">
                        <Link href="#" className="text-gray-400 hover:text-white text-sm">
                            Política de Privacidad
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-white text-sm">
                            Términos y Condiciones
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
