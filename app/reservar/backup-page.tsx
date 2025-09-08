"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Sparkles, CheckCircle, ArrowLeft, CalendarCheck, Heart } from "lucide-react"
import Link from "next/link"

export default function ReservarPage() {
    const [selectedService, setSelectedService] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [step, setStep] = useState(1)

    const services = [
        {
            id: "facial",
            name: "Tratamientos Faciales",
            description: "Rejuvenecimiento, hidratación y limpieza profunda",
            duration: "60-90 min",
            price: "Desde $8,000",
            popular: true,
            treatments: ["Limpieza Facial Profunda", "Peeling Químico", "Hidrafacial", "Botox", "Ácido Hialurónico"],
        },
        {
            id: "corporal",
            name: "Tratamientos Corporales",
            description: "Moldea tu figura y mejora la apariencia de tu piel",
            duration: "45-120 min",
            price: "Desde $12,000",
            popular: false,
            treatments: ["Criolipólisis", "Radiofrecuencia", "Cavitación", "Drenaje Linfático"],
        },
        {
            id: "medicina",
            name: "Medicina Estética",
            description: "Procedimientos médicos avanzados",
            duration: "30-60 min",
            price: "Desde $15,000",
            popular: false,
            treatments: ["Hilos Tensores", "Plasma Rico en Plaquetas", "Mesoterapia"],
        },
    ]

    const timeSlots = [
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]"></div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <Link
                        href="/"
                        className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium mb-6 transition-colors duration-300"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Volver al inicio
                    </Link>

                    <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full mb-6">
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0 px-6 py-3 text-base font-medium shadow-lg">
                            <CalendarCheck className="w-5 h-5 mr-2" />
                            Reservar Cita
                        </Badge>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8 leading-tight">
                        Reservá tu cita en MG Estética 22
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-8 rounded-full"></div>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Elegí el tratamiento que más te guste y reservá tu cita de forma rápida y sencilla. Nuestro equipo de
                        profesionales te está esperando.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center space-x-4">
                        {[
                            { number: 1, title: "Servicio", icon: Heart },
                            { number: 2, title: "Fecha y Hora", icon: Calendar },
                            { number: 3, title: "Datos", icon: User },
                            { number: 4, title: "Confirmación", icon: CheckCircle },
                        ].map((stepItem, i) => (
                            <div key={i} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                                        step >= stepItem.number
                                            ? "bg-gradient-to-r from-amber-500 to-yellow-600 border-amber-500 text-white shadow-lg"
                                            : "border-gray-300 text-gray-400 bg-white"
                                    }`}
                                >
                                    <stepItem.icon className="h-5 w-5" />
                                </div>
                                <span className={`ml-2 font-medium ${step >= stepItem.number ? "text-amber-600" : "text-gray-400"}`}>
                  {stepItem.title}
                </span>
                                {i < 3 && (
                                    <div
                                        className={`w-8 h-0.5 mx-4 transition-colors duration-300 ${
                                            step > stepItem.number ? "bg-amber-500" : "bg-gray-300"
                                        }`}
                                    ></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Service Selection */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí tu tratamiento</h2>
                            <p className="text-gray-600 text-lg">Seleccioná el servicio que te interesa</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service) => (
                                <Card
                                    key={service.id}
                                    className={`group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 ${
                                        selectedService === service.id
                                            ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-xl"
                                            : "border-gray-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm"
                                    }`}
                                    onClick={() => setSelectedService(service.id)}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                                {service.name}
                                            </CardTitle>
                                            {service.popular && (
                                                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0 px-3 py-1 font-semibold shadow-lg">
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                    Popular
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-gray-600 text-base leading-relaxed">
                                            {service.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center text-gray-600">
                                                <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                                <span className="font-medium">{service.duration}</span>
                                            </div>
                                            <div className="text-amber-600 font-bold text-lg">{service.price}</div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Incluye:</p>
                                            {service.treatments.slice(0, 3).map((treatment, i) => (
                                                <div key={i} className="flex items-center">
                                                    <div className="mr-3 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600"></div>
                                                    <span className="text-gray-700 text-sm font-medium">{treatment}</span>
                                                </div>
                                            ))}
                                            {service.treatments.length > 3 && (
                                                <p className="text-amber-600 text-sm font-medium">+{service.treatments.length - 3} más...</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Button
                                size="lg"
                                disabled={!selectedService}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setStep(2)}
                            >
                                Continuar
                                <Calendar className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Date and Time Selection */}
                {step === 2 && (
                    <div className="space-y-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí fecha y horario</h2>
                            <p className="text-gray-600 text-lg">Seleccioná el día y hora que mejor te convenga</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Calendar */}
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <Calendar className="h-5 w-5 mr-2 text-amber-500" />
                                        Seleccionar Fecha
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6">
                                        <p className="text-center text-gray-600 mb-4">Calendario interactivo próximamente</p>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Time Slots */}
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-amber-500" />
                                        Horarios Disponibles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-3">
                                        {timeSlots.map((time) => (
                                            <Button
                                                key={time}
                                                variant={selectedTime === time ? "default" : "outline"}
                                                className={`h-12 transition-all duration-300 ${
                                                    selectedTime === time
                                                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg border-0"
                                                        : "border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50"
                                                }`}
                                                onClick={() => setSelectedTime(time)}
                                            >
                                                {time}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-center space-x-4 mt-12">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                                onClick={() => setStep(1)}
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Volver
                            </Button>
                            <Button
                                size="lg"
                                disabled={!selectedDate || !selectedTime}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                onClick={() => setStep(3)}
                            >
                                Continuar
                                <User className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Contact Form */}
                {step === 3 && (
                    <div className="space-y-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tus datos de contacto</h2>
                            <p className="text-gray-600 text-lg">Completá la información para confirmar tu reserva</p>
                        </div>

                        <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Información Personal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                            placeholder="Tu apellido"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="tu@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="+54 11 1234-5678"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Comentarios adicionales (opcional)
                                    </label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 resize-none"
                                        placeholder="¿Alguna consulta o requerimiento especial?"
                                    ></textarea>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center space-x-4 mt-12">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                                onClick={() => setStep(2)}
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Volver
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                                onClick={() => setStep(4)}
                            >
                                Confirmar Reserva
                                <CheckCircle className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 4 && (
                    <div className="text-center space-y-8">
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl p-12 border border-green-200">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <CheckCircle className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Reserva Confirmada!</h2>
                                <p className="text-lg text-gray-600 mb-8">
                                    Tu cita ha sido registrada exitosamente. Te contactaremos pronto para confirmar los detalles.
                                </p>

                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                                    <h3 className="font-bold text-gray-900 mb-4">Resumen de tu reserva:</h3>
                                    <div className="space-y-3 text-left">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Servicio:</span>
                                            <span className="font-semibold">{services.find((s) => s.id === selectedService)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha:</span>
                                            <span className="font-semibold">{selectedDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Hora:</span>
                                            <span className="font-semibold">{selectedTime}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-8 border-2 border-amber-300 hover:bg-amber-50 bg-transparent"
                                onClick={() => {
                                    setStep(1)
                                    setSelectedService("")
                                    setSelectedDate("")
                                    setSelectedTime("")
                                }}
                            >
                                Nueva Reserva
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                                asChild
                            >
                                <Link href="/">Volver al Inicio</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
