"use client"
import React from 'react'
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
import { useAuth } from "@/app/auth/AuthProvider";

type Props = {
    isConfirmed: boolean;
    esGrupo: boolean;
    booking: any;
    groupData: any;
    deadlineHuman?: string | null;
    dateStr: string;
    startTime: string;
    endTime: string;
    service: any;
    professional: any;
    showDepositCallout: boolean;
    isCanceled: boolean;
    paymentLink?: string;
    totalTarget?: number;
    totalCollected?: number;
    totalRemaining?: number;
    groupCurrency?: string;
    señaAplicada?: string;
};

const toGCalDateUTC = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const buildGoogleCalendarUrl = (opts: { title: string; startISO: string; endISO?: string; details?: string; location?: string; }) => {
    const start = new Date(opts.startISO);
    const end = opts.endISO ? new Date(opts.endISO) : new Date(start.getTime() + 30 * 60 * 1000);
    const dates = `${toGCalDateUTC(start)}/${toGCalDateUTC(end)}`;
    const p = new URLSearchParams({ action: "TEMPLATE", text: opts.title || "Reserva", dates });
    if (opts.details) p.set("details", opts.details);
    if (opts.location) p.set("location", opts.location);
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

const fmtMoney = (value?: number, currency?: string) => {
    if (typeof value !== "number") return "";
    const cur = currency || "ARS";
    try { return value.toLocaleString("es-AR", { style: "currency", currency: cur, maximumFractionDigits: 0 }); }
    catch { return `${value} ${cur}`; }
};

const fmtDate = (iso: string, tz?: string) => {
    try { return new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeZone: tz || "America/Argentina/Buenos_Aires" }).format(new Date(iso)); }
    catch { return iso.slice(0, 10); }
};
const fmtTime = (iso: string, tz?: string) => {
    try { return new Intl.DateTimeFormat("es-AR", { timeStyle: "short", timeZone: tz || "America/Argentina/Buenos_Aires", hour12: false }).format(new Date(iso)); }
    catch { return iso.slice(11, 16); }
};

const toneClasses = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warn: "bg-amber-100 text-amber-900 border-amber-200",
    danger: "bg-rose-100 text-rose-900 border-rose-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
} as const;
const StatusBadge = ({ label, kind }: { label: string; kind: keyof typeof toneClasses }) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[kind]}`}>{label}</span>
);
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode; }) => (
    <div className="flex items-start justify-between gap-4 py-2">
        <div className="flex items-center gap-2 text-gray-600">{icon}<span className="text-sm">{label}</span></div>
        <div className="text-sm font-semibold text-gray-900 text-right">{value || "—"}</div>
    </div>
);
const requiresDeposit = (x: any) =>
    (typeof x?.depositValueApplied === "number" && x.depositValueApplied > 0) ||
    (typeof x?.depositAmount === "number" && x.depositAmount > 0);

const BookingPublicView = (props: Props) => {
    const {
        isConfirmed, esGrupo, booking, groupData, deadlineHuman, dateStr, startTime, endTime,
        service, professional, showDepositCallout, isCanceled, paymentLink, totalTarget,
        totalCollected, totalRemaining, groupCurrency, señaAplicada
    } = props;
    const { user } = useAuth();

    console.log(groupData)

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
                                        Resumen de reservas
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

                                            const priceStr =
                                                typeof b.price === "number"
                                                    ? fmtMoney(b.price, b.currency || groupCurrency)
                                                    : null;

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="space-y-0.5">
                                                        {/* Servicio */}
                                                        <div className="font-medium">{b.service?.name || "Servicio"}</div>

                                                        {/* Fecha y horario */}
                                                        <div className="text-sm text-gray-600">
                                                            {fmtDate(b.start, b.timezone)} - {fmtTime(b.start, b.timezone)}
                                                        </div>

                                                        {/* Profesional (opcional) */}
                                                        {b.professional?.name && (
                                                            <div className="text-xs text-gray-500">{b.professional.name}</div>
                                                        )}

                                                        {/* Precio (opcional) */}
                                                        {priceStr && (
                                                            <div className="text-sm font-semibold text-gray-900">{priceStr}</div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {/* Botón por reserva si está confirmada */}
                                                        {isConfirmed && (
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                className="h-9 px-3 rounded-lg border-2 border-amber-300 hover:bg-amber-50 flex items-center gap-2"
                                                                aria-label="Google Calendar"
                                                            >
                                                                <a href={perUrl} target="_blank" rel="noopener noreferrer">
                                                                    <FcGoogle className="h-4 w-4" />
                                                                    <span className="text-xs font-medium">Agregar al calendario</span>
                                                                </a>
                                                            </Button>
                                                        )}

                                                        {/* Estado y seña solo si NO está confirmada */}
                                                        {!isConfirmed && !isCanceled && (
                                                            <>
                                                                {requiresDeposit(b) ? (
                                                                    <>
                                                                        <StatusBadge
                                                                            label={b.paymentSummary?.isFullyPaid ? "Pagado" : "Pendiente"}
                                                                            kind={b.paymentSummary?.isFullyPaid ? "success" : "warn"}
                                                                        />
                                                                        {typeof b.depositValueApplied === "number" &&
                                                                            b.depositValueApplied > 0 && (
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    {fmtMoney(b.depositValueApplied, groupCurrency)}
                                                                                </div>
                                                                            )}
                                                                    </>
                                                                ) : (
                                                                    <StatusBadge label="No requiere seña" kind="neutral" />
                                                                )}
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
                                                Seña pendiente
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-sm text-gray-600">
                                                        {esGrupo ? `Importe total (${groupData?.bookings?.length || 1} reservas)` : "Importe a abonar"}
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900">{señaAplicada}</div>
                                                    {/* @ts-ignore */}
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
                                            >
                                                <Button
                                                    className="w-full sm:w-auto h-11 bg-[#00a6ff] hover:bg-[#0096e6] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                                                >
                                                    <img
                                                        src="/mercadopago.png"
                                                        alt="Mercado Pago"
                                                        className="h-5 w-auto"
                                                    />
                                                    Pagar con Mercado Pago
                                                </Button>
                                            </a>

                                            <p className="text-xs text-gray-500">
                                                Al hacer clic se abrirá una nueva pestaña de Mercado Pago.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>

                        {!esGrupo && (
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
                                </CardContent>
                            </Card>
                        )}

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

                        {isConfirmed && booking.client?.email && !user ? (
                            <div className="pt-2">
                                <Button
                                    size="lg"
                                    className="h-14 px-10 hover:opacity-85 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold shadow-xl border-0"
                                    asChild
                                >
                                    <Link href={`/verify-client?email=${encodeURIComponent(booking.client.email)}`}><span>Crear cuenta</span></Link>
                                </Button>

                                <p className="mt-2 text-xs text-gray-500">
                                    Creá tu cuenta para ver y gestionar tus reservas más rápido.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default BookingPublicView