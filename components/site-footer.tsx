import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Instagram, Mail, Phone, MapPin, Clock } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Grid responsiva:
            - sm: 1 col
            - md: 2 cols (Logo / Nav) + Contacto abajo ocupando 2
            - lg: 4 cols (Logo 1, Nav 1, Contacto 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Col 1 - Logo y descripción */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-[url(/logo.jpg)] bg-center bg-contain bg-no-repeat" />
              <div className="ml-3">
                <span className="text-2xl font-bold text-white">MG Estética 22</span>
                <p className="text-yellow-400 text-sm font-medium">Centro de Medicina Estética</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Especialistas en medicina estética avanzada con más de 10 años de experiencia.
              Tratamientos seguros y resultados naturales.
            </p>

            <Link href="https://www.instagram.com/mgestetica22" target="_blank">
              <Button
                variant="outline"
                className="w-full md:w-auto bg-black border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Seguinos en Instagram
              </Button>
            </Link>
          </div>

          {/* Col 2 - Navegación */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold text-white mb-6 relative">
              Navegación
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500" />
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Inicio", href: "/" },
                { name: "Nuestros Servicios", href: "/#servicios" },
                { name: "Sobre Nosotros", href: "/#equipo" },
                { name: "Testimonios", href: "/#testimonios" },
                { name: "Contacto", href: "/#contacto" },
                { name: "Reservar Cita", href: "/reservar" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-yellow-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3/4 - Contacto (doble ancho). 
             En md ocupa 2 cols (fila aparte). En lg también 2 cols. */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-6 relative">
              Contacto
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500" />
            </h3>

            {/* Internamente, 1 col en mobile, 2 cols desde sm */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">Email</p>
                  <p className="text-gray-300 text-sm break-all">mgestetica22@outlook.con</p>
                </div>
              </li>

              <li className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">Teléfono</p>
                  <p className="text-gray-300 text-sm">+54 11 2401-3754</p>
                </div>
              </li>

              <li className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">Ubicación</p>
                  <p className="text-gray-300 text-sm">
                    Paraná 1315, PB 4, Recoleta
                  </p>
                </div>
              </li>

              <li className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">Horarios</p>
                  <p className="text-gray-300 text-sm">{`lunes a Viernes: 9:00 - 20:00\nSábados: 9:00 - 14:00`}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer inferior */}
        <div className="mt-16 pt-8 border-t border-gray-800/50">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="text-center lg:text-left">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} MG Estética 22. Todos los derechos reservados.
              </p>
              <Link
                href="https://moveup.digital/turnos"
                target="_blank"
                className="flex items-center justify-center lg:justify-start mt-2"
              >
                <span className="font-semibold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  Sistema de Turnos por
                  <img src="/moveup.png" alt="MoveUp Digital Logo" className="inline h-4.5 ml-1" />
                </span>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-end gap-x-6 gap-y-2">
              <Link href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">
                Política de Privacidad
              </Link>
              <Link href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
