// app/reservas/[id]/page.tsx
"use client"
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Wallet,
    User,
    NotebookText,
    Mail,
    Phone,
    IdCard,
    Copy,
    ExternalLink,
    ArrowLeft,
} from "lucide-react";

type Booking = {
    _id: string;
    account: string;
    service:
    | { _id: string; name: string; description?: string; price?: number; currency?: string }
    | string;
    professional?: { _id: string; name: string } | string | null;
    client?: { name?: string; email?: string; phone?: string; dni?: string };
    start: string;
    end: string;
    timezone?: string;

    status: string; // pending | confirmed | canceled | ...
    paymentStatus?: "paid" | "unpaid" | "refunded" | string;
    price?: number;
    currency?: string;
    notes?: string;

    // Depósito / seña
    depositRequired?: boolean;
    depositType?: string;
    depositAmount?: number; // % o monto según depositType
    depositCurrency?: string; // ISO
    depositValueApplied?: number; // monto final aplicado (en dinero)
    depositStatus?: "not_required" | "unpaid" | "pending" | "paid" | "refunded" | "expired" | string;
    depositDeadlineAt?: string | null;
    depositInitPoint?: string;
    depositSandboxInitPoint?: string;
};

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public/booking`;
const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID as string;

// Helpers
const getPayload = (raw: any) => raw?.data ?? raw;
const getBookingFromPayload = (payload: any): Booking | null => {
    if (!payload) return null;
    if (payload.booking) return payload.booking as Booking;
    return payload as Booking;
};

const fmtMoney = (value?: number, currency?: string) => {
    if (typeof value !== "number") return "";
    const cur = currency || "ARS";
    try {
        return value.toLocaleString("es-AR", { style: "currency", currency: cur, maximumFractionDigits: 0 });
    } catch {
        return `${value} ${cur}`;
    }
};

const fmtDate = (iso: string, tz?: string) => {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("es-AR", {
            dateStyle: "full",
            timeZone: tz || "America/Argentina/Buenos_Aires",
        }).format(d);
    } catch {
        return iso.slice(0, 10);
    }
};

const fmtTime = (iso: string, tz?: string) => {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("es-AR", {
            timeStyle: "short",
            timeZone: tz || "America/Argentina/Buenos_Aires",
            hour12: false,
        }).format(d);
    } catch {
        return iso.slice(11, 16);
    }
};

const toneClasses = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warn: "bg-amber-100 text-amber-900 border-amber-200",
    danger: "bg-rose-100 text-rose-900 border-rose-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
};

const pickTone = (status?: string): keyof typeof toneClasses => {
    const s = (status || "").toLowerCase();
    if (["paid", "approved", "confirmed", "success"].includes(s)) return "success";
    if (["unpaid", "pending", "created", "awaiting", "open"].includes(s)) return "warn";
    if (["expired", "cancelled", "canceled", "refunded", "failed"].includes(s)) return "danger";
    return "neutral";
};

function StatusBadge({ label, kind }: { label: string; kind: keyof typeof toneClasses }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[kind]}`}>
            {label}
        </span>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-2">
            <div className="flex items-center gap-2 text-gray-600">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <div className="text-sm font-semibold text-gray-900 text-right">{value || "—"}</div>
        </div>
    );
}

