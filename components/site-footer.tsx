import Link from "next/link"
import {Button} from "@/components/ui/button"
import {Instagram, Mail, Phone, MapPin, Clock, Award, Shield} from "lucide-react"

export function SiteFooter() {
    return (
        <footer className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-1">
                        <div className="flex items-center mb-6">
                            <div className="h-12 w-12 rounded-xl bg-[url(/logo.jpg)] bg-center bg-contain bg-no-repeat">
                            </div>
                            <div className="ml-3">
                                <span className="text-2xl font-bold text-white">MG Estética 22</span>
                                <p className="text-yellow-400 text-sm font-medium">Centro de Medicina Estética</p>
                            </div>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed mb-6">
                            Especialistas en medicina estética avanzada con más de 10 años de experiencia. Tratamientos
                            seguros y
                            resultados naturales.
                        </p>

                        {/*<div className="flex items-center space-x-4 mb-6">
                            <div className="flex items-center text-yellow-400">
                                <Award className="h-4 w-4 mr-2" />
                                <span className="text-sm">Certificado</span>
                            </div>
                            <div className="flex items-center text-yellow-400">
                                <Shield className="h-4 w-4 mr-2" />
                                <span className="text-sm">Seguro</span>
                            </div>
                        </div>*/}

                        <Link
                            href={"https://www.instagram.com/mgestetica22"}
                            target={"_blank"}>
                            <Button
                                variant="outline"
                                className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 bg-transparent"
                            >
                                <Instagram className="h-4 w-4 mr-2"/>
                                Seguinos en Instagram
                            </Button>
                        </Link>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-white mb-6 relative">
                            Navegación
                            <div
                                className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                        </h3>
                        <ul className="space-y-3">
                            {[
                                {name: "Inicio", href: "/"},
                                {name: "Nuestros Servicios", href: "/#servicios"},
                                {name: "Sobre Nosotros", href: "/#equipo"},
                                {name: "Testimonios", href: "/#testimonios"},
                                {name: "Contacto", href: "/#contacto"},
                                {name: "Reservar Cita", href: "/reservar"},
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 flex items-center group"
                                    >
                                        <span
                                            className="w-1 h-1 bg-yellow-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-white mb-6 relative">
                            Tratamientos
                            <div
                                className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-yellow-400 font-medium mb-2">Faciales</h4>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                                            Botox
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                                            Ácido Hialurónico
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-yellow-400 font-medium mb-2">Corporales</h4>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                                            Criolipólisis
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                                            Radiofrecuencia
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-white mb-6 relative">
                            Contacto
                            <div
                                className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start group">
                                <div
                                    className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                                    <MapPin className="h-5 w-5 text-yellow-400"/>
                                </div>
                                <div className="ml-3">
                                    <p className="text-white font-medium">Ubicación</p>
                                    <p className="text-gray-300 text-sm">
                                        Av. Principal 123, Ciudad
                                        <br/>
                                        Código Postal 12345
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start group">
                                <div
                                    className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                                    <Phone className="h-5 w-5 text-yellow-400"/>
                                </div>
                                <div className="ml-3">
                                    <p className="text-white font-medium">Teléfono</p>
                                    <p className="text-gray-300 text-sm">+54 11 2401-3754</p>
                                </div>
                            </li>
                            <li className="flex items-start group">
                                <div
                                    className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                                    <Mail className="h-5 w-5 text-yellow-400"/>
                                </div>
                                <div className="ml-3">
                                    <p className="text-white font-medium">Email</p>
                                    <p className="text-gray-300 text-sm">mgestetica22@outlook.con</p>
                                </div>
                            </li>
                            <li className="flex items-start group">
                                <div
                                    className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                                    <Clock className="h-5 w-5 text-yellow-400"/>
                                </div>
                                <div className="ml-3">
                                    <p className="text-white font-medium">Horarios</p>
                                    <p className="text-gray-300 text-sm">Lun - Vie: 9:00 - 19:00</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-800/50">
                    <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
                        <div className="text-center lg:text-left">
                            <p className="text-gray-400 text-sm">
                                © {new Date().getFullYear()} MG Estética 22. Todos los derechos reservados.
                            </p>
                            <Link href={"https://moveup.digital/turnos"} target={"_blank"}
                                  className="flex items-center justify-center lg:justify-start mt-2">
                                {/*<span className="text-gray-400 text-sm mr-2">Sistema de Turnos desarrollado por</span>*/}
                                <span
                                    className="font-semibold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">Sistema de Turnos  por
                                <img src={"/moveup.png"} alt={"MoveUp Digital Logo"} className={"inline h-4.5 ml-1"}/>
                                </span>
                                {/*<div className="flex items-center bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1 rounded-full">
                                    <span className="text-black font-bold text-sm"> Sistema de Turnos desarrollado moveup</span>
                                </div>*/}
                            </Link>
                        </div>

                        <div className="flex flex-wrap justify-center lg:justify-end space-x-6">
                            <Link href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">
                                Política de Privacidad
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">
                                Términos y Condiciones
                            </Link>
                            {/*<Link href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">
                                Aviso Legal
                            </Link>*/}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
