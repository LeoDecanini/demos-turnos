"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { CheckCircle, Clock, User, CalendarIcon, Phone, Mail } from "lucide-react"

// Datos mock
const servicios = {
    "Tratamientos Faciales": [
        { id: 1, nombre: "Limpieza Facial Profunda", precio: 8500, duracion: 60 },
        { id: 2, nombre: "Peeling Químico", precio: 12000, duracion: 45 },
        { id: 3, nombre: "Hidrafacial", precio: 15000, duracion: 75 },
        { id: 4, nombre: "Microdermoabrasión", precio: 9500, duracion: 50 },
    ],
    "Tratamientos Corporales": [
        { id: 5, nombre: "Criolipólisis", precio: 25000, duracion: 90 },
        { id: 6, nombre: "Radiofrecuencia", precio: 18000, duracion: 60 },
        { id: 7, nombre: "Cavitación", precio: 15000, duracion: 45 },
        { id: 8, nombre: "Drenaje Linfático", precio: 12000, duracion: 60 },
    ],
    "Medicina Estética": [
        { id: 9, nombre: "Botox", precio: 35000, duracion: 30 },
        { id: 10, nombre: "Ácido Hialurónico", precio: 45000, duracion: 45 },
        { id: 11, nombre: "Plasma Rico en Plaquetas", precio: 28000, duracion: 60 },
        { id: 12, nombre: "Hilos Tensores", precio: 55000, duracion: 90 },
    ],
}

const profesionales = [
    { id: 1, nombre: "Dra. María González", especialidad: "Medicina Estética", experiencia: "8 años" },
    { id: 2, nombre: "Lic. Ana Rodríguez", especialidad: "Cosmetología", experiencia: "5 años" },
    { id: 3, nombre: "Dr. Carlos Mendez", especialidad: "Dermatología Estética", experiencia: "12 años" },
    { id: 4, nombre: "Lic. Sofia López", especialidad: "Tratamientos Corporales", experiencia: "6 años" },
]

const horarios = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
]

interface ReservaData {
    servicio?: any
    profesional?: any
    cualquierProfesional?: boolean
    fecha?: Date
    horario?: string
    cliente?: {
        nombre: string
        apellido: string
        email: string
        telefono: string
    }
}

