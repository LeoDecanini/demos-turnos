"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle,
    ArrowLeft,
    UserPlus,
    Lock,
    CreditCard,
    Copy,
    Calendar1Icon,
    Layers,
    CircleDot,
    CheckCircle2,
    Hash,
    UserIcon,
    Shield,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ServiceList from "@/components/ServiceList";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/components/BookingStepper";
import SocialWorkSelector from "@/components/SocialWorkSelector";
import CategorySelector from "@/components/CategorySelector";
import BranchSelector from "@/components/BranchSelector";
import { useAuth } from "../auth/AuthProvider";
import ProfessionalList from "@/components/ProfessionalList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FcGoogle } from "react-icons/fc";
import { isValidPhoneNumber, isPossiblePhoneNumber } from "react-phone-number-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import BranchMap from "@/components/BranchMap";

// =======================================================
// ===============  MODO ENFOCADO (NF)  ==================
// Activa con ?action=cancel|reschedule&id=<bookingId>
// Para reprogramar, idealmente pasá también serviceId
// =======================================================

function getSlugFromEnvOrHost() {
    const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string | undefined;
    if (SUBDOMAIN) return SUBDOMAIN;
    if (typeof window !== "undefined") {
        const [sub] = window.location.hostname.split(".");
        return sub || "";
    }
    return "";
}

function moneyAR(n?: number, currency = "ARS") {
    return typeof n === "number"
        ? n.toLocaleString("es-AR", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).replace(/\s/g, "")
        : "";
}

function ActionInlineRouterNF({
    action,
    bookingId,
    serviceId,
    groupMode,
    modality,                // <-- NUEVO
}: {
    action: "cancel" | "reschedule";
    bookingId: string;
    serviceId?: string | null;
    groupMode?: boolean;
    modality?: "presencial" | "virtual";  // <-- NUEVO
}) {
    if (action === "cancel") {
        return <CancelInlineNF bookingId={bookingId} />;
    }
    return (
        <RescheduleInlineNF
            bookingId={bookingId}
            serviceId={serviceId || undefined}
            groupMode={groupMode}
            modality={modality}    // <-- NUEVO
        />
    );
}