export default async function BookingPublicPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    if (!id) {
        return (
            <div className="min-h-screen grid place-items-center px-6 py-24">
                <Card className="max-w-xl w-full border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                            Falta el ID de la reserva
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-600">
                        Verificá el enlace recibido y volvé a intentar.
                    </CardContent>
                </Card>
            </div>
        );
    }

    const url = `${API_BASE}/${id}?accountId=${ACCOUNT_ID}`;
    let booking: Booking | null = null;

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo obtener la reserva");
        const raw = await res.json();
        booking = getBookingFromPayload(getPayload(raw));
    } catch {
        booking = null;
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 grid place-items-center px-6 py-24">
                <Card className="max-w-xl w-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                            Reserva no encontrada
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-600">
                        No pudimos cargar los datos de la reserva. Verificá el enlace o intentá nuevamente más tarde.
                    </CardContent>
                </Card>
            </div>
        );
    }

    const service = typeof booking.service === "string" ? { _id: booking.service, name: booking.service } : booking.service;
    const professional =
        typeof booking.professional === "string"
            ? { _id: booking.professional, name: "Indistinto" }
            : booking.professional || { _id: "", name: "Indistinto" };

    const tz = booking.timezone || "America/Argentina/Buenos_Aires";
    const dateStr = fmtDate(booking.start, tz);
    const startTime = fmtTime(booking.start, tz);
    const endTime = fmtTime(booking.end, tz);

    const statusTone = pickTone(booking.status);
    const payTone = pickTone(booking.paymentStatus);
    const depositTone = pickTone(booking.depositStatus);

    const showDepositCallout =
        booking.depositRequired &&
        (booking.depositStatus === "unpaid" || booking.depositStatus === "pending") &&
        (booking.depositInitPoint || booking.depositSandboxInitPoint);

    const depositDeadline =
        booking.depositDeadlineAt ? new Date(booking.depositDeadlineAt) : null;

    const deadlineHuman = depositDeadline
        ? new Intl.DateTimeFormat("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(depositDeadline)
        : null;

    const señaAplicada =
        typeof booking.depositValueApplied === "number"
            ? fmtMoney(booking.depositValueApplied, booking.depositCurrency || booking.currency)
            : booking.depositAmount && booking.depositType === "percent"
                ? `${booking.depositAmount}%`
                : fmtMoney(booking.depositAmount, booking.depositCurrency || booking.currency);

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden pt-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.12),transparent_55%)]" />

            {/* Header / Hero */}
            <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center space-y-6">
                    {booking.status?.toLowerCase() === "confirmed" ||
                        booking.depositStatus === "paid" ||
                        booking.paymentStatus === "paid" ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            </div>
                            {/* ↓ achicado en móviles */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
                                ¡Reserva confirmada!
                            </h1>
                            <div className="mx-auto w-full max-w-xl p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl">
                                <p className="text-sm md:text-base">
                                    Tu turno quedó confirmado. Te enviamos un correo con el detalle.
                                </p>
                            </div>
                        </div>
                    ) : booking.status?.toLowerCase() === "canceled" ||
                        booking.depositStatus === "expired" ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <XCircle className="w-16 h-16 text-rose-500" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
                                Reserva cancelada
                            </h1>
                            <div className="mx-auto w-full max-w-xl p-4 md:p-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xl">
                                <p className="text-sm md:text-base">
                                    Esta reserva ya no se encuentra activa.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <AlertTriangle className="w-16 h-16 text-amber-500" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
                                Reserva pendiente
                            </h1>
                            <div className="mx-auto w-full max-w-xl p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xl">
                                <p className="text-sm md:text-base">
                                    Aguardamos la confirmación del pago de seña (si corresponde).
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Content */}
            <section className="relative max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Principal */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Resumen turno */}
                        <Card className="border-0 shadow-none bg-transparent md:shadow-xl md:bg-white/85 md:backdrop-blur md:rounded-2xl">
                            <CardHeader className="pb-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                                        <NotebookText className="w-6 h-6 text-amber-600" />
                                        Detalle de la reserva
                                    </CardTitle>

                                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                        <StatusBadge label={`Estado: ${booking.status || "—"}`} kind={statusTone} />
                                        <StatusBadge
                                            label={`Pago: ${booking.paymentStatus || "—"}`}
                                            kind={payTone}
                                        />
                                        {booking.depositRequired ? (
                                            <StatusBadge
                                                label={`Seña: ${booking.depositStatus || "—"}`}
                                                kind={depositTone}
                                            />
                                        ) : (
                                            <StatusBadge label="Sin seña" kind="neutral" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-4">
                                <div className="divide-y divide-gray-100">
                                    <InfoRow
                                        icon={<CalendarIcon className="w-4 h-4 text-amber-600" />}
                                        label="Fecha"
                                        value={dateStr}
                                    />
                                    <InfoRow
                                        icon={<Clock className="w-4 h-4 text-amber-600" />}
                                        label="Horario"
                                        value={`${startTime} — ${endTime}`}
                                    />
                                    <InfoRow
                                        icon={<NotebookText className="w-4 h-4 text-amber-600" />}
                                        label="Servicio"
                                        value={service?.name}
                                    />
                                    <InfoRow
                                        icon={<User className="w-4 h-4 text-amber-600" />}
                                        label="Profesional"
                                        value={professional?.name || "Indistinto"}
                                    />
                                    {!!booking.price && (
                                        <InfoRow
                                            icon={<Wallet className="w-4 h-4 text-amber-600" />}
                                            label="Precio"
                                            value={fmtMoney(booking.price, booking.currency)}
                                        />
                                    )}
                                </div>

                                {booking.notes && (
                                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                                        <div className="font-semibold mb-1">Notas</div>
                                        <p className="whitespace-pre-wrap">{booking.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Cliente */}
                        <Card className="border-0 shadow-none bg-transparent md:shadow-xl md:bg-white/85 md:backdrop-blur md:rounded-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                    <User className="w-5 h-5 text-amber-600" />
                                    Datos del cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="divide-y divide-gray-100">
                                    <InfoRow
                                        icon={<User className="w-4 h-4 text-gray-500" />}
                                        label="Nombre"
                                        value={booking.client?.name}
                                    />
                                    <InfoRow
                                        icon={<Mail className="w-4 h-4 text-gray-500" />}
                                        label="Email"
                                        value={booking.client?.email}
                                    />
                                    <InfoRow
                                        icon={<Phone className="w-4 h-4 text-gray-500" />}
                                        label="Teléfono"
                                        value={booking.client?.phone}
                                    />
                                    <InfoRow
                                        icon={<IdCard className="w-4 h-4 text-gray-500" />}
                                        label="DNI"
                                        value={booking.client?.dni}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lateral */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Acción requerida (seña) */}
                        {showDepositCallout && (
                            <Card className="border-0 shadow-none bg-transparent md:shadow-xl md:bg-white/90 md:backdrop-blur md:rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Wallet className="w-5 h-5 text-amber-600" />
                                        Seña pendiente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-sm text-gray-600">Importe a abonar</div>
                                            <div className="text-2xl font-bold text-gray-900">{señaAplicada}</div>
                                        </div>
                                        <StatusBadge
                                            label={booking.depositStatus === "pending" ? "Procesando" : "Pendiente"}
                                            kind="warn"
                                        />
                                    </div>

                                    {deadlineHuman && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                                            Fecha límite: <span className="font-semibold">{deadlineHuman}</span>
                                        </div>
                                    )}

                                    <a
                                        href={booking.depositInitPoint || booking.depositSandboxInitPoint || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 font-semibold text-white shadow-lg hover:brightness-[1.05] transition"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Pagar seña (Mercado Pago)
                                    </a>

                                    <p className="text-xs text-gray-500">
                                        Al hacer clic se abrirá una nueva pestaña con el proveedor de pagos.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Utilitarios */}
                        <Card className="border-0 shadow-none bg-transparent md:shadow-xl md:bg-white/90 md:backdrop-blur md:rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Acciones</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                <form
                                >
                                    <button
                                        formAction={async () => { }}
                                        className="hidden"
                                        aria-hidden
                                    />
                                </form>

                                {/*  <button
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    onClick={async () => {
                                        "use client";
                                        try {
                                            await navigator.clipboard.writeText(booking._id);
                                        } catch { }
                                    }}
                                >
                                    <Copy className="w-4 h-4" />
                                    Copiar ID de reserva
                                </button> */}

                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver al inicio
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </main>
    );
}
