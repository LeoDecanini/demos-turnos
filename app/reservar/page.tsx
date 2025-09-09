"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Calendar,
    Clock,
    User,
    Sparkles,
    CheckCircle,
    ArrowLeft,
    Heart,
    ExternalLink,
    CreditCard,
    Users,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Service = {
    _id: string
    name: string
    description?: string
    durationMin?: number
    priceFrom?: number
    popular?: boolean
}

type Professional = {
    _id: string
    name: string
}

type BookingResponse = {
    success: boolean
    booking: {
        _id: string
        status: string
        paymentStatus: string
        depositRequired: boolean
        depositAmount?: number
        depositCurrency?: string
        depositStatus?: string
        depositInitPoint?: string
        depositSandboxInitPoint?: string
        service: {
            name: string
            price: number
            currency: string
        }
        professional: {
            name: string
        }
        start: string
        end: string
    }
    payment?: {
        required: boolean
        amount: number
        currency: string
        initPoint: string
        sandboxInitPoint: string
    }
    message: string
}

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`
const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID as string

// helper para extraer data real desde data.data
const getPayload = (raw: any) => raw?.data ?? raw

export default function ReservarPage() {
    // -------- Steps --------
    // 1 Servicio -> 2 Profesional -> 3 Fecha/Hora -> 4 Datos -> 5 Confirmación
    const [step, setStep] = useState(1)

    // ---- Paso 1: Servicios ----
    const [services, setServices] = useState<Service[]>([])
    const [loadingServices, setLoadingServices] = useState(false)
    const [selectedService, setSelectedService] = useState<string>("")

    // ---- Paso 2: Profesional (con "Indistinto") ----
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [loadingProfessionals, setLoadingProfessionals] = useState(false)
    const [selectedProfessional, setSelectedProfessional] = useState<string>("any") // "any" = indistinto

    // ---- Paso 3: Días y horarios ----
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [availableDays, setAvailableDays] = useState<string[]>([]) // YYYY-MM-DD[]
    const [loadingDays, setLoadingDays] = useState(false)

    const [timeSlots, setTimeSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [selectedTime, setSelectedTime] = useState<string>("")

    // ---- Paso 4: Datos cliente ----
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [dni, setDni] = useState("")
    const [notes, setNotes] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // ---- Paso 5: Confirmación ----
    const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null)

    // ------- Helpers -------
    const money = (n?: number) =>
        typeof n === "number"
            ? n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
            : ""

    const serviceChosen = useMemo(() => services.find((s) => s._id === selectedService), [services, selectedService])
    const professionalChosen = useMemo(
        () => (selectedProfessional !== "any" ? professionals.find((p) => p._id === selectedProfessional) : undefined),
        [professionals, selectedProfessional],
    )

    const formatDateForAPI = (date: Date) => {
        return format(date, "yyyy-MM-dd")
    }

    const getCurrentMonth = (date: Date) => {
        return format(date, "yyyy-MM")
    }

    // ------- Fetch servicios al cargar -------
    useEffect(() => {
        const load = async () => {
            setLoadingServices(true)
            try {
                const res = await fetch(`${API_BASE}/services?accountId=${ACCOUNT_ID}`, { cache: "no-store" })
                if (!res.ok) throw new Error("No se pudieron cargar los servicios")
                const raw = await res.json()
                const payload = getPayload(raw)
                const list: Service[] = Array.isArray(payload) ? payload : (payload?.items ?? [])
                setServices(list)
                if (list.length === 0) {
                    toast.error("No hay servicios disponibles en este momento")
                }
            } catch (e) {
                console.error(e)
                setServices([])
                toast.error("Error al cargar los servicios")
            } finally {
                setLoadingServices(false)
            }
        }
        load()
    }, [])

    const loadProfessionals = async () => {
        if (!selectedService) return

        setLoadingProfessionals(true)
        try {
            const res = await fetch(`${API_BASE}/services/${selectedService}/professionals?accountId=${ACCOUNT_ID}`, {
                cache: "no-store",
            })
            if (!res.ok) throw new Error("No se pudieron cargar los profesionales")
            const raw = await res.json()
            const payload = getPayload(raw)
            const list: Professional[] = Array.isArray(payload) ? payload : (payload?.items ?? [])
            setProfessionals(list)
            setSelectedProfessional("any") // default indistinto
        } catch (e) {
            console.error(e)
            setProfessionals([])
            setSelectedProfessional("any")
            toast.error("Error al cargar los profesionales")
        } finally {
            setLoadingProfessionals(false)
        }
    }

    const loadAvailableDays = async () => {
        if (!selectedService) return

        const currentDate = new Date()
        const month = getCurrentMonth(currentDate)
        setLoadingDays(true)
        try {
            const params = new URLSearchParams()
            params.set("accountId", ACCOUNT_ID)
            params.set("service", selectedService)
            params.set("month", month)
            if (selectedProfessional && selectedProfessional !== "any") {
                params.set("professional", selectedProfessional)
            }
            const res = await fetch(`${API_BASE}/available-days?${params.toString()}`, { cache: "no-store" })
            if (!res.ok) throw new Error("No se pudieron cargar los días disponibles")
            const raw = await res.json()
            const payload = getPayload(raw)

            let dates: any[] = []
            if (Array.isArray(payload)) {
                dates = payload
            } else if (Array.isArray(payload?.days)) {
                dates = payload.days
            } else if (Array.isArray(payload?.items)) {
                dates = payload.items
            }
            if (dates.length && typeof dates[0] !== "string") {
                dates = dates.map((d: any) => d?.date).filter(Boolean)
            }

            setAvailableDays(dates as string[])
        } catch (e) {
            console.error(e)
            setAvailableDays([])
            toast.error("Error al cargar los días disponibles")
        } finally {
            setLoadingDays(false)
        }
    }

    const loadTimeSlots = async (date: Date) => {
        if (!selectedService) return

        const dateStr = formatDateForAPI(date)
        if (!availableDays.includes(dateStr)) return

        setLoadingSlots(true)
        try {
            const params = new URLSearchParams()
            params.set("accountId", ACCOUNT_ID)
            params.set("service", selectedService)
            params.set("date", dateStr)
            if (selectedProfessional && selectedProfessional !== "any") {
                params.set("professional", selectedProfessional)
            }
            const res = await fetch(`${API_BASE}/day-slots?${params.toString()}`, { cache: "no-store" })
            if (!res.ok) throw new Error("No se pudieron cargar los horarios")
            const raw = await res.json()
            const payload = getPayload(raw)
            const slots: string[] = Array.isArray(payload) ? payload : (payload?.slots ?? payload?.items ?? [])
            setTimeSlots(slots)
            setSelectedTime("")

            if (slots.length === 0) {
                toast.info("No hay horarios disponibles para esta fecha")
            }
        } catch (e) {
            console.error(e)
            setTimeSlots([])
            setSelectedTime("")
            toast.error("Error al cargar los horarios")
        } finally {
            setLoadingSlots(false)
        }
    }

    // ------- Crear reserva (Paso 4 -> Paso 5) -------
    const createBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return
        const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim()
        if (!fullName || !email || !phone || !dni) return

        setSubmitting(true)
        try {
            const dateStr = formatDateForAPI(selectedDate)
            const res = await fetch(`${API_BASE}/create-booking/${ACCOUNT_ID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service: selectedService,
                    professional: selectedProfessional !== "any" ? selectedProfessional : undefined,
                    day: dateStr,
                    hour: selectedTime,
                    client: { name: fullName, email, phone, dni },
                    notes: notes?.trim() || undefined,
                }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                const msg = getPayload(err)?.message || err?.message || "No se pudo crear la reserva"
                throw new Error(msg)
            }

            const bookingResponse: BookingResponse = await res.json()
            setBookingResult(bookingResponse)

            if (bookingResponse.booking.depositRequired) {
                toast.success("¡Reserva creada! Necesitas pagar la seña para confirmar")
            } else {
                toast.success("¡Reserva confirmada exitosamente!")
            }

            setStep(5)
        } catch (e) {
            console.error(e)
            toast.error((e as Error).message)
        } finally {
            setSubmitting(false)
        }
    }

    const isDateAvailable = (date: Date) => {
        const dateStr = formatDateForAPI(date)
        return availableDays.includes(dateStr)
    }

    // -------- UI --------
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]" />
            <div className="mt-12 relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center space-x-4">
                        {[
                            { number: 1, title: "Servicio", icon: Heart },
                            { number: 2, title: "Profesional", icon: User },
                            { number: 3, title: "Fecha y Hora", icon: Calendar },
                            { number: 4, title: "Datos", icon: User },
                            { number: 5, title: "Confirmación", icon: CheckCircle },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                                        step >= s.number
                                            ? "bg-gradient-to-r from-amber-500 to-yellow-600 border-amber-500 text-white shadow-lg"
                                            : "border-gray-300 text-gray-400 bg-white"
                                    }`}
                                >
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <span className={`ml-2 font-medium ${step >= s.number ? "text-amber-600" : "text-gray-400"}`}>
                  {s.title}
                </span>
                                {i < 4 && <div className={`w-8 h-0.5 mx-4 ${step > s.number ? "bg-amber-500" : "bg-gray-300"}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Servicios */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí tu tratamiento</h2>
                            <p className="text-gray-600 text-lg">Seleccioná el servicio que te interesa</p>
                        </div>

                        {loadingServices ? (
                            <p className="text-center text-gray-600">Cargando servicios…</p>
                        ) : services.length === 0 ? (
                            <p className="text-center text-gray-600">No hay servicios disponibles.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {services.map((s) => (
                                    <Card
                                        key={s._id}
                                        className={`group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 ${
                                            selectedService === s._id
                                                ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-xl"
                                                : "border-gray-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm"
                                        }`}
                                        onClick={() => setSelectedService(s._id)}
                                    >
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                                    {s.name}
                                                </CardTitle>
                                                {(s as any).popular && (
                                                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0 px-3 py-1 font-semibold shadow-lg">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Popular
                                                    </Badge>
                                                )}
                                            </div>
                                            {s.description && (
                                                <CardDescription className="text-gray-600 text-base leading-relaxed">
                                                    {s.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center text-gray-600">
                                                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                                    <span className="font-medium">
                            {s.durationMin ? `${s.durationMin} min` : "Duración variable"}
                          </span>
                                                </div>
                                                <div className="text-amber-600 font-bold text-lg">
                                                    {s.priceFrom ? `Desde ${money(s.priceFrom)}` : ""}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <div className="text-center mt-12">
                            <Button
                                size="lg"
                                disabled={!selectedService}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={async () => {
                                    await loadProfessionals()
                                    setStep(2)
                                }}
                            >
                                Continuar
                                <User className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Profesional */}
                {step === 2 && (
                    <div className="space-y-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí el profesional</h2>
                            <p className="text-gray-600 text-lg">
                                Podés seleccionar <b>Indistinto</b> para que asignemos uno automáticamente
                            </p>
                        </div>

                        {loadingProfessionals ? (
                            <p className="text-center text-gray-600">Cargando profesionales…</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <Card
                                    className={`group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 ${
                                        selectedProfessional === "any"
                                            ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-xl"
                                            : "border-gray-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm"
                                    }`}
                                    onClick={() => setSelectedProfessional("any")}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                                Indistinto
                                            </CardTitle>
                                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-3 py-1 font-semibold shadow-lg">
                                                <Users className="w-3 h-3 mr-1" />
                                                Automático
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-gray-600 text-base leading-relaxed">
                                            Te asignamos el mejor profesional disponible para tu horario
                                        </CardDescription>
                                    </CardHeader>
                                </Card>

                                {professionals.map((p) => (
                                    <Card
                                        key={p._id}
                                        className={`group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 ${
                                            selectedProfessional === p._id
                                                ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-xl"
                                                : "border-gray-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm"
                                        }`}
                                        onClick={() => setSelectedProfessional(p._id)}
                                    >
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                                                {p.name}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        )}

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
                                disabled={!selectedService || loadingProfessionals}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                onClick={async () => {
                                    await loadAvailableDays()
                                    setStep(3)
                                }}
                            >
                                Continuar
                                <Calendar className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Fecha y Hora */}
                {step === 3 && (
                    <div className="space-y-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí fecha y horario</h2>
                            <p className="text-gray-600 text-lg">Seleccioná una fecha disponible y luego el horario que prefieras</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900">Seleccionar Fecha</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex justify-center">
                                        <CalendarComponent
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={async (date) => {
                                                setSelectedDate(date)
                                                if (date && isDateAvailable(date)) {
                                                    await loadTimeSlots(date)
                                                } else {
                                                    setTimeSlots([])
                                                    setSelectedTime("")
                                                }
                                            }}
                                            disabled={(date) => {
                                                // Disable past dates
                                                if (date < new Date()) return true
                                                // Only enable available days if we have them
                                                if (availableDays.length > 0) {
                                                    return !isDateAvailable(date)
                                                }
                                                return false
                                            }}
                                            locale={es}
                                            className="rounded-xl border-2 border-amber-200"
                                        />
                                    </div>
                                    {loadingDays && <p className="text-sm text-gray-500 text-center">Verificando disponibilidad…</p>}
                                    {selectedDate && availableDays.length > 0 && !isDateAvailable(selectedDate) && (
                                        <p className="text-sm text-red-500 text-center">Esta fecha no está disponible</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Horarios */}
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-amber-500" />
                                        Horarios Disponibles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingSlots ? (
                                        <p className="text-gray-600">Cargando horarios…</p>
                                    ) : !selectedDate ? (
                                        <p className="text-gray-600">Elegí una fecha para ver los horarios.</p>
                                    ) : !isDateAvailable(selectedDate) ? (
                                        <p className="text-gray-600">Esta fecha no está disponible.</p>
                                    ) : timeSlots.length === 0 ? (
                                        <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
                                    ) : (
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
                                    )}
                                </CardContent>
                            </Card>
                        </div>

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
                                disabled={!selectedService || !selectedDate || !selectedTime || !isDateAvailable(selectedDate)}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                onClick={() => setStep(4)}
                            >
                                Continuar
                                <User className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Datos del cliente */}
                {step === 4 && (
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
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                            placeholder="Tu apellido"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="+54 11 1234-5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="Tu DNI"
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Comentarios (opcional)</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 resize-none"
                                        placeholder="¿Alguna consulta o requerimiento especial?"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center space-x-4 mt-12">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                                onClick={() => setStep(3)}
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Volver
                            </Button>
                            <Button
                                size="lg"
                                disabled={
                                    submitting ||
                                    !selectedService ||
                                    !selectedDate ||
                                    !selectedTime ||
                                    !firstName.trim() ||
                                    !lastName.trim() ||
                                    !email.trim() ||
                                    !phone.trim() ||
                                    !dni.trim()
                                }
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                onClick={createBooking}
                            >
                                {submitting ? "Creando…" : "Confirmar Reserva"}
                                <CheckCircle className="ml-3 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 5: Confirmación */}
                {step === 5 && bookingResult && (
                    <div className="text-center space-y-8">
                        <div className="max-w-2xl mx-auto">
                            <div
                                className={`rounded-3xl p-12 border ${
                                    bookingResult.booking.depositRequired
                                        ? "bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-200"
                                        : "bg-gradient-to-r from-green-100 to-emerald-100 border-green-200"
                                }`}
                            >
                                <div
                                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                                        bookingResult.booking.depositRequired
                                            ? "bg-gradient-to-r from-amber-500 to-yellow-600"
                                            : "bg-gradient-to-r from-green-500 to-emerald-600"
                                    }`}
                                >
                                    {bookingResult.booking.depositRequired ? (
                                        <CreditCard className="h-10 w-10 text-white" />
                                    ) : (
                                        <CheckCircle className="h-10 w-10 text-white" />
                                    )}
                                </div>

                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    {bookingResult.booking.depositRequired ? "¡Reserva Creada!" : "¡Reserva Confirmada!"}
                                </h2>

                                <p className="text-lg text-gray-600 mb-8">{bookingResult.message}</p>

                                {bookingResult.booking.depositRequired && bookingResult.payment && (
                                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8">
                                        <div className="flex items-center justify-center mb-4">
                                            <CreditCard className="h-6 w-6 text-amber-500 mr-2" />
                                            <h3 className="font-bold text-gray-900 text-lg">Pago de Seña Requerido</h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">
                                            Para confirmar tu reserva, necesitas pagar una seña de{" "}
                                            <span className="font-bold text-amber-600">{money(bookingResult.payment.amount)}</span>
                                        </p>
                                        <Button
                                            size="lg"
                                            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                                            onClick={() => {
                                                window.open(bookingResult.payment!.initPoint, "_blank")
                                                toast.success("Redirigiendo al pago...")
                                            }}
                                        >
                                            <CreditCard className="mr-3 h-6 w-6" />
                                            Pagar Seña - {money(bookingResult.payment.amount)}
                                            <ExternalLink className="ml-3 h-5 w-5" />
                                        </Button>
                                    </div>
                                )}

                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                                    <h3 className="font-bold text-gray-900 mb-4">Resumen de tu reserva:</h3>
                                    <div className="space-y-3 text-left">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Servicio:</span>
                                            <span className="font-semibold">{bookingResult.booking.service.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Profesional:</span>
                                            <span className="font-semibold">{bookingResult.booking.professional.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha:</span>
                                            <span className="font-semibold">
                        {format(new Date(bookingResult.booking.start), "PPP", { locale: es })}
                      </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Hora:</span>
                                            <span className="font-semibold">{format(new Date(bookingResult.booking.start), "HH:mm")}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estado:</span>
                                            <Badge variant={bookingResult.booking.status === "confirmed" ? "default" : "secondary"}>
                                                {bookingResult.booking.status === "pending" ? "Pendiente" : "Confirmada"}
                                            </Badge>
                                        </div>
                                        {bookingResult.booking.depositRequired && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Estado del pago:</span>
                                                <Badge variant={bookingResult.booking.depositStatus === "paid" ? "default" : "destructive"}>
                                                    {bookingResult.booking.depositStatus === "unpaid" ? "Pendiente" : "Pagado"}
                                                </Badge>
                                            </div>
                                        )}
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
                                    // reset para nueva reserva
                                    setStep(1)
                                    setSelectedService("")
                                    setProfessionals([])
                                    setSelectedProfessional("any")
                                    setSelectedDate(undefined)
                                    setAvailableDays([])
                                    setTimeSlots([])
                                    setSelectedTime("")
                                    setFirstName("")
                                    setLastName("")
                                    setEmail("")
                                    setPhone("")
                                    setDni("")
                                    setNotes("")
                                    setBookingResult(null)
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