/** ==== Cancelar (NF) ==== */
function CancelInlineNF({ bookingId }: { bookingId: string }) {
    const { token } = useAuth();
    const [reason, setReason] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);
    const [done, setDone] = React.useState(false);

    const [loadingInfo, setLoadingInfo] = React.useState(true);
    const [bookingInfo, setBookingInfo] = React.useState<{
        serviceName?: string;
        professionalName?: string | null;
        startISO?: string;
        endISO?: string;
        status?: string;
    } | null>(null);

    const slug = getSlugFromEnvOrHost();
    const canSubmit = !!slug && !!bookingId && !submitting;

    // Cargar datos del booking para mostrar en la card y saber si ya está cancelado
    React.useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoadingInfo(true);
                const url = `${API_BASE}/${slug}/booking/${bookingId}`;
                const res = await fetch(url, { cache: "no-store" });
                const raw = await res.json().catch(() => ({}));
                const payload = getPayload(raw);

                const svcName =
                    payload?.service?.name ||
                    payload?.data?.service?.name ||
                    payload?.booking?.service?.name ||
                    payload?.groupItem?.service?.name ||
                    payload?.group?.service?.name;

                const profName =
                    payload?.professional?.name ||
                    payload?.data?.professional?.name ||
                    payload?.booking?.professional?.name ||
                    payload?.groupItem?.professional?.name;

                const start =
                    payload?.start ||
                    payload?.data?.start ||
                    payload?.booking?.start ||
                    payload?.groupItem?.start;

                const end =
                    payload?.end ||
                    payload?.data?.end ||
                    payload?.booking?.end ||
                    payload?.groupItem?.end;

                const status =
                    payload?.status ||
                    payload?.data?.status ||
                    payload?.booking?.status ||
                    payload?.groupItem?.status ||
                    "";

                if (!ignore) {
                    setBookingInfo({
                        serviceName: svcName,
                        professionalName: profName,
                        startISO: start,
                        endISO: end,
                        status: String(status || "").toLowerCase(),
                    });
                }
            } catch {
                if (!ignore) setBookingInfo(null);
            } finally {
                if (!ignore) setLoadingInfo(false);
            }
        })();
        return () => { ignore = true; };
    }, [slug, bookingId]);

    const onSubmit = async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            setErr(null);
            const url = `${API_BASE}/${slug}/cancel/${bookingId}`;
            const cfg = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
            await axios.post(url, reason ? { reason } : {}, cfg);
            setDone(true);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message || "No se pudo cancelar");
        } finally {
            setSubmitting(false);
        }
    };

    // Si ya está cancelado, no mostramos el formulario
    const alreadyCanceled = (bookingInfo?.status || "").toLowerCase() === "canceled";

    // Mensaje final (éxito) o “ya estaba cancelado”
    if (done || alreadyCanceled) {
        return (
            <div className="min-h-screen pt-[120px] bg-white">
                <div className="max-w-lg mx-auto p-4 space-y-4">
                    {bookingInfo && (
                        <BookingContextCard
                            serviceName={bookingInfo.serviceName}
                            professionalName={bookingInfo.professionalName || undefined}
                            startISO={bookingInfo.startISO}
                            endISO={bookingInfo.endISO}
                        />
                    )}

                    <Card className={alreadyCanceled ? "border-amber-200 bg-amber-50/60" : "border-emerald-200 bg-emerald-50/60"}>
                        <CardContent className="p-6 text-center space-y-2">
                            <div className={`mx-auto w-14 h-14 rounded-2xl grid place-items-center ${alreadyCanceled ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {alreadyCanceled ? "Este turno ya estaba cancelado" : "Turno cancelado"}
                            </h2>
                            <p className="text-sm text-gray-700">
                                {alreadyCanceled ? "No es necesario volver a cancelarlo." : "Tu cancelación se registró correctamente."}
                            </p>
                            <div className="pt-2">
                                <Button asChild className="bg-gradient-to-r from-green-500 to-green-600">
                                    <Link href="/">Volver al inicio</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Formulario (solo si NO está cancelado)
    return (
        <div className="min-h-screen pt-[120px] bg-white">
            <div className="max-w-lg mx-auto p-4 space-y-4">
                {/* Card compacta con contexto del turno */}
                {!loadingInfo && bookingInfo && (
                    <BookingContextCard
                        serviceName={bookingInfo.serviceName}
                        professionalName={bookingInfo.professionalName || undefined}
                        startISO={bookingInfo.startISO}
                        endISO={bookingInfo.endISO}
                    />
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CircleDot className="w-5 h-5 text-rose-600" />
                            Cancelar reservación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Podés agregar una nota para explicar el motivo (opcional).
                        </p>
                        <Textarea
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Motivo de la cancelación (opcional)"
                        />
                        {err && <div className="text-sm text-rose-600">{err}</div>}
                        <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" className="border-2">
                                <Link href="/">Cerrar</Link>
                            </Button>
                            <Button
                                onClick={onSubmit}
                                disabled={!canSubmit}
                                className="bg-rose-600 hover:bg-rose-700"
                            >
                                {submitting ? "Cancelando…" : "Cancelar turno"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- NUEVO: utils locales ---
const fmtFull = (iso?: string) => {
    if (!iso) return "—";
    try {
        return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
        return "—";
    }
};


// --- NUEVO: tarjeta compacta para mostrar en qué booking estoy trabajando ---
function BookingContextCard({
    serviceName,
    professionalName,
    startISO,
    endISO,
}: {
    serviceName?: string;
    professionalName?: string | null;
    startISO?: string;
    endISO?: string;
}) {
    return (
        <Card className="border-green-200/60 bg-green-50/40">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white grid place-items-center border">
                            <CalendarIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">
                                {serviceName || "Reserva"}
                            </div>
                            <div className="text-xs text-slate-600">
                                {professionalName ? `Profesional: ${professionalName}` : "Profesional: —"}
                            </div>
                        </div>
                    </div>
                    <div className="text-right text-xs text-slate-700">
                        <div>Inicio: <span className="font-medium">{fmtFull(startISO)}</span></div>
                        {endISO ? <div>Fin: <span className="font-medium">{fmtFull(endISO)}</span></div> : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/** ==== Reprogramar (NF) ==== */
function RescheduleInlineNF({
    bookingId,
    serviceId: serviceIdProp,
    groupMode,
    modality: modalityProp,  // <-- NUEVO
}: {
    bookingId: string;
    serviceId?: string;
    groupMode?: boolean;
    modality?: "presencial" | "virtual";  // <-- NUEVO
}) {
    const slug = getSlugFromEnvOrHost();

    // ============================================================
    // TODOS LOS HOOKS PRIMERO (antes de cualquier return)
    // ============================================================

    // Por ahora NO se puede cambiar de profesional → arrancamos en Step 3
    const [step, setStep] = React.useState<2 | 3 | 4>(3);

    const [serviceId, setServiceId] = React.useState<string | null>(serviceIdProp ?? null);
    const [needService, setNeedService] = React.useState<boolean>(!serviceIdProp);

    const [professionals, setProfessionals] = React.useState<Professional[]>([]);
    const [loadingProfessionals, setLoadingProfessionals] = React.useState(false);

    // Profesional FIJO proveniente del booking
    const [selectedProfessional, setSelectedProfessional] = React.useState<string>("any");

    // Modalidad: inicializar con la prop o por defecto 'presencial'
    const [selectedModality, setSelectedModality] = React.useState<'presencial' | 'virtual'>(modalityProp || 'presencial');

    const [availableDays, setAvailableDays] = React.useState<string[]>([]);
    const [loadingDays, setLoadingDays] = React.useState(false);
    const [visibleMonth, setVisibleMonth] = React.useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

    const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = React.useState(false);
    const [selectedTime, setSelectedTime] = React.useState<string>("");

    const [submitting, setSubmitting] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);
    const [done, setDone] = React.useState(false);

    const [bookingInfo, setBookingInfo] = React.useState<{
        serviceName?: string;
        professionalName?: string | null;
        professionalId?: string | null;
        startISO?: string;
        endISO?: string;
        status?: string;
    } | null>(null);

    const isDateAvailable = React.useCallback(
        (date: Date) => availableDays.includes(fmtDay(date)),
        [availableDays]
    );

    // Profesionales (solo para nombres; no hay picker)
    const loadProfessionals = React.useCallback(async (sid: string) => {
        if (!sid || !slug) return;
        setLoadingProfessionals(true);
        try {
            const res = await fetch(`${API_BASE}/${slug}/services/${sid}/professionals`, { cache: "no-store" });
            const raw = await res.json().catch(() => ({}));
            const payload = getPayload(raw);
            const list: Professional[] = Array.isArray(payload) ? payload : payload?.items ?? [];
            setProfessionals(list);
        } finally {
            setLoadingProfessionals(false);
        }
    }, [slug]);

    // Días
    const loadAvailableDays = React.useCallback(
        async (sid: string, pid?: string | "any", monthStr?: string) => {
            if (!sid || !slug) return;
            setLoadingDays(true);
            try {
                const params = new URLSearchParams();
                params.set("service", sid);
                params.set("month", monthStr ?? fmtMonth(visibleMonth));
                const effectivePid =
                    (bookingInfo?.professionalId && bookingInfo.professionalId) ||
                    (pid && pid !== "any" ? pid : undefined);
                if (effectivePid) params.set("professional", String(effectivePid));
                // Agregar modalidad
                params.set("modality", selectedModality || 'presencial');
                const res = await fetch(`${API_BASE}/${slug}/available-days?${params.toString()}`, { cache: "no-store" });
                const raw = await res.json().catch(() => ({}));
                const payload = getPayload(raw);
                let dates: any[] = [];
                if (Array.isArray(payload)) dates = payload;
                else if (Array.isArray(payload?.days)) dates = payload.days;
                else if (Array.isArray(payload?.items)) dates = payload.items;
                if (dates.length && typeof dates[0] !== "string") {
                    dates = dates.map((d: any) => d?.date).filter(Boolean);
                }
                setAvailableDays(dates as string[]);
            } finally {
                setLoadingDays(false);
            }
        },
        [slug, visibleMonth, bookingInfo?.professionalId, selectedModality]
    );

    // Horarios
    const loadTimeSlots = React.useCallback(
        async (sid: string, _pid: string | "any" | undefined, date: Date) => {
            const dateStr = fmtDay(date);
            if (!sid || !slug || !availableDays.includes(dateStr)) return;
            setLoadingSlots(true);
            try {
                const params = new URLSearchParams();
                params.set("service", sid);
                params.set("date", dateStr);
                const effectivePid = bookingInfo?.professionalId || (_pid && _pid !== "any" ? _pid : undefined);
                if (effectivePid) params.set("professional", String(effectivePid));
                // Agregar modalidad
                params.set("modality", selectedModality || 'presencial');
                const res = await fetch(`${API_BASE}/${slug}/day-slots?${params.toString()}`, { cache: "no-store" });
                const raw = await res.json().catch(() => ({}));
                const payload = getPayload(raw);
                const slots: string[] = Array.isArray(payload) ? payload : payload?.slots ?? payload?.items ?? [];
                setTimeSlots(slots);
                setSelectedTime("");
            } finally {
                setLoadingSlots(false);
            }
        },
        [slug, availableDays, bookingInfo?.professionalId, selectedModality]
    );

    // bloqueo si está cancelado - useMemo ANTES de useEffect
    const alreadyCanceled = React.useMemo(() => {
        const s = (bookingInfo?.status || "").toLowerCase();
        return ["canceled", "cancelled", "canceled_by_user", "cancelled_by_user"].includes(s);
    }, [bookingInfo?.status]);

    // ============================================================
    // EFFECTS - DESPUÉS DE TODAS LAS DECLARACIONES DE HOOKS
    // ============================================================

    // Si no pasó serviceId, buscamos el booking y fijamos profesional + status
    React.useEffect(() => {
        if (serviceId || !slug || !needService) return;
        let ignore = false;

        (async () => {
            try {
                const url = `${API_BASE}/${slug}/booking/${bookingId}${groupMode ? "?groupMode=true" : ""}`;
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) {
                    if (!ignore) setNeedService(true);
                    return;
                }
                const raw = await res.json().catch(() => ({}));
                const payload = getPayload(raw);

                const sid =
                    payload?.service?._id ||
                    payload?.data?.service?._id ||
                    payload?.booking?.service?._id ||
                    null;

                const svcName =
                    payload?.service?.name ||
                    payload?.data?.service?.name ||
                    payload?.booking?.service?.name ||
                    payload?.groupItem?.service?.name ||
                    payload?.group?.service?.name;

                const profName =
                    payload?.professional?.name ||
                    payload?.data?.professional?.name ||
                    payload?.booking?.professional?.name ||
                    payload?.groupItem?.professional?.name;

                const profId =
                    payload?.professional?._id ||
                    payload?.data?.professional?._id ||
                    payload?.booking?.professional?._id ||
                    payload?.groupItem?.professional?._id ||
                    null;

                const start =
                    payload?.start ||
                    payload?.data?.start ||
                    payload?.booking?.start ||
                    payload?.groupItem?.start;

                const end =
                    payload?.end ||
                    payload?.data?.end ||
                    payload?.booking?.end ||
                    payload?.groupItem?.end;

                const status =
                    payload?.status ||
                    payload?.data?.status ||
                    payload?.booking?.status ||
                    payload?.groupItem?.status ||
                    "";

                setBookingInfo({
                    serviceName: svcName,
                    professionalName: profName,
                    professionalId: profId,
                    startISO: start,
                    endISO: end,
                    status: String(status || "").toLowerCase(),
                });

                if (profId) setSelectedProfessional(String(profId));

                if (!ignore) {
                    if (sid) {
                        setServiceId(String(sid));
                        setNeedService(false);
                    } else {
                        setNeedService(true);
                    }
                }
            } catch {
                if (!ignore) setNeedService(true);
            }
        })();

        return () => {
            ignore = true;
        };
    }, [slug, bookingId, serviceId, needService, groupMode]);

    // Bootstrap cuando ya tengo serviceId
    React.useEffect(() => {
        if (!serviceId) return;
        void loadProfessionals(serviceId);
        void loadAvailableDays(serviceId, bookingInfo?.professionalId || selectedProfessional, fmtMonth(visibleMonth));
    }, [serviceId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ============================================================
    // FUNCIONES REGULARES (NO HOOKS) - DESPUÉS DE TODOS LOS EFFECTS
    // ============================================================

    const reschedulingId = bookingId;

    const submit = async () => {
        if (!serviceId || !selectedDate || !selectedTime || !slug) return;
        // Guard extra: si se canceló en caliente, no permitir
        const status = (bookingInfo?.status || "").toLowerCase();
        const isCanceled = ["canceled", "cancelled", "canceled_by_user", "cancelled_by_user"].includes(status);
        if (isCanceled) return;

        try {
            setSubmitting(true);
            setErr(null);
            const day = fmtDay(selectedDate);
            const hour = selectedTime;
            const professional = bookingInfo?.professionalId ? String(bookingInfo.professionalId) : null;
            const url = `${API_BASE}/${slug}/reschedule/${reschedulingId}`;
            await axios.post(url, { day, hour, professional });
            setDone(true);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message || "No se pudo reprogramar");
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // RENDERIZADO CONDICIONAL - ÚNICO RETURN
    // ============================================================

    // Caso 1: Cargando información del servicio
    if (needService) {
        return (
            <div className="min-h-screen pt-[120px] bg-white">
                <div className="max-w-lg mx-auto p-4">
                    <Card className="border-green-200 bg-green-50/60">
                        <CardContent className="p-6 space-y-2">
                            <h2 className="text-lg font-bold text-gray-900">Cargando la reserva…</h2>
                            <p className="text-sm text-gray-700">Estamos buscando los datos del turno para continuar con la reprogramación.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (alreadyCanceled) {
        return (
            <div className="min-h-screen pt-[120px] bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
                    {bookingInfo && (
                        <BookingContextCard
                            serviceName={bookingInfo.serviceName}
                            professionalName={bookingInfo.professionalName || undefined}
                            startISO={bookingInfo.startISO}
                            endISO={bookingInfo.endISO}
                        />
                    )}
                    <Card className="border-green-200 bg-green-50/60">
                        <CardContent className="p-6 text-center space-y-2">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-green-500 text-white grid place-items-center">
                                <AlertTriangle className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Este turno está cancelado</h2>
                            <p className="text-sm text-gray-700">No es posible reprogramar una reserva cancelada.</p>
                            <div className="pt-2">
                                <Button asChild className="bg-gradient-to-r from-green-500 to-green-600">
                                    <Link href="/">Volver al inicio</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-screen pt-[120px] bg-white">
                <div className="max-w-lg mx-auto p-4">
                    <Card className="border-emerald-200 bg-emerald-50/60">
                        <CardContent className="p-6 text-center space-y-2">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500 text-white grid place-items-center">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Turno reprogramado</h2>
                            <p className="text-sm text-gray-700">Se guardaron tus cambios.</p>
                            <div className="pt-2">
                                <Button asChild className="bg-gradient-to-r from-green-500 to-green-600">
                                    <Link href="/">Volver al inicio</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Flujo normal (sin Step 2)
    return (
        <div className="min-h-screen pt-[120px] bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {bookingInfo && (
                    <div className="max-w-3xl mx-auto mb-6">
                        <BookingContextCard
                            serviceName={bookingInfo.serviceName}
                            professionalName={bookingInfo.professionalName || undefined}
                            startISO={bookingInfo.startISO}
                            endISO={bookingInfo.endISO}
                        />
                    </div>
                )}

                {/* STEP 3: Fecha y horario */}
                {step === 3 && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Elegí fecha y horario</h2>
                            {bookingInfo?.professionalName && (
                                <p className="text-gray-600">
                                    Profesional asignado: <b>{bookingInfo.professionalName}</b>
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <CalendarIcon className="h-5 w-5 mr-2 text-green-500" />
                                        Seleccionar Fecha
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {!loadingDays ? (
                                        <CalendarComponent
                                            mode="single"
                                            month={visibleMonth}
                                            selected={selectedDate}
                                            onMonthChange={(m) => {
                                                setVisibleMonth(m);
                                                setAvailableDays([]); setSelectedDate(undefined); setTimeSlots([]); setSelectedTime("");
                                                void loadAvailableDays(serviceId!, bookingInfo?.professionalId || selectedProfessional, fmtMonth(m));
                                            }}
                                            onSelect={async (date) => {
                                                setSelectedDate(date || undefined);
                                                if (date && isDateAvailable(date)) {
                                                    setTimeSlots([]); setSelectedTime("");
                                                    await loadTimeSlots(serviceId!, bookingInfo?.professionalId || selectedProfessional, date);
                                                } else {
                                                    setTimeSlots([]); setSelectedTime("");
                                                }
                                            }}
                                            disabled={(date) => {
                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                const d = new Date(date); d.setHours(0, 0, 0, 0);
                                                if (d < today) return true;
                                                if (availableDays.length > 0) return !isDateAvailable(date);
                                                return false;
                                            }}
                                            locale={es}
                                            className="rounded-lg border-2 border-green-200 w-full p-3"
                                            classNames={{
                                                months: "w-full",
                                                month: "w-full",
                                                table: "w-full border-collapse",
                                                head_row: "grid grid-cols-7",
                                                row: "grid grid-cols-7 mt-2",
                                                head_cell: "text-center text-muted-foreground text-[0.8rem] py-1",
                                                cell: "p-0 relative w-full",
                                                day:
                                                    "h-10 w-full cursor-pointer p-0 rounded-lg transition-colors " +
                                                    "hover:bg-green-100 hover:text-green-900 " +
                                                    "focus:outline-none focus:ring-2 focus:ring-green-300",
                                                day_selected:
                                                    "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 rounded-lg",
                                                day_today: "bg-green-50 text-green-700 font-semibold rounded-lg",
                                                day_outside: "text-muted-foreground opacity-60",
                                                day_disabled: "opacity-40 cursor-not-allowed pointer-events-none rounded-lg",
                                                day_range_start: "rounded-l-lg",
                                                day_range_end: "rounded-r-lg",
                                                day_range_middle: "rounded-none",
                                            }}
                                        />
                                    ) : (
                                        <Skeleton className="h-[248px] w-full" />
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-green-500" />
                                        Horarios Disponibles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingSlots ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {Array.from({ length: 18 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
                                        </div>
                                    ) : !selectedDate ? (
                                        <p className="text-gray-600">Elegí una fecha para ver los horarios.</p>
                                    ) : !isDateAvailable(selectedDate) ? (
                                        <p className="text-gray-600">Esta fecha no está disponible.</p>
                                    ) : timeSlots.length === 0 ? (
                                        <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-3">
                                            {timeSlots.map((t) => (
                                                <Button
                                                    key={t}
                                                    variant={selectedTime === t ? "default" : "outline"}
                                                    className={`h-12 transition-all ${selectedTime === t
                                                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-0"
                                                        : "border-2 border-green-200 hover:border-green-400 hover:bg-green-50"
                                                        }`}
                                                    onClick={() => setSelectedTime(t)}
                                                >
                                                    {t}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-between">
                            <Button asChild variant="outline" className="border-2">
                                <Link href="/">Cerrar</Link>
                            </Button>
                            <Button
                                disabled={!selectedDate || !selectedTime || !isDateAvailable(selectedDate) || submitting}
                                onClick={submit}
                                className="bg-gradient-to-r from-green-500 to-green-600"
                            >
                                {submitting ? "Reprogramando…" : "Continuar"}
                                <UserPlus className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 4: Confirmar */}
                {step === 4 && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <h3 className="text-xl font-semibold text-slate-900">Confirmar reprogramación</h3>
                        <div className="text-sm text-slate-700 space-y-1">
                            <div><span className="text-slate-500">Fecha:</span> {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "—"}</div>
                            <div><span className="text-slate-500">Hora:</span> {selectedTime || "—"}</div>
                            <div><span className="text-slate-500">Profesional:</span> {bookingInfo?.professionalName || "—"}</div>
                        </div>
                        {err && <div className="text-sm text-rose-600">{err}</div>}
                        <div className="flex justify-between">
                            <Button variant="outline" className="border-2" onClick={() => setStep(3)} disabled={submitting}>
                                Volver
                            </Button>
                            <Button onClick={submit} disabled={submitting || !selectedDate || !selectedTime}>
                                {submitting ? "Reprogramando…" : "Confirmar"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


type SessionGroup = {
    service?: { id?: string; name?: string; totalSessions?: number }
    bookings?: Array<{
        _id: string
        sessionNumber?: number
        status?: "pending" | "confirmed" | "canceled"
        start?: string
        end?: string
        professional?: { _id: string; name: string }
    }>
    summary?: {
        totalSessions: number
        bookedSessions: number
        completedSessions: number
        pendingSessions: number
    }
    nextSession?: {
        number: number
        price: number
        currency: string
        deposit: { required: boolean; amount: number; type: "fixed" | "percent" | null; source: "session" | "service" | "account" }
    }
}

const D = {
    text: "text-[13px] leading-5",
    h2: "text-[13px] font-semibold text-slate-900",
    subtle: "text-[12px] text-slate-500",
    badge: "text-[11px] px-2 py-0.5 rounded",
    row: "flex items-center gap-2",
    icon: "w-3.5 h-3.5",
    panel: "p-3 rounded-md border",
    gap: "gap-2",
}

function fmtShort(dt?: string) {
    if (!dt) return "—"
    try {
        const d = new Date(dt)
        return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(d)
    } catch { return "—" }
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className={`rounded-md border p-2 ${D.text}`}>
            <div className={`${D.row} ${D.subtle}`}>
                {icon} <span>{label}</span>
            </div>
            <div className="mt-1 font-semibold">{value}</div>
        </div>
    )
}

// --- reemplazo de SessionGroupSummary (compacto y consistente) ---
function SessionGroupSummary({ data }: { data: any }) {
    const serviceName = data?.service?.name ?? data?.bookings?.[0]?.service?.name ?? "—"
    const total = data?.summary?.totalSessions ?? data?.service?.totalSessions ?? 0
    const booked = data?.summary?.bookedSessions ?? (data?.bookings?.length ?? 0)
    const completed = data?.summary?.completedSessions ?? 0
    const pending = data?.summary?.pendingSessions ?? Math.max(total - booked, 0)

    const bookingsSorted = [...(data.bookings ?? [])].sort((a, b) => (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0))
    const lastBooked = bookingsSorted.at(-1)
    const next = data?.nextSession

    const H = {
        tiny: "text-[12px] text-slate-500",
        h6: "text-[13px] font-semibold text-slate-900",
        chip: "text-[11px] px-2 py-0.5 rounded",
        icon: "w-3.5 h-3.5",
        row: "flex items-center gap-2",
        panel: "p-3 rounded-xl border",
    } as const

    return (
        <Card className="w-full border-green-200/60">
            <CardContent className="space-y-4">
                {/* próxima sesión */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-slate-100 grid place-items-center">
                            <CalendarIcon className={H.icon} />
                        </div>
                        <div>
                            <div className={H.h6}>Próxima sesión</div>
                            <div className={H.tiny}>{next?.number ? `Sesión ${next.number} de ${total}` : "—"}</div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-2">
                        <div className={H.panel}>
                            <div className={`${H.row} ${H.tiny}`}><CreditCard className={H.icon} /> Precio</div>
                            <div className="mt-1 text-[13px] font-medium">
                                {next ? `${next.currency} ${Number(next.price ?? 0).toLocaleString("es-AR")}` : "—"}
                            </div>
                        </div>

                        <div className={`${H.panel} sm:col-span-2`}>
                            <div className={`${H.row} ${H.tiny}`}><Shield className={H.icon} /> Seña / Depósito</div>
                            {next?.deposit?.required ? (
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge className={`${H.chip} bg-emerald-50 text-emerald-700 border border-emerald-200`}>Requerido</Badge>
                                    <div className="text-[13px]">
                                        {next.deposit.type === "percent"
                                            ? `${next.deposit.amount}%`
                                            : `${next?.currency ?? "ARS"} ${Number(next.deposit.amount).toLocaleString("es-AR")}`}
                                        <span className={`ml-2 ${H.tiny}`}>origen: {next.deposit.source}</span>
                                    </div>
                                </div>
                            ) : (
                                <Badge className={`${H.chip} bg-slate-50 text-slate-700 border`}>No requiere</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const toGCalDateUTC = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function buildGoogleCalendarUrl(opts: {
    title: string;
    startISO: string;
    endISO?: string;
    details?: string;
    location?: string;
}) {
    const start = new Date(opts.startISO);
    const end = opts.endISO
        ? new Date(opts.endISO)
        : new Date(start.getTime() + 30 * 60 * 1000);
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

type Professional = { _id: string; name: string; photo?: { path?: string } };

type DepositType = "FIXED" | "PERCENT";
type RawService = {
    _id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    durationMinutes?: number;
    depositRequired?: boolean;
    depositType?: DepositType;
    depositValue?: number;
    usesGlobalDepositConfig?: boolean;
    category?: { _id: string; name: string } | null;
    popular?: boolean;
    sessionsCount?: number;
    sessionDuration?: number;
    allowPresencial?: boolean;  // 🆕 Soporte de modalidades
    allowVirtual?: boolean;     // 🆕 Soporte de modalidades
};

type DepositCfg = {
    allowOverrideOnService: boolean;
    defaultRequired: boolean;
    defaultType: DepositType;
    defaultValue: number;
    rounding?: { enabled?: boolean; decimals?: number };
};

// 🆕 Helper functions para categorías
function extractUniqueCategories(services: RawService[]) {
    const categoryMap = new Map<string, { _id: string; name: string; servicesCount: number }>();

    services.forEach(service => {
        if (service.category && service.category._id) {
            const existing = categoryMap.get(service.category._id);
            if (existing) {
                existing.servicesCount++;
            } else {
                categoryMap.set(service.category._id, {
                    _id: service.category._id,
                    name: service.category.name,
                    servicesCount: 1,
                });
            }
        }
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function filterServicesByCategory(services: RawService[], categoryId: string | null) {
    if (!categoryId) return services;
    return services.filter(s => s.category?._id === categoryId);
}

const applyDepositPolicy = (list: RawService[], cfg?: DepositCfg) => {
    if (!cfg) return list;
    if (cfg.allowOverrideOnService === false)
        return list.map((s) => ({
            ...s,
            depositRequired: cfg.defaultRequired,
            depositType: cfg.defaultType,
            depositValue: cfg.defaultValue,
        }));
    return list.map((s) =>
        s.usesGlobalDepositConfig
            ? {
                ...s,
                depositRequired: cfg.defaultRequired,
                depositType: cfg.defaultType,
                depositValue: cfg.defaultValue,
            }
            : s
    );
};

type BookingCreated = {
    _id: string;
    status: string;
    service: { name: string; price?: number; currency?: string };
    professional: { name: string } | null;
    start: string;
    end: string;
    client?: { email?: string };
    depositRequired?: boolean;
    depositStatus?: string;
    depositAmount?: number;
    depositValueApplied?: number;
    depositValue?: number;
    depositCurrency?: string;
    depositType?: string;
    depositInitPoint?: string;
    depositSandboxInitPoint?: string;
    depositPreferenceId?: string;
    depositDeadlineAt?: string;
};
type PaymentSummary = {
    totalAmount?: number;
    totalDepositAmount?: number;
    status?: string;
    link?: string;
    initPoint?: string;
    sandboxInitPoint?: string;
    preferenceId?: string;
    deferred?: boolean;
    currency?: string;
    required?: boolean;
    bookingIds?: string[];
};

type NormalizedPayment = {
    amount?: number;
    currency?: string;
    link?: string;
    status?: string;
    preferenceId?: string;
    deferred?: boolean;
    bookingIds?: string[];
    required?: boolean;
    raw?: PaymentSummary | null | undefined;
    legacy?: PaymentSummary | null | undefined;
};

type BookingResponse =
    | {
        success: true;
        bookings: BookingCreated[];
        message: string;
        bulkGroupId?: string;
        bulkPayment?: PaymentSummary;
        payment?: PaymentSummary;
    }
    | {
        success: true;
        booking: BookingCreated;
        message: string;
        bulkGroupId?: string;
        bulkPayment?: PaymentSummary;
        payment?: PaymentSummary;
    }
    | { success: false; message: string };

type Branch = {
    _id: string;
    name: string;
    description?: string;
    default?: boolean;
    active: boolean;
    phone?: string;
    email?: string;
    location?: {
        addressLine?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        lat?: number;
        lng?: number;
    };
};

type PerServiceSelection = {
    serviceId: string;
    branchId?: string;
    professionalId?: string | "any";
    date?: string;
    time?: string;
};

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`;
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string;
const getPayload = (raw: any) => raw?.data ?? raw;
const fmtDay = (date: Date) => format(date, "yyyy-MM-dd");
const fmtMonth = (date: Date) => format(date, "yyyy-MM");

function FloatingNav({
    onBack,
    onNext,
    backDisabled,
    nextDisabled,
    backLabel = "Volver",
    nextLabel = "Continuar",
}: {
    onBack?: () => void
    onNext?: () => void
    backDisabled?: boolean
    nextDisabled?: boolean
    backLabel?: string
    nextLabel?: string
}) {
    const [bottom, setBottom] = React.useState(24)

    React.useEffect(() => {
        const compute = () => {
            const footer = document.querySelector("footer") as HTMLElement | null
            let extra = 0
            if (footer) {
                const r = footer.getBoundingClientRect()
                extra = Math.max(0, window.innerHeight - r.top)
            }
            setBottom(24 + extra)
        }
        compute()
        window.addEventListener("scroll", compute, { passive: true })
        window.addEventListener("resize", compute)
        return () => {
            window.removeEventListener("scroll", compute)
            window.removeEventListener("resize", compute)
        }
    }, [])

    return (
        <div
            className="fixed left-1/2 z-[60] -translate-x-1/2 pointer-events-none"
            style={{ bottom: `calc(${bottom}px + env(safe-area-inset-bottom, 0px))` }}
        >
            <div className="pointer-events-auto rounded-full bg-white/90 backdrop-blur border shadow-lg px-3 py-2 flex gap-2">
                <Button
                    variant="outline"
                    disabled={backDisabled}
                    onClick={onBack}
                    className="border-2 border-gray-300"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {backLabel}
                </Button>
                <Button
                    disabled={nextDisabled}
                    onClick={onNext}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                    {nextLabel}
                </Button>
            </div>
        </div>
    )
}


export default function ReservarPage() {
    const { user } = useAuth();

    const [step, setStep] = useState(1);
    const [gateLoading, setGateLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockMsg, setBlockMsg] = useState<string | null>(null);

    // 🆕 Nuevos pasos iniciales: Obra Social y Categoría
    const [selectedSocialWork, setSelectedSocialWork] = useState<string | null>(null); // null = "Sin obra social"
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [services, setServices] = useState<RawService[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [hasBranchStep, setHasBranchStep] = useState(false);

    const [professionalsByService, setProfessionalsByService] =
        useState<Record<string, Professional[]>>({});
    const [loadingProfessionals, setLoadingProfessionals] = useState(false);
    const [selection, setSelection] = useState<Record<string, PerServiceSelection>>(
        {}
    );
    const [profIdx, setProfIdx] = useState(0);

    // Estado para modalidad (presencial/virtual)
    const [modalityByService, setModalityByService] = useState<Record<string, 'presencial' | 'virtual'>>({});
    // 🆕 Estado para guardar las modalidades disponibles por servicio
    const [availableModalitiesByService, setAvailableModalitiesByService] = useState<Record<string, ('presencial' | 'virtual')[]>>({});
    // Rastrear si el paso 4 (modalidad) fue saltado porque hay una única modalidad
    const [step4WasSkipped, setStep4WasSkipped] = useState(false);

    const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
    const [availableDays, setAvailableDays] = useState<string[]>([]);
    const [loadingDays, setLoadingDays] = useState(false);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [scheduleIdx, setScheduleIdx] = useState(0);
    const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>();
    const [selectedTimeBlock, setSelectedTimeBlock] = useState<string | null>(
        null
    );
    const [brandName, setBrandName] = useState<string>("");
    const [brandLocation, setBrandLocation] = useState<string | undefined>(undefined);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dni, setDni] = useState("");
    const [cuit, setCuit] = useState("");
    const [obraSocial, setObraSocial] = useState("");
    const [notes, setNotes] = useState("");

    // 🏥 Obras sociales disponibles
    const [socialWorks, setSocialWorks] = useState<Array<{ _id: string; name: string }>>([]);
    const [loadingSocialWorks, setLoadingSocialWorks] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [bookingResult, setBookingResult] = useState<BookingResponse | null>(
        null
    );

    const [branchesByService, setBranchesByService] =
        useState<Record<string, Branch[]>>({});

    const [branchIdx, setBranchIdx] = useState(0);

    const [bulkErrors, setBulkErrors] = useState<
        Array<{ index: number; message: string }>
    >([]);
    const [bulkWarns, setBulkWarns] = useState<
        Array<{ index: number; message: string }>
    >([]);

    const prettyBulkError = (idx: number, msg: string) => {
        const srvId = selectedServices[idx];
        const srv = services.find((s) => s._id === srvId);
        const sel = selection[srvId];
        const when = sel?.date && sel?.time ? `${sel.date} • ${sel.time}` : "";
        return `${srv?.name ?? `Ítem #${idx + 1}`} ${when ? `(${when}) ` : ""
            }— ${msg}`;
    };

    function getServiceDuration(serviceId: string): number {
        const s = services.find(x => x._id === serviceId);
        return (s?.durationMinutes ?? s?.sessionDuration ?? 0) || 0;
    }

    function overlaps(startA: number, durA: number, startB: number, durB: number) {
        const endA = startA + durA;
        const endB = startB + durB;
        return startA < endB && startB < endA; // hay cruce si ambos comienzos son menores al fin del otro
    }

    function isSlotOverlappingWithPrevSelections(slot: string): boolean {
        // nunca bloquear en el primer servicio ni si es un único servicio
        if (scheduleIdx === 0 || selectedServices.length <= 1) return false;
        if (!selectedDateObj) return false;

        const currentDur = getServiceDuration(currentServiceId);
        if (!currentDur) return false;

        const slotStart = hhmmToMinutes(slot);
        const sameDayStr = fmtDay(selectedDateObj);

        for (let i = 0; i < scheduleIdx; i++) {
            const sid = selectedServices[i];
            const sel = selection[sid];
            if (!sel?.date || !sel?.time) continue;
            if (sel.date !== sameDayStr) continue;

            const prevDur = getServiceDuration(sid);
            if (!prevDur) continue;

            const prevStart = hhmmToMinutes(sel.time);
            if (overlaps(slotStart, currentDur, prevStart, prevDur)) return true;
        }

        return false;
    }
    const ERROR_MAP: Array<[test: RegExp, nice: string]> = [
        [
            /superpone/i,
            "El cliente ya tiene un turno que se superpone con ese horario",
        ],
        [/dni.*exists|dni.*duplicado/i, "El DNI ya está registrado para otro cliente"],
        [/email.*exists|correo.*registrado/i, "Ese email ya existe"],
        [/no hay profesionales disponibles/i, "No hay profesionales disponibles en ese horario"],
        [/no.*disponible/i, "El turno seleccionado no está disponible"],
    ];

    const normalizeErr = (msg = "Error") => {
        for (const [re, nice] of ERROR_MAP) if (re.test(msg)) return nice;
        return msg;
    };

    const timeSectionRef = useRef<HTMLDivElement | null>(null);
    const scrollToTimes = () => {
        const el = timeSectionRef.current;
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 86;
        window.scrollTo({ top: y, behavior: "smooth" });
    };
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const disableAllDays = !loadingDays && availableDays.length === 0;
    const isPast = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d < today;
    };

    useEffect(() => {
        if (user) {
            console.log('👤 Usuario logueado - datos completos:', user);
            console.log('📋 CUIT:', user.cuit);
            console.log('🏥 Obra Social:', user.obraSocial);

            setFullName(user.name || "");
            setEmail(user.email || "");
            // @ts-ignore
            setPhone(user.phone || "");
            // @ts-ignore
            setDni(user.dni || "");
            // @ts-ignore
            setCuit(user.cuit || "");
            // @ts-ignore - obraSocial puede ser string o { _id, name }
            const obraSocialId = typeof user.obraSocial === 'object' && user.obraSocial?._id
                ? user.obraSocial._id
                : (user.obraSocial || "");
            setObraSocial(String(obraSocialId));
        }
    }, [user]);

    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        phone?: string;
        dni?: string;
        cuit?: string;
    }>({});
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validateField = (
        name: "fullName" | "email" | "phone" | "dni" | "cuit",
        value: string
    ) => {
        let msg = "";
        const v = value?.trim() || "";

        if (name === "fullName" && v.length < 2) msg = "Ingresá un nombre válido";
        if (name === "email" && !emailRe.test(v)) msg = "Ingresá un email válido";

        if (name === "phone") {
            // El <PhoneInput /> te da E.164 (+549...) cuando es válido.
            // Aceptamos válido o posible por tolerancia.
            const ok =
                (v && (isValidPhoneNumber(v) || isPossiblePhoneNumber(v))) ||
                false;
            if (!ok) msg = "Ingresá un teléfono válido";
        }

        if (name === "dni") {
            const digits = v.replace(/\D/g, "");
            if (digits.length < 6) msg = "Ingresá un DNI válido";
        }

        if (name === "cuit") {
            const digits = v.replace(/\D/g, "");
            if (digits.length !== 11) msg = "El CUIT debe tener 11 dígitos";
        }

        setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
        return !msg;
    };
    const validateAll = () =>
        validateField("fullName", fullName) &&
        validateField("email", email) &&
        validateField("phone", phone) &&
        validateField("dni", dni) &&
        validateField("cuit", cuit);

    const resetCalendar = () => {
        setAvailableDays([]);
        setSelectedDateObj(undefined);
        setTimeSlots([]);
        setSelectedTimeBlock(null);
        setVisibleMonth(new Date());
    };

    const goToServices = () => {
        setSelectedServices([]);
        setBranches([]);
        setHasBranchStep(false);
        setProfessionalsByService({});
        setSelection({});
        setProfIdx(0);
        setScheduleIdx(0);
        resetCalendar();
        setStep(1);
        scrollToTop();
    };

    useEffect(() => {
        /* const preflight = async () => {
          setGateLoading(true);
          setLoadingServices(true);
          try {
            const slug =
              SUBDOMAIN ??
              (typeof window !== "undefined"
                ? window.location.hostname.split(".")[0]
                : "");
            const res = await fetch(`${API_BASE}/${slug}/services`, {
              cache: "no-store",
            });
            const raw = await res.json().catch(() => ({}));
            if (raw?.message === "Reservas bloqueadas") {
              setIsBlocked(true);
              setBlockMsg("Reservas bloqueadas");
              setServices([]);
              return;
            }
            const cfg: DepositCfg | undefined = raw?.config?.deposit;
            const payload = getPayload(raw);
            const list: RawService[] = Array.isArray(payload)
              ? payload
              : payload?.items ?? [];
            const listWithDeposit = applyDepositPolicy(list, cfg);
            setServices(listWithDeposit);
            if (listWithDeposit.length === 0)
              toast.error("No hay servicios disponibles en este momento");
          } catch {
            setServices([]);
            toast.error("Error al cargar los servicios");
          } finally {
            setLoadingServices(false);
            setGateLoading(false);
          }
        }; */

        const preflight = async () => {
            setGateLoading(true);
            setLoadingServices(true);
            try {
                const slug =
                    SUBDOMAIN ??
                    (typeof window !== "undefined"
                        ? window.location.hostname.split(".")[0]
                        : "");

                // pedir serviciós, config Y obras sociales en paralelo
                const [servicesRes, cfgRes, socialWorksRes] = await Promise.all([
                    fetch(`${API_BASE}/${slug}/services`, { cache: "no-store" }),
                    fetch(`${API_BASE}/${slug}/config`, { cache: "no-store" }),
                    fetch(`${API_BASE}/${slug}/social-works`, { cache: "no-store" }),
                ]);

                const [servicesRaw, cfgRaw, socialWorksRaw] = await Promise.all([
                    servicesRes.json().catch(() => ({})),
                    cfgRes.json().catch(() => ({})),
                    socialWorksRes.json().catch(() => ({})),
                ]);

                if (
                    servicesRaw?.message === "Reservas bloqueadas" ||
                    cfgRaw?.message === "Reservas bloqueadas"
                ) {
                    setIsBlocked(true);
                    setBlockMsg("Reservas bloqueadas");
                    setServices([]);
                    return;
                }

                // --- branding público desde config (robusto a distintos esquemas)
                const cfg = getPayload(cfgRaw);

                // ojo: publicBranding.brandName es un STRING
                const branding = cfg?.publicBranding ?? {};
                const bn: string =
                    branding.brandName ??
                    cfg?.tenant?.publicBrand?.name ??
                    cfg?.tenant?.name ??
                    SUBDOMAIN ??
                    "Reserva";

                setBrandName(String(bn));

                // ubicación opcional desde publicBranding (toma location.* o campos planos)
                const locParts = [
                    branding.location?.addressLine ?? branding.addressLine ?? branding.address,
                    branding.location?.city ?? branding.city,
                    branding.location?.state ?? branding.state,
                    branding.location?.country ?? branding.country,
                ]
                    .filter(Boolean)
                    .map(String);

                setBrandLocation(locParts.length ? locParts.join(", ") : undefined);

                // --- obras sociales
                const socialWorksPayload = getPayload(socialWorksRaw);
                const socialWorksList: Array<{ _id: string; name: string }> =
                    Array.isArray(socialWorksPayload)
                        ? socialWorksPayload
                        : socialWorksPayload?.items ?? [];
                setSocialWorks(socialWorksList);

                // --- servicios (igual que antes, con política de depósito)
                const depositCfg: DepositCfg | undefined = servicesRaw?.config?.deposit;
                const payload = getPayload(servicesRaw);
                const list: RawService[] = Array.isArray(payload)
                    ? payload
                    : payload?.items ?? [];
                const listWithDeposit = applyDepositPolicy(list, depositCfg);
                setServices(listWithDeposit);
                if (listWithDeposit.length === 0)
                    toast.error("No hay servicios disponibles en este momento");
            } catch {
                setServices([]);
                toast.error("Error al cargar los servicios");
            } finally {
                setLoadingServices(false);
                setGateLoading(false);
            }
        };

        preflight();
    }, []);

    const loadBranchesForServices = async (serviceIds: string[]) => {
        setLoadingBranches(true);
        try {
            const slug =
                SUBDOMAIN ??
                (typeof window !== "undefined"
                    ? window.location.hostname.split(".")[0]
                    : "");

            const promises = serviceIds.map((sid) =>
                fetch(`${API_BASE}/${slug}/services/${sid}/branches`, {
                    cache: "no-store",
                }).then((r) => r.json().catch(() => ({})))
            );
            const raws = await Promise.all(promises);

            if (raws.some((r: any) => r?.message === "Reservas bloqueadas")) {
                setIsBlocked(true);
                setBlockMsg("Reservas bloqueadas");
                return;
            }

            const map: Record<string, Branch[]> = {};
            raws.forEach((raw: any, idx) => {
                const payload = getPayload(raw);
                const list: Branch[] = Array.isArray(payload)
                    ? payload
                    : payload?.data ?? payload?.items ?? [];
                // ordená: default primero
                list.sort(
                    (a, b) => Number(!!b.default) - Number(!!a.default) || a.name.localeCompare(b.name)
                );
                map[serviceIds[idx]] = list;
            });

            setBranchesByService(map);

            // Autoselección si un servicio tiene 1 sola sucursal
            const nextSel = { ...selection };
            serviceIds.forEach((sid) => {
                const list = map[sid] ?? [];
                if (list.length === 1) {
                    nextSel[sid] = {
                        ...(nextSel[sid] || { serviceId: sid }),
                        branchId: list[0]._id,
                        professionalId: nextSel[sid]?.professionalId || "any",
                    };
                }
            });
            setSelection(nextSel);

            // ¿Hay que mostrar paso por sucursal?
            /*       const mustPickBranch =
                    serviceIds.length > 1 || serviceIds.some((sid) => (map[sid]?.length ?? 0) > 1); */

            const mustPickBranch = serviceIds.some((sid) => (map[sid]?.length ?? 0) > 1);

            // ¡Setealo explícitamente SIEMPRE!
            setHasBranchStep(mustPickBranch);

            if (mustPickBranch) {
                setBranchesByService(map);
                setBranchIdx(0);
                setStep(4); // Paso de sucursales (antes era 2, ahora es 4)
                scrollToTop();
            } else {
                // autoselección ya aplicada en nextSel arriba
                setSelection(nextSel);
                setBranchesByService(map);
                setHasBranchStep(false); // redundante pero explícito
                await loadProfessionalsForServices(serviceIds);
                setProfIdx(0);
                setStep(5); // Paso de profesionales (antes era 3, ahora es 5)
                scrollToTop();
            }
        } catch {
            setBranches([]);
            setBranchesByService({});
            toast.error("Error al cargar sucursales");
        } finally {
            setLoadingBranches(false);
        }
    };


    /* const loadProfessionalsForServices = async (
      serviceIds: string[],
      branchId?: string
    ) => {
      setLoadingProfessionals(true);
      try {
        const slug =
          SUBDOMAIN ??
          (typeof window !== "undefined"
            ? window.location.hostname.split(".")[0]
            : "");
        const promises = serviceIds.map((sid) => {
          const url = branchId
            ? `${API_BASE}/${slug}/services/${sid}/branches/${branchId}/professionals`
            : `${API_BASE}/${slug}/services/${sid}/professionals`;
          return fetch(url, { cache: "no-store" }).then((r) =>
            r.json().catch(() => ({}))
          );
        });
        const raws = await Promise.all(promises);
        if (raws.some((r: any) => r?.message === "Reservas bloqueadas")) {
          setIsBlocked(true);
          setBlockMsg("Reservas bloqueadas");
          return;
        }
        const map: Record<string, Professional[]> = {};
        raws.forEach((raw: any, idx) => {
          const payload = getPayload(raw);
          const list: Professional[] = Array.isArray(payload)
            ? payload
            : payload?.items ?? [];
          map[serviceIds[idx]] = list;
        });
        setProfessionalsByService(map);
      } catch {
        setProfessionalsByService({});
        toast.error("Error al cargar profesionales");
      } finally {
        setLoadingProfessionals(false);
      }
    }; */

    useEffect(() => {
        if (step !== 3) return;
        const sid = selectedServices[profIdx];
        if (!sid) return;
        setSelection(prev => {
            const curr = prev[sid] || { serviceId: sid };
            if (!curr.professionalId) {
                return { ...prev, [sid]: { ...curr, professionalId: "any", branchId: curr.branchId } };
            }
            return prev;
        });
    }, [step, profIdx, selectedServices]);

    // 🏥 Cargar obras sociales disponibles
    useEffect(() => {
        const fetchSocialWorks = async () => {
            setLoadingSocialWorks(true);
            try {
                const slug =
                    SUBDOMAIN ??
                    (typeof window !== "undefined"
                        ? window.location.hostname.split(".")[0]
                        : "");

                console.log("Fetching social works for slug:", slug);
                console.log(`${API_BASE}/${slug}/social-works`)
                const res = await fetch(`${API_BASE}/${slug}/social-works`, {
                    cache: "no-store",
                });

                console.log("Response status:", res.status);
                if (!res.ok) throw new Error("Error al cargar obras sociales");

                const data = await res.json();
                console.log("Social works data received:", data);
                const list = data?.data || [];
                console.log("Social works list:", list);
                setSocialWorks(list);
            } catch (error) {
                console.error("Error cargando obras sociales:", error);
                setSocialWorks([]);
            } finally {
                setLoadingSocialWorks(false);
            }
        };

        fetchSocialWorks();
    }, []);

    const loadProfessionalsForServices = async (serviceIds: string[]) => {
        setLoadingProfessionals(true);
        try {
            const slug =
                SUBDOMAIN ??
                (typeof window !== "undefined"
                    ? window.location.hostname.split(".")[0]
                    : "");

            const promises = serviceIds.map((sid) => {
                const branchIdForService = selection[sid]?.branchId;
                const url = branchIdForService
                    ? `${API_BASE}/${slug}/services/${sid}/branches/${branchIdForService}/professionals`
                    : `${API_BASE}/${slug}/services/${sid}/professionals`;

                return fetch(url, { cache: "no-store" })
                    .then((r) => r.json().catch(() => ({})))
                    .then((raw) => ({ sid, raw }));
            });

            const results = await Promise.all(promises);

            if (results.some(({ raw }) => raw?.message === "Reservas bloqueadas")) {
                setIsBlocked(true);
                setBlockMsg("Reservas bloqueadas");
                return;
            }

            const coerceList = (raw: any): any[] => {
                const payload = getPayload(raw);
                if (Array.isArray(payload)) return payload;
                if (Array.isArray(payload?.items)) return payload.items;
                if (Array.isArray(payload?.data)) return payload.data;
                return [];
            };

            const map: Record<string, Professional[]> = {};
            results.forEach(({ sid, raw }) => {
                const list = coerceList(raw);
                map[sid] = list as Professional[];
            });

            setProfessionalsByService(map);
        } catch {
            setProfessionalsByService({});
            toast.error("Error al cargar profesionales");
        } finally {
            setLoadingProfessionals(false);
        }
    };


    const loadAvailableDays = async (
        srvId: string,
        profId?: string | "any",
        monthStr?: string,
        modality?: 'presencial' | 'virtual'
    ) => {
        setLoadingDays(true);
        try {
            const params = new URLSearchParams();
            params.set("service", srvId);
            params.set("month", monthStr ?? fmtMonth(visibleMonth));
            if (profId && profId !== "any") params.set("professional", profId);
            // Agregar modalidad si está presente, sino por defecto 'presencial'
            params.set("modality", modality || modalityByService[srvId] || 'presencial');

            // 🆕 Agregar obra social seleccionada para filtrar días exclusivos
            // Si es null, enviamos "null" como string para indicar "sin obra social"
            params.set("socialWork", selectedSocialWork || "null");

            const slug =
                SUBDOMAIN ??
                (typeof window !== "undefined"
                    ? window.location.hostname.split(".")[0]
                    : "");

            const url = `${API_BASE}/${slug}/available-days?${params.toString()}`;
            console.log('[FRONTEND] 🔍 Llamando available-days:', url);
            console.log('[FRONTEND] 📋 Parámetros:', {
                service: srvId,
                month: monthStr ?? fmtMonth(visibleMonth),
                professional: profId,
                modality: modality || modalityByService[srvId] || 'presencial',
                socialWork: selectedSocialWork || "null"
            });

            const res = await fetch(url, { cache: "no-store" });
            const raw = await res.json().catch(() => ({}));
            if (raw?.message === "Reservas bloqueadas") {
                setIsBlocked(true);
                setBlockMsg("Reservas bloqueadas");
                return;
            }
            const payload = getPayload(raw);
            let dates: any[] = [];
            if (Array.isArray(payload)) dates = payload;
            else if (Array.isArray(payload?.days)) dates = payload.days;
            else if (Array.isArray(payload?.items)) dates = payload.items;
            if (dates.length && typeof dates[0] !== "string")
                dates = dates.map((d: any) => d?.date).filter(Boolean);
            setAvailableDays(dates as string[]);
        } catch {
            setAvailableDays([]);
            toast.error("Error al cargar días");
        } finally {
            setLoadingDays(false);
        }
    };

    const loadTimeSlots = async (
        srvId: string,
        profId: string | "any" | undefined,
        date: Date,
        modality?: 'presencial' | 'virtual'
    ) => {
        const dateStr = fmtDay(date);
        if (!srvId || !availableDays.includes(dateStr)) return;
        setLoadingSlots(true);
        try {
            const params = new URLSearchParams();
            params.set("service", srvId);
            params.set("date", dateStr);
            if (profId && profId !== "any") params.set("professional", profId);
            // Agregar modalidad si está presente, sino por defecto 'presencial'
            params.set("modality", modality || modalityByService[srvId] || 'presencial');
            // 🆕 Agregar obra social si está seleccionada
            if (selectedSocialWork) {
                params.set("socialWork", selectedSocialWork);
            }
            const slug =
                SUBDOMAIN ??
                (typeof window !== "undefined"
                    ? window.location.hostname.split(".")[0]
                    : "");
            const res = await fetch(
                `${API_BASE}/${slug}/day-slots?${params.toString()}`,
                { cache: "no-store" }
            );
            const raw = await res.json().catch(() => ({}));
            if (raw?.message === "Reservas bloqueadas") {
                setIsBlocked(true);
                setBlockMsg("Reservas bloqueadas");
                return;
            }
            const payload = getPayload(raw);
            const slots: string[] = Array.isArray(payload)
                ? payload
                : payload?.slots ?? payload?.items ?? [];
            setTimeSlots(slots);
            setSelectedTimeBlock(null);
        } catch {
            setTimeSlots([]);
            toast.error("Error al cargar horarios");
        } finally {
            setLoadingSlots(false);
        }
    };

    const currentServiceId = selectedServices[scheduleIdx];
    const currentService = services.find((s) => s._id === currentServiceId);
    const currentProfId = selection[currentServiceId]?.professionalId || "any";

    const money = (n?: number, currency = "ARS") =>
        typeof n === "number"
            ? n
                .toLocaleString("es-AR", {
                    style: "currency",
                    currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                })
                .replace(/\s/g, "")
            : "";

    const getDepositDisplay = (booking: BookingCreated) => {
        const rawType = (booking.depositType || "").toString().toLowerCase();
        const currency = booking.depositCurrency || booking.service?.currency || "ARS";
        const rawAmount =
            typeof booking.depositAmount === "number"
                ? booking.depositAmount
                : typeof booking.depositValueApplied === "number"
                    ? booking.depositValueApplied
                    : typeof booking.depositValue === "number"
                        ? booking.depositValue
                        : null;

        if (rawType === "percent" && rawAmount != null) {
            return { label: `${rawAmount}%`, amount: rawAmount, currency, isPercent: true } as const;
        }

        if (rawAmount != null) {
            return { label: money(rawAmount, currency), amount: rawAmount, currency, isPercent: false } as const;
        }

        return { label: null, amount: null, currency, isPercent: rawType === "percent" } as const;
    };

    const formatDepositStatus = (status?: string) => {
        const normalized = (status || "").toLowerCase();
        if (!normalized) return "Pendiente";
        if (["paid", "approved", "completed", "done", "fulfilled"].includes(normalized))
            return "Pagada";
        if (["pending", "waiting_payment", "unpaid", "authorized"].includes(normalized))
            return "Pendiente";
        if (["in_process", "processing"].includes(normalized)) return "En proceso";
        if (["failed", "rejected"].includes(normalized)) return "Rechazada";
        if (["cancelled", "canceled"].includes(normalized)) return "Cancelada";
        return status ?? "Pendiente";
    };

    const handleCopyDepositLink = async (url: string) => {
        if (!url) {
            toast.error("No encontramos un link para copiar");
            return;
        }
        try {
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                toast.success("Link copiado al portapapeles");
                return;
            }
            if (typeof window !== "undefined") {
                const textarea = document.createElement("textarea");
                textarea.value = url;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                const success = document.execCommand("copy");
                document.body.removeChild(textarea);
                if (success) {
                    toast.success("Link copiado al portapapeles");
                    return;
                }
            }
            throw new Error("copy-not-supported");
        } catch {
            toast.error("No pudimos copiar el link. Copialo manualmente.");
        }
    };

    const handleConfirmTimesForCurrent = (date: Date, time: string) => {
        const dateStr = fmtDay(date);
        const next = { ...selection };
        next[currentServiceId] = {
            ...(next[currentServiceId] || { serviceId: currentServiceId }),
            date: dateStr,
            time,
            branchId: next[currentServiceId]?.branchId,
            professionalId: currentProfId,
        };
        setSelection(next);
        setSelectedTimeBlock(time);
    };

    const allTimesChosen = selectedServices.every(
        (sid) => selection[sid]?.date && selection[sid]?.time
    );

    function hhmmToMinutes(h: string) {
        const [hh, mm] = h.split(":").map(Number);
        return hh * 60 + mm;
    }
    function isSlotBlockedByDuration(slot: string): boolean {
        // nunca bloquear en el primer servicio ni si es un único servicio
        if (scheduleIdx === 0 || selectedServices.length <= 1) return false;
        if (!selectedTimeBlock) return false;

        const dur =
            currentService?.durationMinutes ?? currentService?.sessionDuration ?? 0;
        if (!dur) return false;

        const start = hhmmToMinutes(selectedTimeBlock);
        const end = start + dur;
        const t = hhmmToMinutes(slot);
        return t >= start && t < end;
    }
    function getPrevSelection() {
        if (scheduleIdx === 0) return null;
        const prevServiceId = selectedServices[scheduleIdx - 1];
        const prevSel = selection[prevServiceId];
        const prevSrv = services.find((s) => s._id === prevServiceId);
        const prevDur = prevSrv?.durationMinutes ?? prevSrv?.sessionDuration ?? 0;
        if (!prevSel?.date || !prevSel?.time || !prevDur) return null;
        return { prevSel, prevDur };
    }
    function isSlotBlockedByPrevService(slot: string): boolean {
        const prev = getPrevSelection();
        if (!prev || !selectedDateObj) return false;
        const sameDay = prev.prevSel.date === fmtDay(selectedDateObj);
        if (!sameDay) return false;
        const startPrev = hhmmToMinutes(prev.prevSel.time!);
        const endPrev = startPrev + prev.prevDur;
        const t = hhmmToMinutes(slot);
        return t < endPrev;
    }

    const createBooking = async () => {
        if (isBlocked) return;
        if (!validateAll()) {
            toast.error("Revisá los campos resaltados");
            return;
        }

        const hasAnyBooking = (r: any) =>
            !!(r?.booking || (Array.isArray(r?.bookings) && r.bookings.length > 0));
        const getErrors = (r: any) =>
            (Array.isArray(r?.errors) ? r.errors : []).map((e: any) => ({
                index: Number(e.index ?? 0),
                message: String(e.message ?? "Error"),
            }));
        const getBookingCount = (r: any) =>
            Array.isArray(r?.bookings) ? r.bookings.length : r?.booking ? 1 : 0;

        const tz = "America/Argentina/Buenos_Aires";

        const items = selectedServices.map((sid) => {
            const sel = selection[sid]!;
            return {
                service: sid,
                professional:
                    sel.professionalId && sel.professionalId !== "any"
                        ? sel.professionalId
                        : undefined,
                day: sel.date,
                hour: sel.time,
                startISO: `${sel.date}T${sel.time}:00`,
                timezone: tz,
                branch: sel.branchId || undefined,
                indistint: !sel.professionalId || sel.professionalId === "any",
            };
        });

        setSubmitting(true);
        setBookingResult(null);
        setBulkErrors([]);
        setBulkWarns([]);

        try {
            const slug =
                SUBDOMAIN ??
                (typeof window !== "undefined"
                    ? window.location.hostname.split(".")[0]
                    : "");
            const bulkUrl = `${API_BASE}/${slug}/create-booking-bulk`;
            const oneUrl = `${API_BASE}/${slug}/create-booking`;

            const bulkPayload = {
                items,
                timezone: tz,
                client: {
                    name: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    dni: dni.trim(),
                    cuit: cuit.trim(),
                    // 🆕 Usar selectedSocialWork del paso 1 en lugar de obraSocial del formulario
                    obraSocial: selectedSocialWork || undefined,
                },
                notes: notes?.trim() || undefined,
                modality: modalityByService[selectedServices[0]] || 'presencial',
                socialWork: selectedSocialWork || undefined, // 🆕 Pasar obra social como campo separado
            };

            console.log('🔍 [Frontend] Enviando booking BULK con modalidad:', {
                serviceId: selectedServices[0],
                modality: modalityByService[selectedServices[0]],
                fallback: 'presencial',
                finalModality: bulkPayload.modality,
                modalityByService: modalityByService,
                items: items,
            });

            const bulkRes = await fetch(bulkUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bulkPayload),
            });

            if (bulkRes.ok) {
                const payload = await bulkRes.json();
                const errs = getErrors(payload);
                if (!hasAnyBooking(payload)) {
                    setBulkErrors(errs);
                    toast.error(payload?.message || "No se pudo crear ninguna reserva. Revisá los errores.");
                    setStep(7); // Volver al formulario de datos (ahora paso 7)
                    return;
                }
                if (errs.length) setBulkWarns(errs);
                setBookingResult(payload);
                const count = getBookingCount(payload);
                toast.success(count > 1 ? `¡${count} reservas creadas!` : "¡Reserva creada!");
                setStep(9); // Ir a confirmación (ahora paso 9)
                scrollToTop();
                return;
            }

            const created: BookingCreated[] = [];
            for (const it of items) {
                const individualPayload = {
                    ...it,
                    client: {
                        name: fullName.trim(),
                        email: email.trim(),
                        phone: phone.trim(),
                        dni: dni.trim(),
                        cuit: cuit.trim(),
                        obraSocial: obraSocial.trim() || undefined,
                    },
                    notes: notes?.trim() || undefined,
                    modality: modalityByService[selectedServices[0]] || 'presencial',
                    socialWork: selectedSocialWork || undefined, // 🆕 Pasar obra social como campo separado
                };

                console.log('🔍 [Frontend] Enviando booking individual con modalidad:', {
                    serviceId: selectedServices[0],
                    modality: modalityByService[selectedServices[0]],
                    fallback: 'presencial',
                    finalModality: individualPayload.modality,
                    modalityByService: modalityByService,
                });

                const r = await fetch(oneUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(individualPayload),
                });

                if (!r.ok) {
                    const e = await r.json().catch(() => ({}));
                    const msg = getPayload(e)?.message || e?.message || "No se pudo crear la reserva";
                    throw new Error(msg);
                }

                const single = (await r.json()) as { booking: BookingCreated; message: string };
                created.push(single.booking);
            }

            if (created.length === 0) throw new Error("No se pudo crear ninguna reserva");

            setBookingResult({
                success: true,
                bookings: created,
                message: "Reservas creadas",
            } as BookingResponse);

            const count = created.length;
            toast.success(count > 1 ? `¡${count} reservas creadas!` : "¡Reserva creada!");
            setStep(9); // Ir a confirmación (ahora paso 9)
            scrollToTop();
        } catch (e) {
            const msg = (e as Error)?.message || "No se pudo crear la reserva. Probá nuevamente.";
            toast.error(msg);
            setStep(7); // Volver al formulario de datos (ahora paso 7)
        } finally {
            setSubmitting(false);
        }
    };


    const isSingleService = selectedServices.length === 1;

    const resultHasMany =
        Array.isArray((bookingResult as any)?.bookings) &&
        (bookingResult as any).bookings.length > 1;

    const singleBooking: BookingCreated | null =
        (bookingResult as any)?.booking ??
        (Array.isArray((bookingResult as any)?.bookings) &&
            (bookingResult as any).bookings.length === 1
            ? (bookingResult as any).bookings[0]
            : null);

    const bookingsList = useMemo(() => {
        if (!bookingResult) return [] as BookingCreated[];
        if (Array.isArray((bookingResult as any)?.bookings))
            return (bookingResult as any).bookings as BookingCreated[];
        if ((bookingResult as any)?.booking)
            return [(bookingResult as any).booking as BookingCreated];
        return [] as BookingCreated[];
    }, [bookingResult]);

    const bulkGroupId = useMemo(
        () => ((bookingResult as any)?.bulkGroupId ?? undefined) as
            | string
            | undefined,
        [bookingResult]
    );

    const normalizedPayment = useMemo<NormalizedPayment | undefined>(() => {
        if (!bookingResult) return undefined;
        const raw = ((bookingResult as any)?.payment ?? null) as
            | PaymentSummary
            | null;
        const legacy = ((bookingResult as any)?.bulkPayment ?? null) as
            | PaymentSummary
            | null;
        if (!raw && !legacy) return undefined;

        const totalAmount =
            typeof raw?.totalAmount === "number"
                ? raw.totalAmount
                : typeof legacy?.totalDepositAmount === "number"
                    ? legacy.totalDepositAmount
                    : typeof legacy?.totalAmount === "number"
                        ? legacy.totalAmount
                        : undefined;

        const currency =
            raw?.currency ||
            legacy?.currency ||
            bookingsList[0]?.depositCurrency ||
            bookingsList[0]?.service?.currency ||
            "ARS";

        const link =
            raw?.initPoint ||
            raw?.sandboxInitPoint ||
            raw?.link ||
            legacy?.link ||
            legacy?.initPoint ||
            legacy?.sandboxInitPoint ||
            "";

        const status = (legacy?.status || raw?.status || "").toString();
        const required =
            raw?.required ??
            legacy?.required ??
            (!!totalAmount && (!status || status.toLowerCase() !== "paid"));

        return {
            amount: totalAmount,
            currency,
            link: link || undefined,
            status: status || (required ? "pending" : "paid"),
            preferenceId: raw?.preferenceId || legacy?.preferenceId,
            deferred: raw?.deferred ?? legacy?.deferred,
            bookingIds: raw?.bookingIds || legacy?.bookingIds,
            required,
            raw,
            legacy,
        };
    }, [bookingResult, bookingsList]);

    const bookingsWithDeposit = useMemo(
        () =>
            bookingsList.filter(
                (b) =>
                    b.depositRequired ||
                    (typeof b.depositAmount === "number" && b.depositAmount > 0) ||
                    (typeof b.depositValue === "number" && b.depositValue > 0) ||
                    (typeof b.depositValueApplied === "number" &&
                        b.depositValueApplied > 0)
            ),
        [bookingsList]
    );

    const pendingDeposits = useMemo(
        () =>
            bookingsWithDeposit.filter((b) => {
                const status = (b.depositStatus || "").toLowerCase();
                return !["paid", "approved", "completed", "done", "fulfilled"].includes(
                    status
                );
            }),
        [bookingsWithDeposit]
    );

    const paymentStatusNorm = (normalizedPayment?.status || "").toLowerCase();
    const paymentAmount =
        typeof normalizedPayment?.amount === "number"
            ? normalizedPayment.amount
            : null;
    const paymentPaidStatuses = [
        "paid",
        "approved",
        "completed",
        "done",
        "fulfilled",
    ];
    const paymentPending = !!(
        normalizedPayment &&
        (normalizedPayment.required || (paymentAmount ?? 0) > 0) &&
        !paymentPaidStatuses.includes(paymentStatusNorm)
    );

    const hasPendingDeposit = paymentPending || pendingDeposits.length > 0;

    const requiresDeposit = (b: BookingCreated) =>
        b.depositRequired ||
        (typeof b.depositAmount === "number" && b.depositAmount > 0) ||
        (typeof b.depositValue === "number" && b.depositValue > 0) ||
        (typeof b.depositValueApplied === "number" && b.depositValueApplied > 0);

    const isBookingConfirmed = (b: BookingCreated) => {
        if (normalizedPayment) {
            if (paymentPending) return !requiresDeposit(b);
            return true;
        }
        if (!requiresDeposit(b)) return true;
        const st = (b.depositStatus || "").toLowerCase();
        return ["paid", "approved", "completed", "done", "fulfilled"].includes(st);
    };

    // --- Avance automático al elegir profesional

    const goNextAfterProfessional = async () => {

        console.log("🚀 [goNextAfterProfessional] Iniciando...")

        if (profIdx + 1 < selectedServices.length) {
            setProfIdx((i) => i + 1);
        } else {
            // 🔍 Consultar al backend qué modalidades están realmente disponibles
            const firstServiceId = selectedServices[0];
            const service = services.find(s => s._id === firstServiceId);

            if (!service) {
                console.log('⚠️ [goNextAfterProfessional] Servicio no encontrado, yendo a paso 6 (modalidad)');
                setStep(6);
                scrollToTop();
                return;
            }

            try {
                // Consultar al backend las modalidades reales desde CalendarWindows
                const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
                const professionalId = selection[firstServiceId]?.professionalId;
                const branchId = selection[firstServiceId]?.branchId;

                const params = new URLSearchParams();
                params.set("service", firstServiceId);
                if (professionalId && professionalId !== "any") params.set("professional", professionalId);
                if (branchId) params.set("branch", branchId);

                console.log('🔍 Consultando modalidades disponibles al backend...', {
                    serviceId: firstServiceId,
                    serviceName: service.name,
                    professionalId,
                    branchId
                });

                const res = await fetch(`${API_BASE}/${slug}/service-modalities?${params.toString()}`, {
                    cache: "no-store"
                });
                const raw = await res.json().catch(() => ({}));
                const payload = getPayload(raw);

                let availableModalities: ('presencial' | 'virtual')[] = [];

                if (Array.isArray(payload?.modalities) && payload.modalities.length > 0) {
                    availableModalities = payload.modalities;
                    console.log('✅ Modalidades obtenidas del backend:', availableModalities);
                } else {
                    // Fallback: usar allowPresencial/allowVirtual del servicio
                    console.log('⚠️ Backend no retornó modalidades, usando configuración del servicio');
                    const allowsPresencial = service.allowPresencial !== false; // true por defecto
                    const allowsVirtual = service.allowVirtual === true; // false por defecto

                    if (allowsPresencial) availableModalities.push('presencial');
                    if (allowsVirtual) availableModalities.push('virtual');

                    if (availableModalities.length === 0) {
                        availableModalities.push('presencial');
                    }
                }

                console.log('📊 Modalidades finales:', availableModalities);

                // 🔥 Guardar las modalidades disponibles en el estado
                setAvailableModalitiesByService(prev => ({
                    ...prev,
                    [firstServiceId]: availableModalities
                }));

                // ✨ Auto-seleccionar si solo hay una modalidad
                if (availableModalities.length === 1) {
                    const onlyModality = availableModalities[0];
                    setModalityByService(prev => ({
                        ...prev,
                        [firstServiceId]: onlyModality
                    }));
                    console.log('✅ Solo una modalidad disponible, auto-seleccionando:', onlyModality);
                }

                // Ir al paso 6 (modalidad + calendario)
                console.log('📋 Mostrando paso de fecha/hora con modalidad');
                setStep(6);
                scrollToTop();

            } catch (error) {
                console.error('❌ Error consultando modalidades:', error);
                // En caso de error, ir al paso 6 para que el usuario elija
                setStep(6);
                scrollToTop();
            }
        }
    };

    useEffect(() => {
        if (step !== 6 || !currentServiceId) return; // Paso 6 ahora incluye calendario
        const pid = selection[currentServiceId]?.professionalId || "any";
        const modality = modalityByService[currentServiceId] || 'presencial';
        void loadAvailableDays(currentServiceId, pid, undefined, modality);
        // al entrar al paso 6 (calendario + modalidad) o cambiar el profesional del servicio actual,
        // cargamos los días con el valor NUEVO ya aplicado
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, currentServiceId, selection[currentServiceId]?.professionalId, modalityByService[currentServiceId]]);

    useEffect(() => {
        if (step !== 3) return;

        const sid = selectedServices[profIdx];
        if (!sid) return;

        const pros = professionalsByService[sid] || [];
        if (pros.length !== 1) return;

        setSelection((prev: any) => {
            const current = prev[sid] || { serviceId: sid, branchId: prev[sid]?.branchId };
            const onlyId = String(pros[0]._id);
            if (current.professionalId === onlyId) return prev; // ya seleccionado

            return {
                ...prev,
                [sid]: { ...current, professionalId: onlyId },
            };
        });
    }, [step, profIdx, selectedServices, professionalsByService, setSelection]);

    const calendarTitle = (serviceName?: string) => {
        const s = serviceName?.trim() || "Reserva";
        const b = brandName?.trim() || "Reserva";
        return `${s} — ${b}`;
    };

    const calendarDetails = (
        startISO: string,
        serviceName?: string,
        professionalName?: string
    ) => {
        const d = new Date(startISO);
        const dia = format(d, "PPP", { locale: es });
        const hora = format(d, "HH:mm", { locale: es });
        return [
            `Servicio: ${serviceName || "—"}`,
            `Profesional: ${professionalName || "—"}`,
            `Día: ${dia}`,
            `Hora: ${hora}`,
            "Reserva confirmada",
        ].join("\n");
    };


    const calendarLocationFor = (
        branch?: { location?: { addressLine?: string; city?: string; state?: string; country?: string } }
    ) => {
        const parts = branch?.location
            ? [branch.location.addressLine, branch.location.city, branch.location.state, branch.location.country]
                .filter(Boolean)
            : [];
        if (parts.length) return parts.join(", ");
        return brandLocation || ""; // <- usa la ubicación del branding si existe
    };

    const rawSearch = typeof window !== "undefined" ? window.location.search : "";

    const sp = useMemo(() => new URLSearchParams(rawSearch), [rawSearch]);

    // --- Query params para modo NF (enfocado) ---
    const actionFromQS = useMemo(() => (sp.get("action") || sp.get("do") || "").toLowerCase(), [sp]) as
        | "cancel"
        | "reschedule"
        | "";
    const bookingIdFromQS = useMemo(() => sp.get("id") || sp.get("bookingId") || "", [sp]);
    const rescheduleServiceIdQS = useMemo(() => sp.get("serviceId"), [sp]);

    // 👇 NUEVO: parsear groupMode de la URL (?groupMode=true)
    const groupModeQS = useMemo(() => (sp.get("groupMode") || "").toLowerCase() === "true", [sp]);

    // 👇 NUEVO: parsear modality de la URL (?modality=virtual)
    const modalityQS = useMemo(() => {
        const m = (sp.get("modality") || "").toLowerCase();
        return (m === "virtual" ? "virtual" : "presencial") as "presencial" | "virtual";
    }, [sp]);

    const serviceIdFromQS = useMemo(() => sp.get("serviceId"), [sp]);

    const sessionGroupId = useMemo(() => sp.get("sessionGroupId"), [sp]);

    console.log(sessionGroupId)

    const [groupData, setGroupData] = useState<any>(null)
    const [groupLoading, setGroupLoading] = useState(false)
    const [groupError, setGroupError] = useState<string | null>(null)
    const [sgVisibleMonth, setSgVisibleMonth] = useState<Date>(new Date())
    const [sgAvailableDays, setSgAvailableDays] = useState<string[]>([])
    const [sgLoadingDays, setSgLoadingDays] = useState(false)
    const [sgSelectedDate, setSgSelectedDate] = useState<Date | undefined>(undefined)

    const [sgTimeSlots, setSgTimeSlots] = useState<string[]>([])
    const [sgLoadingSlots, setSgLoadingSlots] = useState(false)
    const [sgSelectedTime, setSgSelectedTime] = useState<string | null>(null)
    const [sgSubmitting, setSgSubmitting] = useState(false)
    const [sgSubmittingData, setSgSubmittingData] = useState<any>(null)
    const [sgBookingResult, setSgBookingResult] = useState<BookingCreated | null>(null)

    useEffect(() => {
        // si es flujo de grupo de sesiones, no autoseleccionamos servicios
        if (sessionGroupId) return;

        // esperamos a que termine la carga de servicios
        if (loadingServices) return;
        if (!services?.length) return;

        // nada en la query -> nada que hacer
        if (!serviceIdFromQS) return;

        // admite varios separados por coma, y recorta al máximo permitido (3)
        const ids = serviceIdFromQS
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        const valid = ids.filter(id => services.some(s => s._id === id));
        if (!valid.length) return;

        // si el usuario ya eligió algo, no pisamos su selección
        setSelectedServices(prev => (prev.length ? prev : valid.slice(0, 3)));
    }, [serviceIdFromQS, services, loadingServices, sessionGroupId, setSelectedServices]);

    const loadSgAvailableDays = async (slug: string, groupId: string, monthStr?: string) => {
        setSgLoadingDays(true)
        try {
            const params = new URLSearchParams()
            params.set("month", monthStr ?? fmtMonth(sgVisibleMonth))
            const url = `${API_BASE}/${slug}/session-group/${groupId}/available-days?${params.toString()}`
            const res = await axios.get(url)
            const payload = res.data?.data ?? res.data
            let dates: any[] = Array.isArray(payload) ? payload : (payload?.items ?? payload?.days ?? [])
            if (dates.length && typeof dates[0] !== "string") dates = dates.map((d: any) => d?.date).filter(Boolean)
            setSgAvailableDays(dates as string[])
        } catch {
            setSgAvailableDays([])
        } finally {
            setSgLoadingDays(false)
        }
    }

    const loadSgTimeSlots = async (slug: string, groupId: string, date: Date) => {
        const dateStr = fmtDay(date)
        if (!sgAvailableDays.includes(dateStr)) {
            setSgTimeSlots([])
            return
        }
        setSgLoadingSlots(true)
        try {
            const url = `${API_BASE}/${slug}/session-group/${groupId}/day-slots?date=${dateStr}`
            const res = await axios.get(url)
            const payload = res.data?.data ?? res.data
            const slots: string[] = Array.isArray(payload) ? payload : (payload?.slots ?? payload?.items ?? [])
            setSgTimeSlots(slots)
        } catch {
            setSgTimeSlots([])
        } finally {
            setSgLoadingSlots(false)
        }
    }

    const createBookingForSessionGroup = async () => {
        if (!sessionGroupId || !sgSelectedDate || !sgSelectedTime) return

        const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "")
        const day = fmtDay(sgSelectedDate)
        const hour = sgSelectedTime
        const sessionNumber = groupData?.nextSession?.number

        setSgSubmitting(true)
        try {
            const res = await axios.post(
                `${API_BASE}/${slug}/session-group/${sessionGroupId}/book-next`,
                { sessionGroupId, sessionNumber, day, hour }
            )

            // payload robusto
            const payload = res.data?.data ?? res.data
            const created = payload?.booking || payload?.data?.booking || payload?.booking || null

            // guardamos TAL CUAL
            setSgSubmittingData(res)     // para mensajes y/o payment
            setSgBookingResult(created)  // reserva creada

            toast.success(payload?.message || "¡Reserva creada!")
            // OJO: NO refrescamos nada y NO reseteamos selección
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? err?.message ?? "No se pudo crear la reserva")
            console.log(err)
        } finally {
            setSgSubmitting(false)
        }
    }

    useEffect(() => {
        if (!sessionGroupId) return

        let ignore = false
        const ctrl = new AbortController()

        const slug =
            SUBDOMAIN ??
            (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "")

        const fetchGroup = async () => {
            setGroupLoading(true)
            setGroupError(null)
            try {
                // GET principal (grupo)
                const res = await axios.get(
                    `${API_BASE}/${slug}/session-group/${sessionGroupId}`,
                    { signal: ctrl.signal }
                )
                if (!ignore) setGroupData(res.data?.data ?? res.data)

                // --- DISPARO EN PARALELO (no esperamos) ---
                // No depende del resultado anterior.
                // Si falla, el catch interno de loadSgAvailableDays ya lo maneja.
                void loadSgAvailableDays(slug, sessionGroupId)

                console.log(res)
            } catch (err: any) {
                if (axios.isCancel?.(err)) return
                if (!ignore) setGroupError(err?.response?.data?.message ?? err.message ?? "Error al cargar el grupo")
            } finally {
                if (!ignore) setGroupLoading(false)
            }
        }

        fetchGroup()
        return () => {
            ignore = true
            ctrl.abort()
        }
    }, [sessionGroupId])

    const sgStep6Result = useMemo(() => {
        if (!sgBookingResult) return null;
        const payload = (sgSubmittingData?.data?.data ?? sgSubmittingData?.data) || {};
        return {
            ...payload,
            booking: sgBookingResult,             // asegura shape { booking }
            bookings: payload.bookings,           // si el backend mandó array, lo conservamos
            message:
                payload.message ??
                (sgSubmittingData?.data?.message ?? sgSubmittingData?.data?.data?.message),
        };
    }, [sgBookingResult, sgSubmittingData]);

    // ======== RENDERS CONDICIONALES (después de todos los hooks) ========

    // Modo NF (Narrow Focus): cancelar o reprogramar
    if (bookingIdFromQS && (actionFromQS === "cancel" || actionFromQS === "reschedule")) {
        return (
            <ActionInlineRouterNF
                action={actionFromQS as "cancel" | "reschedule"}
                bookingId={bookingIdFromQS}
                serviceId={rescheduleServiceIdQS}
                groupMode={groupModeQS}
                modality={modalityQS}
            />
        );
    }

    if (sessionGroupId) {
        return (
            <div className="min-h-screen pt-[80px] bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
                    {groupLoading && (
                        <div className="max-w-4xl mx-auto">
                            <Skeleton className="h-6 w-40 mb-3" />
                            <Skeleton className="h-[180px] w-full mb-4" />
                            <Skeleton className="h-[200px] w-full" />
                        </div>
                    )}
                    {groupError && (
                        <Card className="max-w-4xl mx-auto border-rose-200 bg-rose-50/60">
                            <CardContent className="p-4 text-rose-700 text-sm">{groupError}</CardContent>
                        </Card>
                    )}
                    {groupData && !sgStep6Result && <SessionGroupSummary data={groupData as SessionGroup} />}

                    {groupData && !sgStep6Result && (
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Calendario */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <CalendarIcon className="h-5 w-5 mr-2 text-green-500" />
                                        Seleccionar Fecha
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {!sgLoadingDays ? (
                                        <CalendarComponent
                                            mode="single"
                                            selected={sgSelectedDate}
                                            month={sgVisibleMonth}
                                            onMonthChange={async (m) => {
                                                setSgVisibleMonth(m)
                                                // recargamos días para el mes visible
                                                const slug =
                                                    SUBDOMAIN ??
                                                    (typeof window !== "undefined"
                                                        ? window.location.hostname.split(".")[0]
                                                        : "")
                                                await loadSgAvailableDays(slug, sessionGroupId, fmtMonth(m))
                                            }}
                                            onSelect={async (date) => {
                                                setSgSelectedDate(date || undefined)
                                                setSgSelectedTime(null)            // <- limpiar selección de hora
                                                if (!date) { setSgTimeSlots([]); return }
                                                const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "")
                                                await loadSgTimeSlots(slug, sessionGroupId, date)
                                            }}
                                            disabled={(date) => {
                                                // mismos criterios que step 4
                                                const today = new Date()
                                                today.setHours(0, 0, 0, 0)
                                                const d = new Date(date)
                                                d.setHours(0, 0, 0, 0)
                                                if (d < today) return true
                                                if (!sgLoadingDays && sgAvailableDays.length === 0) return true
                                                return !sgAvailableDays.includes(fmtDay(date))
                                            }}
                                            locale={es}
                                            className="rounded-lg border-2 border-green-200 w-full p-3"
                                            classNames={{
                                                months: "w-full",
                                                month: "w-full",
                                                table: "w-full border-collapse",
                                                head_row: "grid grid-cols-7",
                                                row: "grid grid-cols-7 mt-2",
                                                head_cell: "text-center text-muted-foreground text-[0.8rem] py-1",
                                                cell: "p-0 relative w-full",
                                                day:
                                                    "h-10 w-full cursor-pointer p-0 rounded-lg transition-colors " +
                                                    "hover:bg-green-100 hover:text-green-900 " +
                                                    "focus:outline-none focus:ring-2 focus:ring-green-300",
                                                day_selected:
                                                    "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 rounded-lg",
                                                day_today: "bg-green-50 text-green-700 font-semibold rounded-lg",
                                                day_outside: "text-muted-foreground opacity-60",
                                                day_disabled: "opacity-40 cursor-not-allowed pointer-events-none rounded-lg",
                                                day_range_start: "rounded-l-lg",
                                                day_range_end: "rounded-r-lg",
                                                day_range_middle: "rounded-none",
                                            }}
                                        />
                                    ) : (
                                        <Skeleton className="h-[248px] w-full" />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Horarios */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-green-500" />
                                        Horarios Disponibles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {sgLoadingSlots ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {Array.from({ length: 18 }).map((_, i) => (<Skeleton key={i} className="h-9 w-full" />))}
                                        </div>
                                    ) : !sgSelectedDate ? (
                                        <p className="text-gray-600">Elegí una fecha para ver los horarios.</p>
                                    ) : !sgAvailableDays.includes(fmtDay(sgSelectedDate)) ? (
                                        <p className="text-gray-600">Esta fecha no está disponible.</p>
                                    ) : sgTimeSlots.length === 0 ? (
                                        <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-3">
                                            {sgTimeSlots.map((time) => {
                                                const picked = sgSelectedTime === time
                                                return (
                                                    <Button
                                                        key={time}
                                                        variant={picked ? "default" : "outline"}
                                                        className={`h-12 transition-all ${picked
                                                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-0"
                                                            : "border-2 border-green-200 hover:border-green-400 hover:bg-green-50"
                                                            }`}
                                                        onClick={() => setSgSelectedTime(time)}
                                                    >
                                                        {time}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <FloatingNav
                                backDisabled
                                nextDisabled={!sgSelectedDate || !sgSelectedTime || sgSubmitting}
                                nextLabel={sgSubmitting ? "Creando…" : "Continuar"}
                                onNext={createBookingForSessionGroup}
                            />
                        </div>
                    )}

                    {sgStep6Result && (
                        <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                            {(() => {
                                // ====== derivaciones mínimas que usa tu step 6 ======
                                const bookingsList = Array.isArray((sgStep6Result as any).bookings)
                                    ? (sgStep6Result as any).bookings
                                    : [(sgStep6Result as any).booking].filter(Boolean)

                                const resultHasMany = bookingsList.length > 1
                                const singleBooking = resultHasMany ? null : (bookingsList[0] ?? null)

                                const bookingsWithDeposit = bookingsList.filter((b: any) => requiresDeposit(b))

                                const normalizedPayment = (sgStep6Result as any)?.payment
                                    ? {
                                        required: (sgStep6Result as any).payment.required === true,
                                        amount: (sgStep6Result as any).payment.amount ?? null,
                                        currency: (sgStep6Result as any).payment.currency,
                                        link: (sgStep6Result as any).payment.initPoint || (sgStep6Result as any).payment.sandboxInitPoint || "",
                                        status: (sgStep6Result as any).payment.status ?? "pending",
                                    }
                                    : null

                                const paymentAmount = normalizedPayment?.amount ?? null
                                const paymentPending = !!normalizedPayment?.required
                                const hasPendingDeposit = paymentPending || bookingsWithDeposit.length > 0

                                const groupDeadline: Date | null = (() => {
                                    const ds = bookingsWithDeposit
                                        .map((b: any) => b.depositDeadlineAt ? new Date(b.depositDeadlineAt) : null)
                                        .filter((d: any): d is Date => !!d && !Number.isNaN(d.getTime()))
                                        .sort((a: any, b: any) => a.getTime() - b.getTime());
                                    return ds[0] ?? null;
                                })();
                                const groupDeadlineText = groupDeadline ? format(groupDeadline, "PPPp", { locale: es }) : null;

                                // ====== PEGÁ ACÁ TU BLOQUE "step === 6" SIN CAMBIOS DE ESTILO ======
                                //     Sólo asegurate de que las variables referenciadas existan (arriba).
                                //     NO uses 'step === 6', porque ya estamos condicionando con bookingResult.
                                return (
                                    <div className="text-center space-y-8">
                                        {/* --- INICIO: copia literal del step 6 que nos diste --- */}
                                        <div className="text-center space-y-8">
                                            <div className="max-w-2xl mx-auto">
                                                <div className={`rounded-3xl p-4 sm:p-10 border backdrop-blur-sm ${hasPendingDeposit ? "bg-gradient-to-br from-amber-50/60 to-yellow-50/40 border-amber-200" : "bg-gradient-to-br from-emerald-50/60 to-green-50/40 border-green-200"}`}>
                                                    <div className="flex items-center justify-center">
                                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${hasPendingDeposit ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-green-500 to-emerald-600"}`}>
                                                            <CheckCircle className="h-10 w-10 text-white" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ring-1 ring-inset ${hasPendingDeposit ? "bg-amber-100 text-amber-900 ring-amber-200" : "bg-emerald-100 text-emerald-900 ring-emerald-200"}`}>
                                                            {hasPendingDeposit ? "Pendiente" : "Listo"}
                                                        </div>
                                                        <h2 className="text-3xl font-extrabold text-gray-900">
                                                            {hasPendingDeposit
                                                                ? `Reserva${resultHasMany ? "s" : ""} pendiente${resultHasMany ? "s" : ""} de seña`
                                                                : `¡Reserva${resultHasMany ? "s" : ""} confirmada${resultHasMany ? "s" : ""}!`}
                                                        </h2>
                                                        {hasPendingDeposit ? (
                                                            <>
                                                                <p className="text-black text-xl">
                                                                    {resultHasMany
                                                                        ? "Tus reservas quedan pendientes hasta que registremos el pago de la seña requerida."
                                                                        : "Tu reserva queda pendiente hasta que registremos el pago de la seña requerida."}
                                                                </p>
                                                                {groupDeadlineText ? (
                                                                    <p className="text-amber-800 text-sm">Podés pagar hasta el <span className="font-semibold">{groupDeadlineText}</span></p>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            !(!resultHasMany && (bookingResult as any)?.message) && (
                                                                <p className="text-black text-xl">
                                                                    {(bookingResult as any)?.message || "Se creó la reserva"}
                                                                </p>
                                                            )
                                                        )}
                                                    </div>

                                                    {(normalizedPayment && paymentAmount !== null) || bookingsWithDeposit.length > 0 ? (
                                                        <div className="mt-8 space-y-4 rounded-3xl border border-green-200 bg-green-50/60 p-5 text-left">
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-1 rounded-full bg-green-500/10 p-2 text-green-600">
                                                                    <CreditCard className="h-5 w-5" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h3 className="text-lg font-semibold text-green-900">Seña requerida</h3>
                                                                    <p className="text-sm text-green-800">
                                                                        {normalizedPayment ? "Aboná la seña total para confirmar todas tus reservas." : "Aboná la seña para confirmar tu reserva. También te enviamos el link por mail."}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {normalizedPayment && paymentAmount !== null ? (
                                                                <div className="space-y-4">
                                                                    <div className="rounded-2xl border border-green-200 bg-white/80 p-4 space-y-2">
                                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                                            <div className="space-y-1">
                                                                                <div className="text-sm font-semibold text-gray-900">
                                                                                    {bookingsList.filter((b: any) => requiresDeposit(b)).length <= 1
                                                                                        ? "Seña requerida"
                                                                                        : "Seña total requerida"}
                                                                                </div>
                                                                                {/* <div className="text-xs text-gray-600">
                                      Estado:{" "}
                                      <span className={paymentPending ? "text-amber-700 font-semibold" : "text-emerald-600 font-semibold"}>
                                        {formatDepositStatus(normalizedPayment.status)}
                                      </span>
                                      {normalizedPayment.deferred ? (
                                        <span className="ml-2 text-[11px] uppercase tracking-wide text-amber-500">Pago diferido</span>
                                      ) : null}
                                    </div> */}
                                                                            </div>
                                                                            <div className="text-xl font-bold text-green-700">
                                                                                {money(paymentAmount, normalizedPayment.currency || bookingsList[0]?.service?.currency || "ARS")}
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-3 space-y-1 text-xs text-gray-600">
                                                                            {(() => {
                                                                                const depositBookings = bookingsList.filter((b: any) => requiresDeposit(b));
                                                                                const count = depositBookings.length;
                                                                                if (count === 0) return null;
                                                                                return (
                                                                                    <>
                                                                                        <div>Incluye {count} reserva{count === 1 ? "" : "s"}:</div>
                                                                                        <ul className="space-y-1">
                                                                                            {depositBookings.map((booking: any) => {
                                                                                                const depositInfo = getDepositDisplay(booking);
                                                                                                return (
                                                                                                    <li key={booking._id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                                                                        <span className="font-medium text-gray-800">{booking.service?.name}</span>
                                                                                                        {depositInfo.label && (
                                                                                                            <span className="text-green-700 font-semibold">Seña: {depositInfo.label}</span>
                                                                                                        )}
                                                                                                    </li>
                                                                                                );
                                                                                            })}
                                                                                        </ul>
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </div>

                                                                    {paymentPending ? (
                                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                                            <Button
                                                                                disabled={!normalizedPayment.link}
                                                                                className="w-full sm:w-auto h-11 bg-[#00a6ff] hover:bg-[#0096e6] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                                                                                onClick={() => {
                                                                                    if (!normalizedPayment.link) return;
                                                                                    if (typeof window !== "undefined")
                                                                                        window.open(normalizedPayment.link, "_blank", "noopener,noreferrer");
                                                                                }}
                                                                            >
                                                                                <img src="/mercadopago.png" alt="Mercado Pago" className="h-5 w-auto mr-2" />
                                                                                Pagar con Mercado Pago
                                                                            </Button>
                                                                            {normalizedPayment.link ? (
                                                                                <Button
                                                                                    variant="outline"
                                                                                    className="w-full sm:w-auto h-11 border-2 border-green-300 hover:bg-green-50"
                                                                                    onClick={() => handleCopyDepositLink(normalizedPayment.link ?? "")}
                                                                                >
                                                                                    <Copy className="mr-2 h-5 w-5" /> Copiar link
                                                                                </Button>
                                                                            ) : null}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm font-medium text-emerald-700">Seña registrada para todo el grupo. ¡Gracias!</p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {bookingsWithDeposit.map((booking: any) => {
                                                                        const depositInfo = getDepositDisplay(booking);
                                                                        const depositLink = booking.depositInitPoint || booking.depositSandboxInitPoint || "";
                                                                        const normalizedStatus = (booking.depositStatus || "").toLowerCase();
                                                                        const isDepositPaid = ["paid", "approved", "completed", "done", "fulfilled"].includes(normalizedStatus);
                                                                        const statusLabel = formatDepositStatus(booking.depositStatus);
                                                                        const deadlineDate = booking.depositDeadlineAt ? new Date(booking.depositDeadlineAt) : null;
                                                                        const hasValidDeadline = !!(deadlineDate && !Number.isNaN(deadlineDate.getTime()));
                                                                        const deadlineText = hasValidDeadline ? format(deadlineDate as Date, "PPPp", { locale: es }) : null;

                                                                        return (
                                                                            <div key={booking._id} className="rounded-2xl border border-green-200 bg-white/80 p-4 space-y-3">
                                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                                    <div>
                                                                                        <div className="font-semibold text-gray-900">{booking.service?.name}</div>
                                                                                        <div className="text-xs text-gray-600">
                                                                                            Estado de seña:{" "}
                                                                                            <span className={isDepositPaid ? "text-emerald-600 font-semibold" : "text-amber-700 font-semibold"}>
                                                                                                {statusLabel}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    {depositInfo.label && (
                                                                                        <div className="text-base font-bold text-green-700">Seña: {depositInfo.label}</div>
                                                                                    )}
                                                                                </div>
                                                                                {deadlineText ? <p className="text-xs text-gray-500">Pagá antes de {deadlineText}</p> : null}
                                                                                {isDepositPaid ? (
                                                                                    <p className="text-sm font-medium text-emerald-700">Seña registrada. ¡Gracias!</p>
                                                                                ) : depositLink ? (
                                                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                                                        <Button asChild className="w-full sm:w-auto h-11 bg-[#00a6ff] hover:bg-[#0096e6] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                                                                                            <a href={depositLink} target="_blank" rel="noopener noreferrer">
                                                                                                <img src="/mercadopago.png" alt="Mercado Pago" className="h-5 w-auto mr-2" />
                                                                                                Pagar con Mercado Pago
                                                                                            </a>
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            className="w-full sm:w-auto h-11 border-2 border-green-300 hover:bg-green-50"
                                                                                            onClick={() => handleCopyDepositLink(depositLink)}
                                                                                        >
                                                                                            <Copy className="mr-2 h-5 w-5" /> Copiar link
                                                                                        </Button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-xs text-gray-500">No encontramos el link de pago. Contactanos para completar la seña.</p>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    {singleBooking ? (
                                                        <div className="mt-8">
                                                            {(() => {
                                                                const confirmedNoDeposit = !requiresDeposit(singleBooking);

                                                                if (confirmedNoDeposit) {
                                                                    return (
                                                                        <div className="rounded-2xl border p-4 bg-white w-full">
                                                                            <div className="flex flex-col gap-4">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="font-semibold text-base">
                                                                                        {singleBooking.service?.name}
                                                                                    </div>
                                                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                                                                                        Confirmado
                                                                                    </span>
                                                                                </div>

                                                                                <div className="text-sm w-full text-left text-gray-700 space-y-1">
                                                                                    <div>
                                                                                        <strong>Profesional:</strong> {singleBooking.professional?.name || "—"}
                                                                                    </div>
                                                                                    <div>
                                                                                        <strong>Inicio:</strong>{" "}
                                                                                        {format(new Date(singleBooking.start), "PPPp", { locale: es })}
                                                                                    </div>
                                                                                    {typeof (singleBooking as any).sessionDuration === "number" && (
                                                                                        <div>
                                                                                            <strong>Duración:</strong>{" "}
                                                                                            {(singleBooking as any).sessionDuration} minutos
                                                                                        </div>
                                                                                    )}
                                                                                    {typeof (singleBooking as any).price === "number" && (
                                                                                        <div>
                                                                                            <strong>Precio:</strong>{" "}
                                                                                            {(singleBooking as any).price.toLocaleString("es-AR", {
                                                                                                style: "currency",
                                                                                                currency:
                                                                                                    (singleBooking as any).currency ||
                                                                                                    singleBooking.service?.currency ||
                                                                                                    "ARS",
                                                                                            })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex justify-end">
                                                                                    <Button
                                                                                        asChild
                                                                                        variant="outline"
                                                                                        className="h-9 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                        aria-label="Google Calendar"
                                                                                    >
                                                                                        <a
                                                                                            href={buildGoogleCalendarUrl({
                                                                                                title: calendarTitle(singleBooking.service?.name), // <- sin profesional
                                                                                                startISO: singleBooking.start,
                                                                                                endISO: singleBooking.end,
                                                                                                details: calendarDetails(
                                                                                                    singleBooking.start,
                                                                                                    singleBooking.service?.name,
                                                                                                    singleBooking.professional?.name
                                                                                                ),
                                                                                                location: calendarLocationFor(),
                                                                                            })}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                        >
                                                                                            <FcGoogle className="h-4 w-4 mx-auto" />
                                                                                            <span>Agregar al calendario</span>
                                                                                        </a>
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                // Caso no confirmado (requiere seña) -> mantené tu tarjeta compacta + botón de Calendar si aplica
                                                                return (
                                                                    <div>
                                                                        <div className="rounded-2xl border p-4 bg-white w-full flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-5">
                                                                                <div className="font-semibold">{singleBooking.service?.name}</div>
                                                                            </div>
                                                                            <div className="text-sm">
                                                                                {format(new Date(singleBooking.start), "PPP", { locale: es })} •{" "}
                                                                                {format(new Date(singleBooking.start), "HH:mm")}
                                                                            </div>
                                                                        </div>

                                                                        {isBookingConfirmed(singleBooking) && (
                                                                            <div className="mt-3 flex justify-end">
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                asChild
                                                                                                variant="outline"
                                                                                                className="h-10 w-10 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                                aria-label="Google Calendar"
                                                                                            >
                                                                                                <a
                                                                                                    href={buildGoogleCalendarUrl({
                                                                                                        title: calendarTitle(singleBooking.service?.name), // ← sin profesional
                                                                                                        startISO: singleBooking.start,
                                                                                                        endISO: singleBooking.end,
                                                                                                        details: calendarDetails(
                                                                                                            singleBooking.start,
                                                                                                            singleBooking.service?.name,
                                                                                                            singleBooking.professional?.name
                                                                                                        ),
                                                                                                        location: calendarLocationFor(),
                                                                                                    })}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                >
                                                                                                    <FcGoogle className="h-5 w-5 mx-auto" />
                                                                                                </a>
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent side="left" className="text-xs">
                                                                                            Google Calendar
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : Array.isArray((bookingResult as any).bookings) ? (
                                                        <div className="mt-8 grid gap-3">
                                                            {(bookingResult as any).bookings.map((b: any) => {
                                                                const confirmedNoDeposit = !requiresDeposit(b)

                                                                if (confirmedNoDeposit) {
                                                                    return (
                                                                        <div key={b._id} className="rounded-2xl border p-4 bg-white w-full">
                                                                            <div className="flex flex-col gap-4">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="font-semibold text-base">{b.service?.name}</div>
                                                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                                                                                        Confirmado
                                                                                    </span>
                                                                                </div>

                                                                                <div className="text-sm w-full text-left text-gray-700 space-y-1">
                                                                                    <div>
                                                                                        <strong>Profesional:</strong> {b.professional?.name}
                                                                                    </div>
                                                                                    <div>
                                                                                        <strong>Inicio:</strong>{" "}
                                                                                        {format(new Date(b.start), "PPPp", { locale: es })}
                                                                                    </div>
                                                                                    <div>
                                                                                        <strong>Duración:</strong> {b.sessionDuration} minutos
                                                                                    </div>
                                                                                    <div>
                                                                                        <strong>Precio:</strong>{" "}
                                                                                        {b.price.toLocaleString("es-AR", {
                                                                                            style: "currency",
                                                                                            currency: b.currency || "ARS",
                                                                                        })}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex justify-end">
                                                                                    <Button
                                                                                        asChild
                                                                                        variant="outline"
                                                                                        className="h-9 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                        aria-label="Google Calendar"
                                                                                    >
                                                                                        <a
                                                                                            href={buildGoogleCalendarUrl({
                                                                                                title: calendarTitle(b.service?.name), // <- sin profesional
                                                                                                startISO: b.start,
                                                                                                endISO: b.end,
                                                                                                details: calendarDetails(b.start, b.service?.name, b.professional?.name),
                                                                                                location: calendarLocationFor(),
                                                                                            })}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                        >
                                                                                            <FcGoogle className="h-4 w-4 mx-auto" />
                                                                                            <span>Agregar al calendario</span>
                                                                                        </a>
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                }

                                                                // si confirmedNoDeposit es false -> deja todo igual
                                                                return (
                                                                    <div key={b._id} className="rounded-2xl border p-4 bg-white w-full">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="font-semibold">{b.service?.name}</div>
                                                                                {confirmedNoDeposit && (
                                                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                                                                                        Confirmado
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="text-sm">
                                                                                    {format(new Date(b.start), "PPP", { locale: es })} •{" "}
                                                                                    {format(new Date(b.start), "HH:mm")}
                                                                                </div>
                                                                                {isBookingConfirmed(b) && (
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <Button
                                                                                                    asChild
                                                                                                    variant="outline"
                                                                                                    className="h-9 w-9 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                                    aria-label="Google Calendar"
                                                                                                >
                                                                                                    <a
                                                                                                        href={buildGoogleCalendarUrl({
                                                                                                            title: calendarTitle(b.service?.name),
                                                                                                            startISO: b.start,
                                                                                                            endISO: b.end,
                                                                                                            details: calendarDetails(b.start, b.service?.name, b.professional?.name),
                                                                                                            location: calendarLocationFor(),
                                                                                                        })}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                    >
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
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : null}


                                                    {!user && (
                                                        <div className="mt-8 grid gap-6">
                                                            {(() => {
                                                                const first = singleBooking
                                                                    ? singleBooking
                                                                    : Array.isArray((bookingResult as any).bookings)
                                                                        ? (bookingResult as any).bookings[0]
                                                                        : (bookingResult as any).booking;
                                                                return first?.client?.email ? (
                                                                    <div className="pt-2">
                                                                        <>
                                                                            <Button
                                                                                size="lg"
                                                                                disabled={submitting}
                                                                                className="h-14 px-10 hover:opacity-85 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-xl border-0"
                                                                                asChild
                                                                            >
                                                                                <Link href={`/verify-client?email=${encodeURIComponent(first.client.email)}`}><span>Crear cuenta</span></Link>
                                                                            </Button>
                                                                            <p className="mt-2 text-xs text-gray-500">Creá tu cuenta para ver y gestionar tus reservas más rápido.</p>
                                                                        </>
                                                                    </div>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-center gap-3 mt-6">
                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    disabled={submitting}
                                                    className="h-14 px-8 border-2 border-green-300 hover:bg-green-50 bg-white"
                                                    onClick={goToServices}
                                                >
                                                    Nueva reserva
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    disabled={submitting}
                                                    className="h-14 px-10 bg-gradient-to-r from-green-500 to-yellow-600 text-white font-semibold shadow-xl border-0"
                                                    asChild
                                                >
                                                    <Link href="/">Volver al inicio</Link>
                                                </Button>
                                            </div>
                                        </div>
                                        {/* --------------- FIN COPIADO DEL STEP 6 --------------- */}
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                </div>
            </div>
        )
    }

    if (gateLoading)
        return (
            <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 via-white to-amber-50/30">
                <div className="w-full max-w-md space-y-4 text-center">
                    <Skeleton className="h-10 w-40 mx-auto" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-6 w-1/2 mx-auto" />
                </div>
            </div>
        );

    if (isBlocked)
        return (
            <div className="min-h-screen p-3 grid place-items-center bg-gradient-to-br from-gray-50 via-white to-green-50/30">
                <Card className="max-w-md w/full border-green-300/50">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/10 text-green-700 flex items-center justify-center">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {"Reservas no disponibles por el momento"}
                        </h2>
                        <p className="text-gray-600">
                            Estamos ajustando nuestra agenda. En breve volverán a estar habilitadas las reservas en línea.
                        </p>
                        <div className="pt-2">
                            <Button
                                asChild
                                className="w-full bg-gradient-to-r from-green-500 to-green-600"
                            >
                                <Link href="/">Volver al inicio</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="mt-20 pb-[100px] relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-4">
                    <BookingStepper
                        step={step}
                        includeBranchStep={hasBranchStep && step !== 1}
                    />
                </div>

                {/* 🆕 PASO 1: Seleccionar Obra Social */}
                {step === 1 && (
                    <>
                        <div className="text-lefet mt-10 mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Seleccioná tu Obra Social
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Esto nos permitirá mostrarte los días y horarios disponibles según tu cobertura
                            </p>
                        </div>

                        <SocialWorkSelector
                            socialWorks={socialWorks.map(sw => ({
                                _id: sw._id,
                                name: sw.name
                            }))}
                            selectedId={selectedSocialWork}
                            onSelect={(id) => setSelectedSocialWork(id)}
                            loading={loadingSocialWorks}
                        />

                        <FloatingNav
                            backDisabled
                            nextDisabled={selectedSocialWork === undefined}
                            onNext={() => {
                                setStep(2);
                            }}
                        />
                    </>
                )}

                {/* 🆕 PASO 2: Seleccionar Categoría */}
                {step === 2 && (
                    <>
                        <div className="text-left mt-10 mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Seleccioná una Categoría
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Explorá nuestros servicios por categoría
                            </p>
                        </div>

                        <CategorySelector
                            categories={extractUniqueCategories(services)}
                            selectedId={selectedCategory}
                            onSelect={(id) => setSelectedCategory(id)}
                            loading={loadingServices}
                        />

                        <FloatingNav
                            backDisabled={false}
                            onBack={() => setStep(1)}
                            nextDisabled={!selectedCategory}
                            onNext={() => {
                                setStep(3);
                            }}
                        />
                    </>
                )}

                {/* 🆕 PASO 3: Seleccionar Servicio (filtrado por categoría) */}
                {step === 3 && (
                    <>
                        <div className="text-left mt-10 mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Nuestros Servicios
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Elegí y combiná hasta 3 servicios en un solo proceso
                            </p>
                        </div>

                        {loadingServices ? (
                            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow border overflow-hidden">
                                <Skeleton className="h-[760px] w-full" />
                            </div>
                        ) : services.length === 0 ? (
                            <p className="text-center text-gray-600">
                                No hay servicios disponibles.
                            </p>
                        ) : (
                            <>
                                <ServiceList
                                    /* @ts-ignore */
                                    services={filterServicesByCategory(services, selectedCategory)}
                                    selectedIds={selectedServices}
                                    onToggle={(id) => {
                                        setSelectedServices((prev) =>
                                            prev.includes(id)
                                                ? prev.filter((x) => x !== id)
                                                : [...prev, id]
                                        );
                                    }}
                                    maxSelectable={3}
                                />

                                <FloatingNav
                                    backDisabled={false}
                                    onBack={() => {
                                        setSelectedServices([]); // Limpiar servicios seleccionados
                                        setStep(2);
                                    }}
                                    nextDisabled={selectedServices.length === 0 || submitting}
                                    onNext={async () => {
                                        await loadBranchesForServices(selectedServices);
                                    }}
                                />
                            </>
                        )}
                    </>
                )}

                {/* PASO 4: Seleccionar Sucursal (antes era paso 2) */}
                {step === 4 && (
                    <>
                        {(() => {
                            const sid = selectedServices[branchIdx]
                            const srv = services.find(s => s._id === sid)
                            const list = branchesByService[sid] ?? []
                            const selectedBranchId = selection[sid]?.branchId
                            const selectedBranch = list.find(b => b._id === selectedBranchId)

                            return (
                                <>
                                    <div className="text-left mt-10 mb-6">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí la sucursal</h2>
                                        <p className="text-gray-600 text-lg">
                                            Servicio {branchIdx + 1} de {selectedServices.length}: {srv?.name}
                                        </p>
                                    </div>

                                    {loadingBranches ? (
                                        <div className="grid lg:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                {Array.from({ length: 4 }).map((_, i) => (
                                                    <Skeleton key={i} className="h-32 w-full" />
                                                ))}
                                            </div>
                                            <Skeleton className="h-[600px] w-full rounded-xl" />
                                        </div>
                                    ) : list.length === 0 ? (
                                        <Card className="max-w-3xl mx-auto">
                                            <CardContent className="p-6">
                                                <p className="text-gray-600">No hay sucursales para este servicio.</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Lista de sucursales - Izquierda */}
                                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                                {list.map((b) => {
                                                    const selected = selection[sid]?.branchId === b._id
                                                    return (
                                                        <button
                                                            key={b._id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelection((prev) => ({
                                                                    ...prev,
                                                                    [sid]: {
                                                                        ...(prev[sid] || { serviceId: sid }),
                                                                        branchId: b._id,
                                                                        professionalId: prev[sid]?.professionalId || "any",
                                                                    },
                                                                }))
                                                            }}
                                                            className={`text-left w-full rounded-xl border-2 p-4 transition-all ${selected
                                                                ? "border-green-500 bg-green-50/60 shadow-md"
                                                                : "border-gray-200 hover:border-green-300 bg-white hover:shadow-sm"
                                                                }`}
                                                        >
                                                            <div className="space-y-2">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="font-semibold text-gray-900 text-base">{b.name}</div>
                                                                    {b.default && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium whitespace-nowrap">
                                                                            Principal
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                                                    <svg
                                                                        className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                                                                        />
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                                        />
                                                                    </svg>
                                                                    <span className="flex-1">
                                                                        {[b.location?.addressLine, b.location?.city, b.location?.state]
                                                                            .filter(Boolean)
                                                                            .join(", ") || "Dirección no especificada"}
                                                                    </span>
                                                                </div>

                                                                {b.phone && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                        <svg
                                                                            className="w-4 h-4 flex-shrink-0 text-gray-400"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            stroke="currentColor"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                                            />
                                                                        </svg>
                                                                        <span>{b.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            {/* Mapa - Derecha */}
                                            <div className="relative rounded-xl col-span-2 overflow-hidden border-2 border-gray-200 bg-gray-100 h-[600px]">
                                                <BranchMap
                                                    branches={list}
                                                    selectedBranchId={selectedBranchId}
                                                    onBranchSelect={(branchId) => {
                                                        setSelection((prev) => ({
                                                            ...prev,
                                                            [sid]: {
                                                                ...(prev[sid] || { serviceId: sid }),
                                                                branchId,
                                                                professionalId: prev[sid]?.professionalId || "any",
                                                            },
                                                        }))
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <FloatingNav
                                        onBack={() => {
                                            if (branchIdx === 0) setStep(3)
                                            else setBranchIdx((i) => i - 1)
                                            scrollToTop()
                                        }}
                                        onNext={async () => {
                                            if (!selection[sid]?.branchId) return
                                            if (branchIdx + 1 < selectedServices.length) {
                                                setBranchIdx((i) => i + 1)
                                                scrollToTop()
                                            } else {
                                                await loadProfessionalsForServices(selectedServices)
                                                setProfIdx(0)
                                                setStep(5)
                                                scrollToTop()
                                            }
                                        }}
                                        nextDisabled={!selection[sid]?.branchId}
                                        nextLabel={
                                            branchIdx + 1 < selectedServices.length
                                                ? "Siguiente servicio"
                                                : "Continuar"
                                        }
                                    />
                                </>
                            )
                        })()}
                    </>
                )}

                {/* PASO 5: Seleccionar Profesional (antes era paso 3) */}
                {step === 5 && (
                    <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                        {(() => {
                            const srvId = selectedServices[profIdx];
                            const srv = services.find((s) => s._id === srvId);
                            const pros = professionalsByService[srvId] || [];
                            const sel = selection[srvId]?.professionalId || "any";
                            const hasProSelected = !!(selection[srvId]?.professionalId ?? "any");

                            return (
                                <div className="space-y-8">
                                    <div className="text-left mt-10 mb-6">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                            Elegí profesional
                                        </h2>
                                        {!isSingleService && (
                                            <p className="text-gray-600">
                                                Servicio {profIdx + 1} de {selectedServices.length}:{" "}
                                                {srv?.name}
                                            </p>
                                        )}
                                        {isSingleService && (
                                            <p className="text-gray-600">{srv?.name}</p>
                                        )}
                                    </div>

                                    <ProfessionalList
                                        professionals={pros.map((p: any) => ({
                                            _id: String(p._id),
                                            name: p.name,
                                            photo: p.photo ? { path: p.photo.path } : undefined,
                                        }))}
                                        selectedId={sel}                 // ahora puede ser "any"
                                        onSelect={(id: string) => {
                                            setSelection((prev) => ({
                                                ...prev,
                                                [srvId]: {
                                                    ...(prev[srvId] || { serviceId: srvId }),
                                                    professionalId: id,        // id puede ser "any"
                                                    branchId: prev[srvId]?.branchId,
                                                },
                                            }));
                                            goNextAfterProfessional();
                                        }}
                                        backendBaseUrl={process.env.NEXT_PUBLIC_CDN_URL || ""}
                                        includeAny={pros.length > 1}
                                    />

                                    {/* Dejo el FloatingNav para "Volver" si hace falta */}
                                    <FloatingNav
                                        onBack={() => {
                                            if (hasBranchStep && profIdx === 0) setStep(4); // Volver a sucursales (ahora paso 4)
                                            else if (!hasBranchStep && profIdx === 0) setStep(3); // Volver a servicios (ahora paso 3)
                                            else setProfIdx((i) => Math.max(0, i - 1));
                                            scrollToTop();
                                        }}
                                        onNext={() => {
                                            // ✅ Usar la misma lógica que cuando se selecciona desde la lista
                                            goNextAfterProfessional();
                                        }}

                                        backDisabled={submitting}
                                        /*  nextDisabled={submitting || !selection[srvId]?.professionalId} */
                                        nextDisabled={submitting || !hasProSelected}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* PASO 6: Selección de modalidad (presencial/virtual) - antes era paso 4 */}
                {/* PASO 6 y 7 COMBINADOS: Modalidad + Fecha y horario */}
                {step === 6 && currentServiceId && (
                    <>
                        <div className="text-left mt-10 mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Agendar turno
                            </h2>
                            <p className="text-gray-600">
                                {currentService?.name}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Columna Izquierda: Resumen de selección */}
                            <div>
                                <Card className="bg-gradient-to-br from-gray-50 to-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-gray-900">
                                            {(() => {
                                                const profId = selection[currentServiceId]?.professionalId;
                                                if (!profId || profId === 'any') {
                                                    return 'Profesional Indistinto';
                                                }
                                                const prof = professionalsByService[currentServiceId]?.find(p => p._id === profId);
                                                return prof ? prof.name : 'Profesional';
                                            })()}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Obra Social */}
                                        {(() => {
                                            const swId = selectedSocialWork;
                                            const sw = socialWorks.find(s => s._id === swId);
                                            return swId ? (
                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                        <span className="text-lg">🏥</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium">Obra Social</p>
                                                        <p className="font-semibold text-gray-900 truncate">{sw?.name || swId}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                        <span className="text-lg">💳</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium">Modalidad de pago</p>
                                                        <p className="font-semibold text-gray-900">Particular</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Servicio */}
                                        {currentService && (
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                    <span className="text-lg">⚕️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 font-medium">Servicio</p>
                                                    <p className="font-semibold text-gray-900">{currentService.name}</p>
                                                    {(currentService.durationMinutes ?? currentService.sessionDuration) && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Duración: {currentService.durationMinutes ?? currentService.sessionDuration} min
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Sucursal */}
                                        {(() => {
                                            const branchId = selection[currentServiceId]?.branchId;
                                            const branch = branches.find(b => b._id === branchId);
                                            return branch ? (
                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                        <span className="text-lg">📍</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium">Sucursal</p>
                                                        <p className="font-semibold text-gray-900">{branch.name}</p>
                                                        {branch.location?.addressLine && (
                                                            <p className="text-xs text-gray-600 mt-1">{branch.location.addressLine}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()}

                                        {/* Profesional */}
                                        {(() => {
                                            const profId = selection[currentServiceId]?.professionalId;
                                            if (!profId || profId === 'any') return null;
                                            const prof = professionalsByService[currentServiceId]?.find(p => p._id === profId);
                                            return prof ? (
                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                        <span className="text-lg">👤</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium">Profesional</p>
                                                        <p className="font-semibold text-gray-900">{prof.name}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                        <span className="text-lg">👥</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium">Profesional</p>
                                                        <p className="font-semibold text-gray-900">Indistinto</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Columna Derecha: Calendario + Tabs + Horarios */}
                            <div className="space-y-6 col-span-2">
                                {/* Tabs: Presencial / Virtual - Solo mostrar si tiene ambas modalidades */}
                                {(() => {
                                    // 🔥 Usar las modalidades disponibles del estado (ya consultadas del backend)
                                    const availableModalities = availableModalitiesByService[currentServiceId] || [];
                                    const hasBothModalities = availableModalities.includes('presencial') && availableModalities.includes('virtual');
                                    
                                    // 🐛 Debug: mostrar valores
                                    console.log('🔍 [TABS DEBUG]', {
                                        serviceId: currentServiceId,
                                        serviceName: currentService?.name,
                                        availableModalities,
                                        hasBothModalities
                                    });
                                    
                                    if (!hasBothModalities) return null;
                                    
                                    return (
                                        <div className="flex gap-2 justify-start">
                                            <button
                                                type="button"
                                                className={cn(
                                                    "px-8 py-3 font-semibold transition-all rounded-lg border-2",
                                                    modalityByService[currentServiceId] === 'presencial' || !modalityByService[currentServiceId]
                                                        ? "bg-green-500 border-green-500 text-white shadow-md"
                                                        : "border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50"
                                                )}
                                                onClick={async () => {
                                                    setModalityByService(prev => ({ ...prev, [currentServiceId]: 'presencial' }));
                                                    // Recargar días disponibles con nueva modalidad
                                                    setSelectedDateObj(undefined);
                                                    setTimeSlots([]);
                                                    setSelectedTimeBlock(null);
                                                    await loadAvailableDays(currentServiceId, currentProfId, fmtMonth(visibleMonth), 'presencial');
                                                }}
                                            >
                                                📍 Presencial
                                            </button>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "px-8 py-3 font-semibold transition-all rounded-lg border-2",
                                                    modalityByService[currentServiceId] === 'virtual'
                                                        ? "bg-green-500 border-green-500 text-white shadow-md"
                                                        : "border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50"
                                                )}
                                                onClick={async () => {
                                                    setModalityByService(prev => ({ ...prev, [currentServiceId]: 'virtual' }));
                                                    // Recargar días disponibles con nueva modalidad
                                                    setSelectedDateObj(undefined);
                                                    setTimeSlots([]);
                                                    setSelectedTimeBlock(null);
                                                    await loadAvailableDays(currentServiceId, currentProfId, fmtMonth(visibleMonth), 'virtual');
                                                }}
                                            >
                                                💻 Virtual
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* Calendario */}
                                <Card className="py-0">
                                    <CardContent className="p-6">
                                        <div className="w-full">
                                            {!loadingDays ? (
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={selectedDateObj}
                                                    month={visibleMonth}
                                                    onMonthChange={async (m) => {
                                                        setVisibleMonth(m);
                                                        await loadAvailableDays(currentServiceId, currentProfId, fmtMonth(m), modalityByService[currentServiceId]);
                                                    }}
                                                    onSelect={async (date) => {
                                                        setSelectedDateObj(date || undefined);
                                                        if (date && availableDays.includes(fmtDay(date))) {
                                                            setTimeSlots([]);
                                                            setSelectedTimeBlock(null);
                                                            await loadTimeSlots(currentServiceId, currentProfId, date, modalityByService[currentServiceId]);
                                                            scrollToTimes();
                                                        } else {
                                                            setTimeSlots([]);
                                                            setSelectedTimeBlock(null);
                                                        }
                                                    }}
                                                    disabled={(date) => {
                                                        if (loadingDays) return true;
                                                        if (disableAllDays) return true;
                                                        if (isPast(date)) return true;
                                                        return !availableDays.includes(fmtDay(date));
                                                    }}
                                                    locale={es}
                                                    className="rounded-lg border-2 border-green-200 w-full p-3"
                                                    classNames={{
                                                        months: "w-full",
                                                        month: "w-full",
                                                        table: "w-full border-collapse",
                                                        head_row: "grid grid-cols-7",
                                                        row: "grid grid-cols-7 mt-2",
                                                        head_cell: "text-center text-muted-foreground text-[0.8rem] py-1",
                                                        cell: "p-0 relative w-full",
                                                        day: "h-10 w-full cursor-pointer p-0 rounded-lg transition-colors hover:bg-green-100 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-300",
                                                        day_selected: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 rounded-lg",
                                                        day_today: "bg-green-50 text-green-700 font-semibold rounded-lg",
                                                        day_outside: "text-muted-foreground opacity-60",
                                                        day_disabled: "opacity-40 cursor-not-allowed pointer-events-none rounded-lg",
                                                        day_range_start: "rounded-l-lg",
                                                        day_range_end: "rounded-r-lg",
                                                        day_range_middle: "rounded-none",
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full">
                                                    <Skeleton className="h-[248px] w-full" />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Horarios */}
                                <Card className="py-0">
                                    <CardContent className="p-6">
                                        {/* Horarios - Solo mostrar si hay fecha seleccionada */}
                                        {!selectedDateObj ? (
                                            <div className="text-center py-12">
                                                <div className="text-5xl mb-4">📅</div>
                                                <p className="text-gray-600 font-medium">
                                                    Seleccioná una fecha en el calendario
                                                </p>
                                            </div>
                                        ) : loadingSlots ? (
                                            <div className="grid grid-cols-4 gap-3">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <Skeleton key={i} className="h-20 w-full" />
                                                ))}
                                            </div>
                                        ) : !availableDays.includes(fmtDay(selectedDateObj)) ? (
                                            <div className="text-center py-12">
                                                <div className="text-5xl mb-4">❌</div>
                                                <p className="text-gray-600 font-medium">
                                                    Esta fecha no está disponible
                                                </p>
                                            </div>
                                        ) : timeSlots.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="text-5xl mb-4">😔</div>
                                                <p className="text-gray-600 font-medium">
                                                    No hay horarios disponibles para esta fecha
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-4 gap-3 overflow-y-auto pr-2">
                                                {timeSlots.map((time) => {
                                                    const blockedByDur = isSlotBlockedByDuration(time);
                                                    const blockedByPrev = isSlotOverlappingWithPrevSelections(time);
                                                    const picked = selectedTimeBlock === time;
                                                    const blocked = (blockedByDur && !picked) || blockedByPrev;

                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            disabled={blocked}
                                                            className={cn(
                                                                "py-3 px-4 rounded-lg border-2 transition-all duration-200 font-semibold text-base",
                                                                picked
                                                                    ? "bg-green-500 border-green-500 text-white shadow-md"
                                                                    : blocked
                                                                        ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50"
                                                                        : "border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 text-gray-900"
                                                            )}
                                                            onClick={() => {
                                                                if (!selectedDateObj) return;
                                                                handleConfirmTimesForCurrent(selectedDateObj, time);
                                                            }}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <FloatingNav
                            onBack={async () => {
                                if (scheduleIdx === 0) {
                                    // Limpiar selección de fecha/hora al volver
                                    setSelectedDateObj(undefined);
                                    setTimeSlots([]);
                                    setSelectedTimeBlock(null);
                                    setStep(5); // Volver a profesionales
                                    setProfIdx(selectedServices.length - 1);
                                    scrollToTop();
                                    return;
                                }
                                const prevIdx = scheduleIdx - 1;
                                setScheduleIdx(prevIdx);
                                resetCalendar();
                                await loadAvailableDays(
                                    selectedServices[prevIdx],
                                    selection[selectedServices[prevIdx]]?.professionalId || "any",
                                    undefined,
                                    modalityByService[selectedServices[prevIdx]]
                                );
                                scrollToTop();
                            }}
                            onNext={async () => {
                                const nextIdx = scheduleIdx + 1;
                                if (!selection[currentServiceId]?.date || !selection[currentServiceId]?.time) return;

                                // Asegurar que la modalidad esté guardada
                                if (!modalityByService[currentServiceId]) {
                                    setModalityByService(prev => ({ ...prev, [currentServiceId]: 'presencial' }));
                                }

                                if (nextIdx < selectedServices.length) {
                                    setScheduleIdx(nextIdx);
                                    resetCalendar();
                                    await loadAvailableDays(
                                        selectedServices[nextIdx],
                                        selection[selectedServices[nextIdx]]?.professionalId || "any"
                                    );
                                    scrollToTop();
                                } else {
                                    setStep(7); // Ir a datos del cliente
                                    scrollToTop();
                                }
                            }}
                            backDisabled={submitting}
                            nextDisabled={
                                submitting ||
                                !selection[currentServiceId]?.date ||
                                !selection[currentServiceId]?.time
                            }
                        />
                    </>
                )}

                {/* PASO 7: Datos del cliente - antes era paso 6 y luego paso 8 */}
                {step === 7 && (
                    <>
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Tus datos de contacto
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Completá la información para confirmar
                            </p>
                        </div>

                        {bulkErrors.length > 0 && (
                            <div className="max-w-3xl mx-auto mb-4 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800">
                                <div className="font-semibold mb-2">
                                    No se pudieron crear las reservas:
                                </div>
                                <ul className="list-disc pl-5 space-y-1">
                                    {bulkErrors.map((e, idx) => (
                                        <li key={`${e.index}-${idx}`}>
                                            {prettyBulkError(e.index, e.message)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {(() => {
                            const isBulk =
                                Array.isArray(selectedServices) && selectedServices.length > 1;
                            const nounTitle = isBulk ? "Reservas" : "Reserva";
                            const nounProgress = isBulk ? "tus reservas" : "tu reserva";

                            return (
                                <Card className="relative">
                                    {submitting && (
                                        <div className="bg-white/70 flex items-center justify-center rounded-xl absolute w-full h-full top-0 left-0 z-10">
                                            Creando {nounProgress}...
                                        </div>
                                    )}
                                    <CardContent className="space-y-6">
                                        {/* 🔥 ya NO se deshabilita por tener user */}
                                        <fieldset
                                            disabled={submitting}
                                            className={submitting ? "opacity-60 pointer-events-none select-none" : ""}
                                        >
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Nombre completo
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.fullName ? "border-red-500" : "border-gray-200"
                                                        }`}
                                                    placeholder="Tu nombre y apellido"
                                                    value={fullName}
                                                    onChange={(e) => {
                                                        setFullName(e.target.value);
                                                        if (errors.fullName) validateField("fullName", e.target.value);
                                                    }}
                                                    onBlur={(e) => validateField("fullName", e.target.value)}
                                                    aria-invalid={!!errors.fullName}
                                                />
                                                {errors.fullName && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                                                )}
                                            </div>

                                            <div className="mt-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.email ? "border-red-500" : "border-gray-200"
                                                        }`}
                                                    placeholder="tu@email.com"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        if (errors.email) validateField("email", e.target.value);
                                                    }}
                                                    onBlur={(e) => validateField("email", e.target.value)}
                                                    aria-invalid={!!errors.email}
                                                />
                                                {errors.email && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                                )}
                                            </div>

                                            <div className="mt-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Teléfono
                                                </label>

                                                <div className="w-full">
                                                    {/* 👇 Autodetecta país si el número empieza con +; si no, usa AR */}
                                                    <PhoneInput
                                                        defaultCountry="AR"
                                                        international
                                                        placeholder="Ej: +54 9 11 1234-5678"
                                                        value={phone}
                                                        onChange={(val) => {
                                                            const v = (val as string) || "";
                                                            setPhone(v);
                                                            if (errors.phone) validateField("phone", v);
                                                        }}
                                                        onBlur={() => validateField("phone", phone)}
                                                        className={cn("h-8")}
                                                    />
                                                </div>

                                                {errors.phone && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                                )}
                                            </div>

                                            <div className="mt-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    DNI
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.dni ? "border-red-500" : "border-gray-200"
                                                        }`}
                                                    placeholder="Tu DNI"
                                                    value={dni}
                                                    onChange={(e) => {
                                                        setDni(e.target.value);
                                                        if (errors.dni) validateField("dni", e.target.value);
                                                    }}
                                                    onBlur={(e) => validateField("dni", e.target.value)}
                                                    aria-invalid={!!errors.dni}
                                                />
                                                {errors.dni && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.dni}</p>
                                                )}
                                            </div>

                                            <div className="mt-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    CUIT <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.cuit ? "border-red-500" : "border-gray-200"
                                                        }`}
                                                    placeholder="20-12345678-9"
                                                    value={cuit}
                                                    onChange={(e) => {
                                                        setCuit(e.target.value);
                                                        if (errors.cuit) validateField("cuit", e.target.value);
                                                    }}
                                                    onBlur={(e) => validateField("cuit", e.target.value)}
                                                    aria-invalid={!!errors.cuit}
                                                />
                                                {errors.cuit && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.cuit}</p>
                                                )}
                                            </div>

                                            {/* 🚫 Ya NO mostramos el select de obra social porque se eligió en el paso 1 */}
                                            {/* Se usará selectedSocialWork automáticamente al crear la reserva */}

                                            <div className="mt-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Comentarios (opcional)
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl"
                                                    placeholder="¿Alguna consulta o requerimiento especial?"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                />
                                            </div>
                                        </fieldset>
                                    </CardContent>

                                    <FloatingNav
                                        onBack={() => setStep(6)} // Volver a fecha/hora (ahora paso 6)
                                        onNext={createBooking}
                                        backDisabled={submitting}
                                        nextDisabled={
                                            submitting ||
                                            !allTimesChosen ||
                                            !fullName.trim() ||
                                            !email.trim() ||
                                            !phone.trim() ||
                                            !dni.trim() ||
                                            !cuit.trim() ||
                                            !!errors.fullName ||
                                            !!errors.email ||
                                            !!errors.phone ||
                                            !!errors.dni ||
                                            !!errors.cuit
                                        }
                                        nextLabel={submitting ? "Creando…" : `Confirmar ${nounTitle}`}
                                    />
                                </Card>
                            );
                        })()}
                    </>
                )}

                {/* PASO 9: Confirmación - antes era paso 7 */}
                {step === 9 && bookingResult && (
                    <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                        {(() => {
                            const groupDeadline: Date | null = (() => {
                                const ds = bookingsWithDeposit
                                    .map(b => b.depositDeadlineAt ? new Date(b.depositDeadlineAt) : null)
                                    .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
                                    .sort((a, b) => a.getTime() - b.getTime());
                                return ds[0] ?? null;
                            })();
                            const groupDeadlineText = groupDeadline ? format(groupDeadline, "PPPp", { locale: es }) : null;

                            return (
                                <div className="text-center space-y-8">
                                    <div className="max-w-2xl mx-auto">
                                        <div className={`rounded-3xl p-4 sm:p-10 border backdrop-blur-sm ${hasPendingDeposit ? "bg-gradient-to-br from-amber-50/60 to-yellow-50/40 border-amber-200" : "bg-gradient-to-br from-emerald-50/60 to-green-50/40 border-green-200"}`}>
                                            <div className="flex items-center justify-center">
                                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${hasPendingDeposit ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-green-500 to-emerald-600"}`}>
                                                    <CheckCircle className="h-10 w-10 text-white" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ring-1 ring-inset ${hasPendingDeposit ? "bg-amber-100 text-amber-900 ring-amber-200" : "bg-emerald-100 text-emerald-900 ring-emerald-200"}`}>
                                                    {hasPendingDeposit ? "Pendiente" : "Listo"}
                                                </div>
                                                <h2 className="text-3xl font-extrabold text-gray-900">
                                                    {hasPendingDeposit
                                                        ? `Reserva${resultHasMany ? "s" : ""} pendiente${resultHasMany ? "s" : ""} de seña`
                                                        : `¡Reserva${resultHasMany ? "s" : ""} confirmada${resultHasMany ? "s" : ""}!`}
                                                </h2>
                                                {hasPendingDeposit ? (
                                                    <>
                                                        <p className="text-black text-xl">
                                                            {resultHasMany
                                                                ? "Tus reservas quedan pendientes hasta que registremos el pago de la seña requerida."
                                                                : "Tu reserva queda pendiente hasta que registremos el pago de la seña requerida."}
                                                        </p>
                                                        {groupDeadlineText ? (
                                                            <p className="text-amber-800 text-sm">Podés pagar hasta el <span className="font-semibold">{groupDeadlineText}</span></p>
                                                        ) : null}
                                                    </>
                                                ) : (
                                                    !(!resultHasMany && (bookingResult as any)?.message) && (
                                                        <p className="text-black text-xl">
                                                            {(bookingResult as any)?.message || "Se creó la reserva"}
                                                        </p>
                                                    )
                                                )}
                                            </div>

                                            {(normalizedPayment && paymentAmount !== null) || bookingsWithDeposit.length > 0 ? (
                                                <div className="mt-8 space-y-4 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 text-left">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 rounded-full bg-amber-500/10 p-2 text-amber-600">
                                                            <CreditCard className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="text-lg font-semibold text-amber-900">Seña requerida</h3>
                                                            <p className="text-sm text-amber-800">
                                                                {normalizedPayment ? "Aboná la seña total para confirmar todas tus reservas." : "Aboná la seña para confirmar tu reserva. También te enviamos el link por mail."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {normalizedPayment && paymentAmount !== null ? (
                                                        <div className="space-y-4">
                                                            <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 space-y-2">
                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <div className="space-y-1">
                                                                        <div className="text-sm font-semibold text-gray-900">
                                                                            {bookingsList.filter((b) => requiresDeposit(b)).length <= 1
                                                                                ? "Seña requerida"
                                                                                : "Seña total requerida"}
                                                                        </div>
                                                                        {/* <div className="text-xs text-gray-600">
                                      Estado:{" "}
                                      <span className={paymentPending ? "text-amber-700 font-semibold" : "text-emerald-600 font-semibold"}>
                                        {formatDepositStatus(normalizedPayment.status)}
                                      </span>
                                      {normalizedPayment.deferred ? (
                                        <span className="ml-2 text-[11px] uppercase tracking-wide text-amber-500">Pago diferido</span>
                                      ) : null}
                                    </div> */}
                                                                    </div>
                                                                    <div className="text-xl font-bold text-amber-700">
                                                                        {money(paymentAmount, normalizedPayment.currency || bookingsList[0]?.service?.currency || "ARS")}
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3 space-y-1 text-xs text-gray-600">
                                                                    {(() => {
                                                                        const depositBookings = bookingsList.filter(b => requiresDeposit(b));
                                                                        const count = depositBookings.length;
                                                                        if (count === 0) return null;
                                                                        return (
                                                                            <>
                                                                                <div>Incluye {count} reserva{count === 1 ? "" : "s"}:</div>
                                                                                <ul className="space-y-1">
                                                                                    {depositBookings.map(booking => {
                                                                                        const depositInfo = getDepositDisplay(booking);
                                                                                        return (
                                                                                            <li key={booking._id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                                                                <span className="font-medium text-gray-800">{booking.service?.name}</span>
                                                                                                {depositInfo.label && (
                                                                                                    <span className="text-amber-700 font-semibold">Seña: {depositInfo.label}</span>
                                                                                                )}
                                                                                            </li>
                                                                                        );
                                                                                    })}
                                                                                </ul>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>

                                                            {paymentPending ? (
                                                                <div className="flex flex-col sm:flex-row gap-2">
                                                                    <Button
                                                                        disabled={!normalizedPayment.link}
                                                                        className="w-full sm:w-auto h-11 bg-[#00a6ff] hover:bg-[#0096e6] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                                                                        onClick={() => {
                                                                            if (!normalizedPayment.link) return;
                                                                            if (typeof window !== "undefined")
                                                                                window.open(normalizedPayment.link, "_blank", "noopener,noreferrer");
                                                                        }}
                                                                    >
                                                                        <img src="/mercadopago.png" alt="Mercado Pago" className="h-5 w-auto mr-2" />
                                                                        Pagar con Mercado Pago
                                                                    </Button>
                                                                    {normalizedPayment.link ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full sm:w-auto h-11 border-2 border-green-300 hover:bg-green-50"
                                                                            onClick={() => handleCopyDepositLink(normalizedPayment.link ?? "")}
                                                                        >
                                                                            <Copy className="mr-2 h-5 w-5" /> Copiar link
                                                                        </Button>
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm font-medium text-emerald-700">Seña registrada para todo el grupo. ¡Gracias!</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {bookingsWithDeposit.map(booking => {
                                                                const depositInfo = getDepositDisplay(booking);
                                                                const depositLink = booking.depositInitPoint || booking.depositSandboxInitPoint || "";
                                                                const normalizedStatus = (booking.depositStatus || "").toLowerCase();
                                                                const isDepositPaid = ["paid", "approved", "completed", "done", "fulfilled"].includes(normalizedStatus);
                                                                const statusLabel = formatDepositStatus(booking.depositStatus);
                                                                const deadlineDate = booking.depositDeadlineAt ? new Date(booking.depositDeadlineAt) : null;
                                                                const hasValidDeadline = !!(deadlineDate && !Number.isNaN(deadlineDate.getTime()));
                                                                const deadlineText = hasValidDeadline ? format(deadlineDate as Date, "PPPp", { locale: es }) : null;

                                                                return (
                                                                    <div key={booking._id} className="rounded-2xl border border-amber-200 bg-white/80 p-4 space-y-3">
                                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                                            <div>
                                                                                <div className="font-semibold text-gray-900">{booking.service?.name}</div>
                                                                                <div className="text-xs text-gray-600">
                                                                                    Estado de seña:{" "}
                                                                                    <span className={isDepositPaid ? "text-emerald-600 font-semibold" : "text-amber-700 font-semibold"}>
                                                                                        {statusLabel}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {depositInfo.label && (
                                                                                <div className="text-base font-bold text-amber-700">Seña: {depositInfo.label}</div>
                                                                            )}
                                                                        </div>
                                                                        {deadlineText ? <p className="text-xs text-gray-500">Pagá antes de {deadlineText}</p> : null}
                                                                        {isDepositPaid ? (
                                                                            <p className="text-sm font-medium text-emerald-700">Seña registrada. ¡Gracias!</p>
                                                                        ) : depositLink ? (
                                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                                <Button asChild className="w-full sm:w-auto h-11 bg-[#00a6ff] hover:bg-[#0096e6] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                                                                                    <a href={depositLink} target="_blank" rel="noopener noreferrer">
                                                                                        <img src="/mercadopago.png" alt="Mercado Pago" className="h-5 w-auto mr-2" />
                                                                                        Pagar con Mercado Pago
                                                                                    </a>
                                                                                </Button>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    className="w-full sm:w-auto h-11 border-2 border-green-300 hover:bg-green-50"
                                                                                    onClick={() => handleCopyDepositLink(depositLink)}
                                                                                >
                                                                                    <Copy className="mr-2 h-5 w-5" /> Copiar link
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-gray-500">No encontramos el link de pago. Contactanos para completar la seña.</p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            {singleBooking ? (
                                                <div className="mt-8">
                                                    {(() => {
                                                        const confirmedNoDeposit = !requiresDeposit(singleBooking);

                                                        if (confirmedNoDeposit) {
                                                            return (
                                                                <div className="rounded-2xl border p-4 bg-white w-full">
                                                                    <div className="flex flex-col gap-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="font-semibold text-base">
                                                                                {singleBooking.service?.name}
                                                                            </div>
                                                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                                                                                Confirmado
                                                                            </span>
                                                                        </div>

                                                                        <div className="text-sm w-full text-left text-gray-700 space-y-1">
                                                                            <div>
                                                                                <strong>Profesional:</strong> {singleBooking.professional?.name || "—"}
                                                                            </div>
                                                                            <div>
                                                                                <strong>Inicio:</strong>{" "}
                                                                                {format(new Date(singleBooking.start), "PPPp", { locale: es })}
                                                                            </div>
                                                                            {typeof (singleBooking as any).sessionDuration === "number" && (
                                                                                <div>
                                                                                    <strong>Duración:</strong>{" "}
                                                                                    {(singleBooking as any).sessionDuration} minutos
                                                                                </div>
                                                                            )}
                                                                            {typeof (singleBooking as any).price === "number" && (
                                                                                <div>
                                                                                    <strong>Precio:</strong>{" "}
                                                                                    {(singleBooking as any).price.toLocaleString("es-AR", {
                                                                                        style: "currency",
                                                                                        currency:
                                                                                            (singleBooking as any).currency ||
                                                                                            singleBooking.service?.currency ||
                                                                                            "ARS",
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex justify-end">
                                                                            <Button
                                                                                asChild
                                                                                variant="outline"
                                                                                className="h-9 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                aria-label="Google Calendar"
                                                                            >
                                                                                <a
                                                                                    href={buildGoogleCalendarUrl({
                                                                                        title: calendarTitle(singleBooking.service?.name), // <- sin profesional
                                                                                        startISO: singleBooking.start,
                                                                                        endISO: singleBooking.end,
                                                                                        details: calendarDetails(
                                                                                            singleBooking.start,
                                                                                            singleBooking.service?.name,
                                                                                            singleBooking.professional?.name
                                                                                        ),
                                                                                        location: calendarLocationFor(),
                                                                                    })}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                >
                                                                                    <FcGoogle className="h-4 w-4 mx-auto" />
                                                                                    <span>Agregar al calendario</span>
                                                                                </a>
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        // Caso no confirmado (requiere seña) -> mantené tu tarjeta compacta + botón de Calendar si aplica
                                                        return (
                                                            <div>
                                                                <div className="rounded-2xl border p-4 bg-white w-full flex items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="font-semibold">{singleBooking.service?.name}</div>
                                                                    </div>
                                                                    <div className="text-sm">
                                                                        {format(new Date(singleBooking.start), "PPP", { locale: es })} •{" "}
                                                                        {format(new Date(singleBooking.start), "HH:mm")}
                                                                    </div>
                                                                </div>

                                                                {isBookingConfirmed(singleBooking) && (
                                                                    <div className="mt-3 flex justify-end">
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        asChild
                                                                                        variant="outline"
                                                                                        className="h-10 w-10 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                        aria-label="Google Calendar"
                                                                                    >
                                                                                        <a
                                                                                            href={buildGoogleCalendarUrl({
                                                                                                title: calendarTitle(singleBooking.service?.name), // ← sin profesional
                                                                                                startISO: singleBooking.start,
                                                                                                endISO: singleBooking.end,
                                                                                                details: calendarDetails(
                                                                                                    singleBooking.start,
                                                                                                    singleBooking.service?.name,
                                                                                                    singleBooking.professional?.name
                                                                                                ),
                                                                                                location: calendarLocationFor(),
                                                                                            })}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                        >
                                                                                            <FcGoogle className="h-5 w-5 mx-auto" />
                                                                                        </a>
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="left" className="text-xs">
                                                                                    Google Calendar
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : Array.isArray((bookingResult as any).bookings) ? (
                                                <div className="mt-8 grid gap-3">
                                                    {(bookingResult as any).bookings.map((b: any) => {
                                                        const confirmedNoDeposit = !requiresDeposit(b)

                                                        if (confirmedNoDeposit) {
                                                            return (
                                                                <div key={b._id} className="rounded-2xl border p-4 bg-white w-full">
                                                                    <div className="flex flex-col gap-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="font-semibold text-base">{b.service?.name}</div>
                                                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                                                                                Confirmado
                                                                            </span>
                                                                        </div>

                                                                        <div className="text-sm w-full text-left text-gray-700 space-y-1">
                                                                            <div>
                                                                                <strong>Profesional:</strong> {b.professional?.name}
                                                                            </div>
                                                                            <div>
                                                                                <strong>Inicio:</strong>{" "}
                                                                                {format(new Date(b.start), "PPPp", { locale: es })}
                                                                            </div>
                                                                            <div>
                                                                                <strong>Duración:</strong> {b.sessionDuration} minutos
                                                                            </div>
                                                                            <div>
                                                                                <strong>Precio:</strong>{" "}
                                                                                {b.price.toLocaleString("es-AR", {
                                                                                    style: "currency",
                                                                                    currency: b.currency || "ARS",
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex justify-end">
                                                                            <Button
                                                                                asChild
                                                                                variant="outline"
                                                                                className="h-9 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                aria-label="Google Calendar"
                                                                            >
                                                                                <a
                                                                                    href={buildGoogleCalendarUrl({
                                                                                        title: calendarTitle(b.service?.name), // <- sin profesional
                                                                                        startISO: b.start,
                                                                                        endISO: b.end,
                                                                                        details: calendarDetails(b.start, b.service?.name, b.professional?.name),
                                                                                        location: calendarLocationFor(),
                                                                                    })}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                >
                                                                                    <FcGoogle className="h-4 w-4 mx-auto" />
                                                                                    <span>Agregar al calendario</span>
                                                                                </a>
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }

                                                        // si confirmedNoDeposit es false -> deja todo igual
                                                        return (
                                                            <div key={b._id} className="rounded-2xl border p-4 bg-white w-full">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="font-semibold">{b.service?.name}</div>
                                                                        {confirmedNoDeposit && (
                                                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                                                                                Confirmado
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-sm">
                                                                            {format(new Date(b.start), "PPP", { locale: es })} •{" "}
                                                                            {format(new Date(b.start), "HH:mm")}
                                                                        </div>
                                                                        {isBookingConfirmed(b) && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            asChild
                                                                                            variant="outline"
                                                                                            className="h-9 w-9 p-0 rounded-lg border-2 border-green-300 hover:bg-green-50"
                                                                                            aria-label="Google Calendar"
                                                                                        >
                                                                                            <a
                                                                                                href={buildGoogleCalendarUrl({
                                                                                                    title: calendarTitle(b.service?.name),
                                                                                                    startISO: b.start,
                                                                                                    endISO: b.end,
                                                                                                    details: calendarDetails(b.start, b.service?.name, b.professional?.name),
                                                                                                    location: calendarLocationFor(),
                                                                                                })}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                            >
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
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : null}


                                            {!user && (
                                                <div className="mt-8 grid gap-6">
                                                    {(() => {
                                                        const first = singleBooking
                                                            ? singleBooking
                                                            : Array.isArray((bookingResult as any).bookings)
                                                                ? (bookingResult as any).bookings[0]
                                                                : (bookingResult as any).booking;
                                                        return first?.client?.email ? (
                                                            <div className="pt-2">
                                                                <>
                                                                    <Button
                                                                        size="lg"
                                                                        disabled={submitting}
                                                                        className="h-14 px-10 hover:opacity-85 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-xl border-0"
                                                                        asChild
                                                                    >
                                                                        <Link href={`/verify-client?email=${encodeURIComponent(first.client.email)}`}><span>Crear cuenta</span></Link>
                                                                    </Button>
                                                                    <p className="mt-2 text-xs text-gray-500">Creá tu cuenta para ver y gestionar tus reservas más rápido.</p>
                                                                </>
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-3 mt-6">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            disabled={submitting}
                                            className="h-14 px-8 border-2 border-green-300 hover:bg-green-50 bg-white"
                                            onClick={goToServices}
                                        >
                                            Nueva reserva
                                        </Button>
                                        <Button
                                            size="lg"
                                            disabled={submitting}
                                            className="h-14 px-10 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-xl border-0"
                                            asChild
                                        >
                                            <Link href="/">Volver al inicio</Link>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}