export default function ReservaPage() {
    const [paso, setPaso] = useState(1)
    const [reservaData, setReservaData] = useState<ReservaData>({})

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
    }

    const seleccionarServicio = (servicio: any) => {
        setReservaData({ ...reservaData, servicio })
        setPaso(2)
        setTimeout(scrollToTop, 100)
    }

    const seleccionarProfesional = (profesional: any, cualquiera = false) => {
        setReservaData({
            ...reservaData,
            profesional: cualquiera ? null : profesional,
            cualquierProfesional: cualquiera,
        })
        setPaso(3)
        setTimeout(scrollToTop, 100)
    }

    const seleccionarFechaHora = (fecha: Date, horario: string) => {
        setReservaData({ ...reservaData, fecha, horario })
        setPaso(4)
        setTimeout(scrollToTop, 100)
    }

    const completarReserva = (cliente: any) => {
        setReservaData({ ...reservaData, cliente })
        setPaso(5)
        setTimeout(scrollToTop, 100)
    }

    const irAPaso = (nuevoPaso: number) => {
        setPaso(nuevoPaso)
        setTimeout(scrollToTop, 100)
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reserva tu Cita</h1>
                        <p className="text-gray-600">Centro de Medicina Estética</p>
                    </div>

                    {/* Indicador de pasos - Más responsive */}
                    <div className="flex justify-center mb-8 overflow-x-auto">
                        <div className="flex items-center space-x-2 sm:space-x-4 min-w-max px-4">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <div key={num} className="flex items-center">
                                    <div
                                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                                            paso >= num ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        {num}
                                    </div>
                                    {num < 5 && (
                                        <div
                                            className={`w-4 sm:w-8 h-0.5 transition-colors ${paso > num ? "bg-pink-500" : "bg-gray-200"}`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Paso 1: Selección de Servicio */}
                    {paso === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-center mb-6">Selecciona tu Servicio</h2>
                            {Object.entries(servicios).map(([categoria, serviciosCategoria]) => (
                                <div key={categoria}>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">{categoria}</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {serviciosCategoria.map((servicio) => (
                                            <Card
                                                key={servicio.id}
                                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                                onClick={() => seleccionarServicio(servicio)}
                                            >
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{servicio.nombre}</CardTitle>
                                                    <CardDescription className="flex items-center gap-4">
                                                        <Badge variant="secondary">${servicio.precio.toLocaleString()}</Badge>
                                                        <span className="flex items-center gap-1 text-sm">
                              <Clock className="w-4 h-4" />
                                                            {servicio.duracion} min
                            </span>
                                                    </CardDescription>
                                                </CardHeader>
                                            </Card>
                                        ))}
                                    </div>
                                    <Separator className="my-6" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paso 2: Selección de Profesional */}
                    {paso === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold mb-2">Selecciona tu Profesional</h2>
                                <p className="text-gray-600">Servicio: {reservaData.servicio?.nombre}</p>
                            </div>

                            <div className="space-y-4">
                                <Card
                                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-pink-300"
                                    onClick={() => seleccionarProfesional(null, true)}
                                >
                                    <CardContent className="p-6 text-center">
                                        <User className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                                        <h3 className="font-medium">Cualquier Profesional</h3>
                                        <p className="text-sm text-gray-600">El primer profesional disponible te atenderá</p>
                                    </CardContent>
                                </Card>

                                {profesionales.map((profesional) => (
                                    <Card
                                        key={profesional.id}
                                        className="cursor-pointer hover:shadow-lg transition-shadow"
                                        onClick={() => seleccionarProfesional(profesional)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-pink-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{profesional.nombre}</h3>
                                                    <p className="text-sm text-gray-600">{profesional.especialidad}</p>
                                                    <p className="text-xs text-gray-500">{profesional.experiencia} de experiencia</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Button variant="outline" onClick={() => irAPaso(1)} className="w-full">
                                Volver a Servicios
                            </Button>
                        </div>
                    )}

                    {/* Paso 3: Selección de Fecha y Hora */}
                    {paso === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold mb-2">Selecciona Fecha y Hora</h2>
                                <p className="text-gray-600">
                                    {reservaData.cualquierProfesional ? "Cualquier profesional" : reservaData.profesional?.nombre}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5" />
                                            Selecciona el Día
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Calendar
                                            mode="single"
                                            selected={reservaData.fecha}
                                            onSelect={(fecha) => setReservaData({ ...reservaData, fecha })}
                                            disabled={(date) => date < new Date() || date.getDay() === 0}
                                            className="rounded-md border !max-w-none !w-full"
                                            classNames={{
                                                months:
                                                    "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                                                month: "space-y-4 w-full flex flex-col",
                                                table: "w-full h-full border-collapse space-y-1",
                                                head_row: "",
                                                row: "w-full mt-2",
                                            }}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            Selecciona la Hora
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-2">
                                            {horarios.map((horario) => (
                                                <Button
                                                    key={horario}
                                                    variant={reservaData.horario === horario ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setReservaData({ ...reservaData, horario })}
                                                    disabled={!reservaData.fecha}
                                                >
                                                    {horario}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => irAPaso(2)} className="flex-1">
                                    Volver
                                </Button>
                                <Button
                                    onClick={() => irAPaso(4)}
                                    className="flex-1"
                                    disabled={!reservaData.fecha || !reservaData.horario}
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Paso 4: Datos del Cliente */}
                    {paso === 4 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold mb-2">Tus Datos</h2>
                                <p className="text-gray-600">Completa la información para confirmar tu reserva</p>
                            </div>

                            <Card>
                                <CardContent className="p-6">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            const formData = new FormData(e.currentTarget)
                                            const cliente = {
                                                nombre: formData.get("nombre") as string,
                                                apellido: formData.get("apellido") as string,
                                                email: formData.get("email") as string,
                                                telefono: formData.get("telefono") as string,
                                            }
                                            completarReserva(cliente)
                                        }}
                                    >
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <Label htmlFor="nombre">Nombre *</Label>
                                                <Input id="nombre" name="nombre" required />
                                            </div>
                                            <div>
                                                <Label htmlFor="apellido">Apellido *</Label>
                                                <Input id="apellido" name="apellido" required />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <Label htmlFor="email" className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    Email *
                                                </Label>
                                                <Input id="email" name="email" type="email" required />
                                            </div>
                                            <div>
                                                <Label htmlFor="telefono" className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    Teléfono *
                                                </Label>
                                                <Input id="telefono" name="telefono" type="tel" required />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button type="button" variant="outline" onClick={() => irAPaso(3)} className="flex-1">
                                                Volver
                                            </Button>
                                            <Button type="submit" className="flex-1">
                                                Confirmar Reserva
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Paso 5: Confirmación */}
                    {paso === 5 && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-semibold text-green-800 mb-2">¡Reserva Confirmada!</h2>
                                <p className="text-gray-600">Tu cita ha sido agendada exitosamente</p>
                            </div>

                            <Card className="max-w-md mx-auto">
                                <CardHeader>
                                    <CardTitle>Resumen de tu Cita</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Servicio:</span>
                                        <span className="font-medium">{reservaData.servicio?.nombre}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Precio:</span>
                                        <span className="font-medium">${reservaData.servicio?.precio.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Profesional:</span>
                                        <span className="font-medium">
                      {reservaData.cualquierProfesional ? "Cualquier profesional" : reservaData.profesional?.nombre}
                    </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Fecha:</span>
                                        <span className="font-medium">
                      {reservaData.fecha?.toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                      })}
                    </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Hora:</span>
                                        <span className="font-medium">{reservaData.horario}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cliente:</span>
                                        <span className="font-medium">
                      {reservaData.cliente?.nombre} {reservaData.cliente?.apellido}
                    </span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Button variant="outline" className="flex items-center gap-2 mx-auto w-full max-w-md">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-blue-500"
                                >
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                    <line x1="16" x2="16" y1="2" y2="6" />
                                    <line x1="8" x2="8" y1="2" y2="6" />
                                    <line x1="3" x2="21" y1="10" y2="10" />
                                    <path d="M8 14h.01" />
                                    <path d="M12 14h.01" />
                                    <path d="M16 14h.01" />
                                    <path d="M8 18h.01" />
                                    <path d="M12 18h.01" />
                                    <path d="M16 18h.01" />
                                </svg>
                                Agregar al Calendario
                            </Button>
                            <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                                <p className="text-sm text-blue-800">
                                    <strong>Importante:</strong> Recibirás un email de confirmación en {reservaData.cliente?.email}. Si
                                    necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.
                                </p>
                            </div>

                            <Button
                                onClick={() => {
                                    setPaso(1)
                                    setReservaData({})
                                    setTimeout(scrollToTop, 100)
                                }}
                                className="w-full max-w-md"
                            >
                                Hacer Nueva Reserva
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
