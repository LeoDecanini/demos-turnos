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
    ExternalLink,
    UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* NUEVO: tooltip + icono Google */
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FcGoogle } from "react-icons/fc";

const toGCalDateUTC = (d: Date) => {
    const iso = d.toISOString();
    return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};

function buildGoogleCalendarUrl(opts: {
    title: string;
    startISO: string;
    endISO?: string;
    details?: string;
    location?: string;
}) {
    const start = new Date(opts.startISO);
    const end = opts.endISO ? new Date(opts.endISO) : new Date(start.getTime() + 30 * 60 * 1000);
    const dates = `${toGCalDateUTC(start)}/${toGCalDateUTC(end)}`;
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: opts.title || "Reserva",
        dates,
    });
    if (opts.details) params.set("details", opts.details);
    if (opts.location) params.set("location", opts.location);
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

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
    status: string;
    paymentStatus?: "paid" | "unpaid" | "refunded" | string;
    price?: number;
    currency?: string;
    notes?: string;
    depositRequired?: boolean;
    depositType?: string;
    depositAmount?: number;
    depositCurrency?: string;
    depositValueApplied?: number;
    depositStatus?: "not_required" | "unpaid" | "pending" | "paid" | "refunded" | "expired" | string;
    depositDeadlineAt?: string | null;
    depositInitPoint?: string;
    depositSandboxInitPoint?: string;
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string;
const API_BASE = `${BACKEND}/bookingmodule/public/${SUBDOMAIN}/booking`;

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
    searchParams,
}: {
    params: { id: string };
    searchParams: { grupo?: string };
}) {
    const { id } = params;
    const esGrupo = searchParams.grupo === 'true';

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

    let url: string;
    let booking: Booking | null = null;
    let groupData: any = null;
    let isGroupMode = false;

    if (esGrupo) {
        url = `${API_BASE}/${id}?groupMode=true`;
        try {
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error("No se pudo obtener el grupo");
            const response = await res.json();
            if (response.ok && response.data) {
                booking = response.data;
                groupData = response.group;
                isGroupMode = response.isGroupMode;
                if (booking) {
                    booking.service = booking.service || { name: "Servicio", _id: "" };
                    booking.professional = booking.professional || null;
                    booking.client = booking.client || {};
                }
            } else {
                throw new Error("Respuesta inválida del servidor");
            }
        } catch (error) {
            console.error('Error fetching group data:', error);
            groupData = null;
            booking = null;
        }
    } else {
        url = `${API_BASE}/${id}`;
        try {
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error("No se pudo obtener la reserva");
            const raw = await res.json();
            booking = getBookingFromPayload(getPayload(raw));
        } catch (error) {
            console.error('Error fetching booking data:', error);
            booking = null;
        }
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 grid place-items-center px-6 py-24">
                <Card className="max-w-xl w-full border-0 shadow-xl bg-white">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                            {esGrupo ? "Grupo de reservas no encontrado" : "Reserva no encontrada"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-600">
                        No pudimos cargar los datos de {esGrupo ? "las reservas" : "la reserva"}. Verificá el enlace o intentá nuevamente más tarde.
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

    const totalTarget = esGrupo && groupData?.totals ? groupData.totals.depositTarget : booking.depositValueApplied;
    const totalCollected = esGrupo && groupData?.totals ? groupData.totals.netCollected : 0;
    const totalRemaining = esGrupo && groupData?.totals ? groupData.totals.remaining : (booking.depositValueApplied || 0);
    const isGroupFullyPaid = esGrupo && groupData?.totals ? groupData.totals.fullyPaid : (booking.depositStatus === 'paid');
    const groupCurrency = esGrupo && groupData?.totals ? groupData.totals.currency : (booking.depositCurrency || booking.currency);

    const showDepositCallout = esGrupo
        ? (totalRemaining > 0 && groupData?.mp && (groupData.mp.initPoint || groupData.mp.sandboxInitPoint))
        : (booking.depositRequired &&
            (booking.depositStatus === "unpaid" || booking.depositStatus === "pending") &&
            (booking.depositInitPoint || booking.depositSandboxInitPoint));

    const depositDeadline =
        booking.depositDeadlineAt ? new Date(booking.depositDeadlineAt) : null;

    const deadlineHuman = depositDeadline
        ? new Intl.DateTimeFormat("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(depositDeadline)
        : null;

    const señaAplicada = esGrupo
        ? fmtMoney(totalTarget, groupCurrency)
        : (typeof booking.depositValueApplied === "number"
            ? fmtMoney(booking.depositValueApplied, booking.depositCurrency || booking.currency)
            : booking.depositAmount && booking.depositType === "percent"
                ? `${booking.depositAmount}%`
                : fmtMoney(booking.depositAmount, booking.depositCurrency || booking.currency));

    const isConfirmed = esGrupo ? isGroupFullyPaid : ((booking.status || "").toLowerCase() === "confirmed");
    const isCanceled =
        (booking.status || "").toLowerCase() === "canceled" || booking.depositStatus === "expired";


    const gcalUrl = buildGoogleCalendarUrl({
        title: `${service?.name || "Reserva"}${professional?.name && professional.name !== "Indistinto" ? ` — ${professional.name}` : ""}${esGrupo ? ` (Grupo de ${groupData?.bookings?.length || 1} reservas)` : ""}`,
        startISO: booking.start,
        endISO: booking.end,
        details:
            `Reserva #${booking._id}` +
            (esGrupo && groupData?.groupId ? `\nGrupo: ${groupData.groupId}` : "") +
            (service?.name ? `\nServicio: ${service.name}` : "") +
            (professional?.name ? `\nProfesional: ${professional.name}` : "") +
            (esGrupo && groupData?.bookings ? `\n\nTotal de reservas: ${groupData.bookings.length}` : "") +
            (booking.notes ? `\n\nNotas:\n${booking.notes}` : ""),
        location: undefined,
    });

    const paymentLink = esGrupo && groupData?.mp
        ? (groupData.mp.initPoint || groupData.mp.sandboxInitPoint)
        : (booking.depositInitPoint || booking.depositSandboxInitPoint);

    return (
        <main className="min-h-screen relative overflow-hidden pt-16">
            <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center space-y-6">
                    {isConfirmed ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
                                {esGrupo ? "¡Reservas confirmadas!" : "¡Reserva confirmada!"}
                            </h1>
                            <div className="mx-auto w-full max-w-xl p-4 md:p-5 rounded-2xl bg-green-100/50 text-black border-green-400 border">
                                <p className="text-sm md:text-base">
                                    {esGrupo ? `Tus ${groupData?.bookings?.length || 1} turnos quedaron confirmados.` : "Tu turno quedó confirmado."} Te enviamos un correo con el detalle.
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
                                {esGrupo ? "Reservas canceladas" : "Reserva cancelada"}
                            </h1>
                            <div className="mx-auto w-full max-w-xl p-4 md:p-5 rounded-2xl bg-rose-100/50 text-black border-rose-400 border">
                                <p className="text-sm md:text-base">
                                    {esGrupo ? "Estas reservas ya no se encuentran activas." : "Esta reserva ya no se encuentra activa."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <AlertTriangle className="w-16 h-16 text-amber-500" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
                                {esGrupo ? "Reservas pendientes" : "Reserva pendiente"}
                            </h1>
                            <div className="mx-auto w-full max-w-xl p-4 md:p-5 rounded-2xl bg-yellow-100/50 text-black border-yellow-400 border">
                                <p className="text-sm">
                                    Recordá abonar la seña antes del {deadlineHuman || `${dateStr} a las ${startTime}`} 😊
                                    <br />
                                    De no hacerlo, {esGrupo && groupData?.bookings?.length > 1 ? "las reservas se cancelarán" : "la reserva se cancelará"} automáticamente.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid gap-8">
                    <div className="lg:col-span-3 space-y-8">
                        {esGrupo && groupData?.bookings && groupData.bookings.length > 1 && (
                            <Card className="border shadow bg-white md:rounded-2xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <NotebookText className="w-5 h-5 text-amber-600" />
                                        Resumen del grupo ({groupData.bookings.length} reservas)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {groupData.bookings.map((b: any, i: number) => {
                                            const perUrl = buildGoogleCalendarUrl({
                                                title: `${b.service?.name || "Reserva"}${b?.professional?.name ? ` — ${b.professional.name}` : ""}`,
                                                startISO: b.start,
                                                endISO: b.end,
                                                details: `Reserva #${b._id || ""}${b?.notes ? `\n\nNotas:\n${b.notes}` : ""}`,
                                            });
                                            return (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <div className="font-medium">{b.service?.name || "Servicio"}</div>
                                                        <div className="text-sm text-gray-600">
                                                            {fmtDate(b.start, b.timezone)} - {fmtTime(b.start, b.timezone)}
                                                        </div>
                                                        {b.professional?.name && (
                                                            <div className="text-xs text-gray-500">{b.professional.name}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {/* Botón por reserva si está confirmada */}
                                                        {isConfirmed && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            asChild
                                                                            variant="outline"
                                                                            className="h-9 w-9 p-0 rounded-lg border-2 border-amber-300 hover:bg-amber-50"
                                                                            aria-label="Google Calendar"
                                                                        >
                                                                            <a href={perUrl} target="_blank" rel="noopener noreferrer">
                                                                                <FcGoogle className="h-4 w-4 mx-auto" />
                                                                            </a>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="left" className="text-xs">
                                                                        Google Calendar
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}

                                                        {/* Estado y monto de seña solo si NO está confirmada */}
                                                        {!isConfirmed && !isCanceled && (
                                                            <>
                                                                <StatusBadge
                                                                    label={b.paymentSummary?.isFullyPaid ? "Pagado" : "Pendiente"}
                                                                    kind={b.paymentSummary?.isFullyPaid ? "success" : "warn"}
                                                                />
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {fmtMoney(b.depositValueApplied, groupCurrency)}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Totales ocultos si está confirmada */}
                                    {!isConfirmed && !isCanceled && esGrupo && groupData?.totals && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between text-sm">
                                                <span>Total seña:</span>
                                                <span className="font-semibold">{fmtMoney(totalTarget, groupCurrency)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Pagado:</span>
                                                <span className="font-semibold text-emerald-600">{fmtMoney(totalCollected, groupCurrency)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Pendiente:</span>
                                                <span className="font-semibold text-amber-600">{fmtMoney(totalRemaining, groupCurrency)}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="w-full col-span-3 space-y-8">
                            {showDepositCallout && !isCanceled && (
                                <>
                                    <Card className="border shadow bg-white md:rounded-2xl">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                                <Wallet className="w-5 h-5 text-amber-600" />
                                                {esGrupo ? "Seña grupal pendiente" : "Seña pendiente"}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-sm text-gray-600">
                                                        {esGrupo ? `Importe total (${groupData?.bookings?.length || 1} reservas)` : "Importe a abonar"}
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900">{señaAplicada}</div>
                                                    {esGrupo && totalCollected > 0 && (
                                                        <div className="text-sm text-emerald-600">
                                                            Pagado: {fmtMoney(totalCollected, groupCurrency)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {deadlineHuman && (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                                                    Fecha límite: <span className="font-semibold">{deadlineHuman}</span>
                                                </div>
                                            )}

                                            <a
                                                href={paymentLink || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 font-semibold text-white shadow-lg border-0 hover:opacity-80 disabled:opacity-60 transition"
                                            >
                                                <img src="/mercadopago.png" alt="Mercado Pago" className="h-5 w-auto" />
                                                {esGrupo ? "Pagar seña grupal" : "Pagar seña"} con Mercado Pago
                                            </a>


                                            <p className="text-xs text-gray-500">
                                                Al hacer clic se abrirá una nueva pestaña con el proveedor de pagos.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>

                        <Card className="border shadow bg-white md:rounded-2xl">
                            <CardHeader className="pb-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                                        <NotebookText className="w-6 h-6 text-amber-600" />
                                        {esGrupo ? "Detalle principal" : "Detalle de la reserva"}
                                    </CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-4">
                                <div className="divide-y divide-gray-100">
                                    <InfoRow icon={<CalendarIcon className="w-4 h-4 text-amber-600" />} label="Fecha" value={dateStr} />
                                    <InfoRow icon={<Clock className="w-4 h-4 text-amber-600" />} label="Horario" value={`${startTime} — ${endTime}`} />
                                    <InfoRow icon={<NotebookText className="w-4 h-4 text-amber-600" />} label="Servicio" value={service?.name} />
                                    <InfoRow icon={<User className="w-4 h-4 text-amber-600" />} label="Profesional" value={professional?.name || "Indistinto"} />
                                    {!!booking.price && (
                                        <InfoRow icon={<Wallet className="w-4 h-4 text-amber-600" />} label="Precio" value={fmtMoney(booking.price, booking.currency)} />
                                    )}
                                </div>

                                {booking.notes && (
                                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                                        <div className="font-semibold mb-1">Notas</div>
                                        <p className="whitespace-pre-wrap">{booking.notes}</p>
                                    </div>
                                )}

                                {/* Botón global de Calendar: removido */}
                                {/* Para reserva única, mostramos botón por-reserva si está confirmada */}
                                {/*  {isConfirmed && (
                  <div className="pt-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            asChild
                            variant="outline"
                            className="h-11 px-4 rounded-lg border-2 border-amber-300 hover:bg-amber-50"
                            aria-label="Google Calendar"
                          >
                            <a href={gcalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                              <FcGoogle className="h-5 w-5" />
                              <span>Google Calendar</span>
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Google Calendar
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )} */}
                            </CardContent>
                        </Card>

                        <Card className="border shadow bg-white md:rounded-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                    <User className="w-5 h-5 text-amber-600" />
                                    Datos del cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="divide-y divide-gray-100">
                                    <InfoRow icon={<User className="w-4 h-4 text-gray-500" />} label="Nombre" value={booking.client?.name} />
                                    <InfoRow icon={<Mail className="w-4 h-4 text-gray-500" />} label="Email" value={booking.client?.email} />
                                    <InfoRow icon={<Phone className="w-4 h-4 text-gray-500" />} label="Teléfono" value={booking.client?.phone} />
                                    <InfoRow icon={<IdCard className="w-4 h-4 text-gray-500" />} label="DNI" value={booking.client?.dni} />
                                </div>
                            </CardContent>
                        </Card>

                        {isConfirmed && booking.client?.email ? (
                            <div className="pt-2">
                                <Link
                                    href={`/verify-client?email=${encodeURIComponent(booking.client.email)}`}
                                    className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl
                 bg-gradient-to-r from-yellow-600 to-orange-600 px-5 py-3 font-semibold text-white
                 shadow-lg shadow-indigo-500/25 ring-1 ring-inset ring-white/10
                 transition-all duration-300 hover:scale-[1.02] hover:brightness-105 hover:shadow-xl
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                >
                                    <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                                    <UserPlus className="h-5 w-5 shrink-0" />
                                    <span>Crear cuenta</span>
                                </Link>

                                <p className="mt-2 text-xs text-gray-500">
                                    Creá tu cuenta para ver y gestionar tus reservas más rápido.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </main>
    );
}
