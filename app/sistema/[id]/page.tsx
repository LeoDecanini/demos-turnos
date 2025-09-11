// app/reservas/[id]/page.tsx
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import LoginStartButton from "./LoginStartButton"
// Remove incorrect import, define type inline below

type Booking = {
    _id: string
    account: string
    service: { _id: string; name: string; description?: string; price?: number; currency?: string } | string
    professional?: { _id: string; name: string } | string | null
    client?: { name?: string; email?: string; phone?: string; dni?: string }
    start: string
    end: string
    timezone?: string
    status: string
    paymentStatus?: "paid" | "unpaid" | "refunded" | string
    price?: number
    currency?: string
    notes?: string

    // Depósito / seña
    depositRequired?: boolean
    depositType?: string
    depositAmount?: number
    depositCurrency?: string
    depositValueApplied?: number
    depositStatus?: "paid" | "unpaid" | "expired" | string
    depositDeadlineAt?: string | null
    depositInitPoint?: string
    depositSandboxInitPoint?: string
}

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public/booking`
// ⚠️ Cambiá este endpoint a tu preferencia. Mantengo accountId como query si lo necesitás.
const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID as string

// Extrae la carga útil desde data.data, y acepta tanto {booking} como el objeto directo
const getPayload = (raw: any) => raw?.data ?? raw
const getBookingFromPayload = (payload: any): Booking | null => {
    if (!payload) return null
    if (payload.booking) return payload.booking as Booking
    return payload as Booking
}

const fmtMoney = (value?: number, currency?: string) => {
    if (typeof value !== "number") return ""
    const cur = currency || "ARS"
    try {
        return value.toLocaleString("es-AR", { style: "currency", currency: cur })
    } catch {
        return `${value} ${cur}`
    }
}

const fmtDateTime = (iso: string, tz?: string) => {
    try {
        const d = new Date(iso)
        const date = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "full",
            timeZone: tz || "America/Argentina/Buenos_Aires",
        }).format(d)
        const time = new Intl.DateTimeFormat("es-AR", {
            timeStyle: "short",
            timeZone: tz || "America/Argentina/Buenos_Aires",
            hour12: false,
        }).format(d)
        return { date, time }
    } catch {
        return { date: iso.slice(0, 10), time: iso.slice(11, 16) }
    }
}

const badgeTone = (status?: string) => {
    const s = (status || "").toLowerCase()
    if (["paid", "approved", "confirmed", "active", "success"].includes(s)) return "success"
    if (["unpaid", "pending", "created", "awaiting", "open"].includes(s)) return "warn"
    if (["expired", "cancelled", "canceled", "refunded", "failed"].includes(s)) return "danger"
    return "neutral"
}

const BadgeTone = ({ label, tone }: { label: string; tone: "success" | "warn" | "danger" | "neutral" }) => {
    const classes =
        tone === "success"
            ? "bg-emerald-500 text-white"
            : tone === "warn"
                ? "bg-amber-500 text-white"
                : tone === "danger"
                    ? "bg-rose-500 text-white"
                    : "bg-gray-200 text-gray-800"
    return <Badge className={`px-3 ${classes}`}>{label}</Badge>
}

type Params = { id: string };

export default async function Page(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id) return <div>No se indicó ID de reserva</div>
    // Endpoint base: modificalo si querés otra ruta (ej: `/booking/${id}`)
    const url = `${API_BASE}/${id}?accountId=${ACCOUNT_ID}`
    console.log({ url })
    console.log({ url })
    console.log({ url })
    let booking: Booking | null = null
    try {
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) throw new Error("No se pudo obtener la reserva")
        const raw = await res.json()
        const payload = getPayload(raw)
        booking = getBookingFromPayload(payload)
    } catch (e) {
        booking = null
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 flex items-center justify-center px-6 py-24">
                <Card className="max-w-xl w-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                            Reserva no encontrada
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-600">
                        No pudimos cargar los datos de la reserva. Verificá el enlace o intentá nuevamente más tarde.
                    </CardContent>
                </Card>
            </div>
        )
    }

    const service =
        typeof booking.service === "string" ? { _id: booking.service, name: booking.service } : booking.service
    const professional =
        typeof booking.professional === "string"
            ? { _id: booking.professional, name: "Indistinto" }
            : booking.professional || { _id: "", name: "Indistinto" }

    const start = fmtDateTime(booking.start, booking.timezone)
    const end = fmtDateTime(booking.end, booking.timezone)
    const isReservaConfirmada = booking.depositStatus === "paid"

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden pt-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]" />
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
                <div className="text-center space-y-6">
                    {isReservaConfirmada ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900">Reserva Confirmada</h1>
                            <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl">
                                <div className="text-lg font-semibold">¡Tu reserva está confirmada!</div>
                                <div className="text-emerald-100 mt-1">El depósito ha sido procesado exitosamente.</div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <AlertCircle className="w-16 h-16 text-amber-500" />
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900">Reserva Pendiente</h1>
                            <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xl">
                                <div className="text-lg font-semibold">Reserva en proceso</div>
                                <div className="text-amber-100 mt-1">Esperando confirmación del depósito.</div>
                            </div>
                        </div>
                    )}
                </div>

                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-md mx-auto">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <Calendar className="w-6 h-6 text-amber-600" />
                            <h2 className="text-xl font-bold text-gray-900">Información de la Reserva</h2>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Fecha</div>
                                <div className="text-2xl font-bold text-gray-900">{start.date}</div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-gray-700">
                                <Clock className="w-5 h-5 text-amber-600" />
                                <span className="text-xl font-semibold">
                                    {start.time} - {end.time}
                                </span>
                            </div>

                            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                                <div className="mt-8 flex justify-center">
                                    <LoginStartButton email={booking.client?.email} />
                                </div>
                                {booking.client?.email}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
