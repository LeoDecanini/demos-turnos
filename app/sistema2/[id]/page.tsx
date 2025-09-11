// app/reservas/[id]/page.tsx
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, CheckCircle, CreditCard, AlertCircle, MapPin } from "lucide-react"

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
    depositPreferenceId?: string
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
            <div
                className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 flex items-center justify-center px-6 py-24">
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

    const paymentTone = badgeTone(booking.paymentStatus)
    const depositTone = badgeTone(booking.depositStatus)
    const statusTone = badgeTone(booking.status)

    const now = new Date()
    const deadline = booking.depositDeadlineAt ? new Date(booking.depositDeadlineAt) : null
    const depositExpired = deadline ? now > deadline : false

    const canPayDeposit =
        booking.depositRequired &&
        booking.depositStatus !== "paid" &&
        !depositExpired &&
        !!booking.depositInitPoint

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]" />
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

                {/* Header / Estado */}
                <div className="flex flex-col gap-4 items-start">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-7 h-7 text-amber-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Detalle de reserva</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <BadgeTone label={`Estado: ${booking.status}`} tone={statusTone} />
                        <BadgeTone label={`Pago: ${booking.paymentStatus ?? "—"}`} tone={paymentTone} />
                        {booking.depositRequired && (
                            <BadgeTone
                                label={`Seña: ${depositExpired ? "vencida" : booking.depositStatus ?? "—"}`}
                                tone={depositExpired ? "danger" : depositTone}
                            />
                        )}
                    </div>
                </div>

                {/* Resumen principal */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-gray-900">Resumen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-amber-600 mt-1" />
                                <div>
                                    <div className="text-sm text-gray-600">Cliente</div>
                                    <div className="font-semibold text-gray-900">{booking.client?.name ?? "—"}</div>
                                    <div className="text-sm text-gray-600">{booking.client?.email ?? ""}</div>
                                    <div className="text-sm text-gray-600">{booking.client?.phone ?? ""}</div>
                                    <div
                                        className="text-sm text-gray-600">{booking.client?.dni ? `DNI: ${booking.client?.dni}` : ""}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-amber-600 mt-1" />
                                <div>
                                    <div className="text-sm text-gray-600">Servicio</div>
                                    <div className="font-semibold text-gray-900">{service?.name ?? "—"}</div>
                                    {typeof service?.description === "string" && (
                                        <div className="text-sm text-gray-600">{service.description}</div>
                                    )}
                                    <div className="text-sm text-gray-600">
                                        {fmtMoney(booking.price ?? (service as any)?.price, booking.currency ?? (service as any)?.currency)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-amber-600 mt-1" />
                                <div>
                                    <div className="text-sm text-gray-600">Profesional</div>
                                    <div
                                        className="font-semibold text-gray-900">{professional?.name ?? "Indistinto"}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-amber-600 mt-1" />
                                <div>
                                    <div className="text-sm text-gray-600">Fecha</div>
                                    <div className="font-semibold text-gray-900">{start.date}</div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        <span>{start.time} - {end.time} ({booking.timezone || "America/Argentina/Buenos_Aires"})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {booking.notes && (
                            <div className="pt-2">
                                <div className="text-sm text-gray-600 mb-1">Notas del cliente</div>
                                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/60 text-gray-800">
                                    {booking.notes}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pago / Seña */}
                {(booking.depositRequired || booking.paymentStatus) && (
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-gray-900">Estado de pago</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <CreditCard className="w-5 h-5 text-amber-600" />
                                <BadgeTone label={`Pago: ${booking.paymentStatus ?? "—"}`} tone={paymentTone} />
                                {booking.depositRequired && (
                                    <BadgeTone
                                        label={`Seña: ${depositExpired ? "vencida" : booking.depositStatus ?? "—"}`}
                                        tone={depositExpired ? "danger" : depositTone}
                                    />
                                )}
                            </div>

                            {booking.depositRequired && (
                                <>
                                    <div className="text-sm text-gray-700">
                                        {booking.depositType
                                            ? `Tipo: ${booking.depositType.toUpperCase()}`
                                            : "Seña requerida"}
                                        {typeof booking.depositValueApplied === "number" && (
                                            <> · Monto
                                                aplicado: <strong>{fmtMoney(booking.depositValueApplied, booking.depositCurrency || "ARS")}</strong></>
                                        )}
                                        {deadline && (
                                            <> ·
                                                Límite: <strong>{fmtDateTime(deadline.toISOString(), booking.timezone).date} {fmtDateTime(deadline.toISOString(), booking.timezone).time}</strong></>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            disabled={!canPayDeposit}
                                            className="bg-gradient-to-r from-amber-500 to-yellow-600 border-0 disabled:opacity-50"
                                            asChild
                                        >
                                            <a
                                                href={booking.depositInitPoint || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {depositExpired ? "Seña vencida" : booking.depositStatus === "paid" ? "Seña pagada" : "Pagar seña"}
                                            </a>
                                        </Button>

                                        {booking.depositSandboxInitPoint && (
                                            <Button variant="outline" asChild>
                                                <a
                                                    href={booking.depositSandboxInitPoint}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Sandbox
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
