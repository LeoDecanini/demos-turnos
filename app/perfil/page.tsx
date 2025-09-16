'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner';
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    ArrowLeft,
    ExternalLink,
    CreditCard,
    Users,
    Heart,
    CalendarClock, XCircle
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import ProfessionalList from "@/components/ProfessionalList";
import { Skeleton } from "@/components/ui/skeleton";
import { es } from "date-fns/locale";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

type TabKey = 'perfil' | 'reservas';
const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function PerfilPage() {
    const { user, token, logout } = useAuth();
    const [hydrated, setHydrated] = useState(false);
    const [tab, setTab] = useState<TabKey>('reservas');

    useEffect(() => setHydrated(true), []);
    if (!hydrated) return null;

    if (!user) {
        return (
            <main className="min-h-screen pt-24 md:pt-32 px-4">
                <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Tu cuenta</h1>
                    <div className="mx-auto mt-3 h-1 w-16 rounded bg-yellow-400" />
                    <p className="mt-6 text-slate-600">
                        No estás logueado{' '}
                        <Link href="/login" className="underline text-slate-900 hover:text-slate-700">
                            Ingresar
                        </Link>
                    </p>
                </div>
            </main>
        );
    }

    console.log("ESTE ES EL USER", user)

    const initials = (() => {
        const base = (user?.name || user?.email || '').trim();
        if (!base) return 'U';
        const parts = base.split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return base.slice(0, 2).toUpperCase();
    })();

    return (
        <main className="min-h-screen max-w-7xl mx-auto pt-24 lg:pt-32 px-4 lg:px-6 flex items-start flex-col w-full">
            <div className="mb-6 lg:mb-8 w-full">
                <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 text-center lg:text-left">Tu
                    cuenta</h1>
                <div className="mt-3 h-1 w-16 rounded bg-yellow-400 mx-auto lg:mx-0" />
            </div>

            <div className="flex w-full gap-6">
                <aside
                    className="hidden lg:block w-[260px] shrink-0 rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-4 h-max">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="h-10 w-10 rounded-full bg-yellow-400/30 text-slate-900 flex items-center justify-center font-semibold">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{user.name || 'Usuario'}</div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        </div>
                    </div>
                    <nav className="space-y-2">
                        <SidebarBtn
                            active={tab === 'perfil'}
                            onClick={() => setTab('perfil')}
                            label="Perfil"
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                                </svg>
                            }
                        />
                        <SidebarBtn
                            active={tab === 'reservas'}
                            onClick={() => setTab('reservas')}
                            label="Reservaciones"
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2ZM3 10v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8Zm4 2h4v4H7Z" />
                                </svg>
                            }
                        />
                    </nav>
                    <hr className="my-4 border-slate-200" />
                    <button
                        onClick={logout}
                        className="w-full rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 py-2 font-medium transition"
                    >
                        Cerrar sesión
                    </button>
                </aside>

                <section
                    className="flex-1 rounded-2xl lg:bg-white lg:shadow-xl lg:ring-1 lg:ring-slate-100 p-0 lg:p-8 min-h-[420px] w-full">
                    <div className="lg:hidden -mt-2 -mx-2 mb-4">
                        <div className="flex flex-wrap gap-2 overflow-x-auto px-2 pb-1">
                            <MobileTab
                                active={tab === 'perfil'}
                                onClick={() => setTab('perfil')}
                                label="Perfil"
                            />
                            <MobileTab
                                active={tab === 'reservas'}
                                onClick={() => setTab('reservas')}
                                label="Reservaciones"
                            />
                            <div className="ml-auto">
                                <button
                                    onClick={logout}
                                    className="whitespace-nowrap rounded-xl border border-red-200 bg-white text-red-600 px-3 py-1.5 text-sm"
                                >
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3 px-2">
                            <div
                                className="h-9 w-9 rounded-full bg-yellow-400/30 text-slate-900 flex items-center justify-center text-sm font-semibold">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <div
                                    className="text-sm font-medium text-slate-900 truncate">{user.name || 'Usuario'}</div>
                                <div className="text-xs text-slate-500 truncate">{user.email}</div>
                            </div>
                        </div>
                    </div>

                    {tab === 'perfil' ? <PerfilView user={user} /> : <ReservasView />}
                </section>
            </div>
        </main>
    );
}

function SidebarBtn({
    active,
    onClick,
    label,
    icon,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                'w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
                active ? 'border-yellow-400 bg-yellow-50 text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            ].join(' ')}
        >
            <span className="text-slate-500">{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    );
}

function MobileTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={[
                'shrink-0 rounded-full px-3 py-1.5 text-sm border',
                active ? 'border-yellow-400 bg-yellow-50 text-slate-900' : 'border-slate-200 text-slate-600',
            ].join(' ')}
        >
            {label}
        </button>
    );
}

function PerfilView({ user }: { user: { email: string; name?: string } }) {
    return (
        <div>
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Perfil</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">Tu información de contacto</p>
            <div className="mt-6 space-y-5">
                <Row label="Nombre" value={user.name || '—'} />
                <Row label="Email" value={user.email} />
            </div>
        </div>
    );
}

type Professional = {
    _id: string;
    name: string;
};

function ReservasView() {
    // ----------------- State -----------------
    const [items, setItems] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    // Cancelación
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const [reason, setReason] = useState("")
    const [submittingCancel, setSubmittingCancel] = useState(false)
    const [cancelErr, setCancelErr] = useState<string | null>(null)

    // Reprogramación (pasos 2 → 4)
    type Professional = { _id: string; name: string }
    const [reschedulingId, setReschedulingId] = useState<string | null>(null)
    const [selectedService, setSelectedService] = useState<string>("")
    const [step, setStep] = useState(2)

    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [loadingProfessionals, setLoadingProfessionals] = useState(false)
    const [selectedProfessional, setSelectedProfessional] = useState<string>("any") // "any" = indistinto

    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [availableDays, setAvailableDays] = useState<string[]>([]) // YYYY-MM-DD[]
    const [loadingDays, setLoadingDays] = useState(false)

    const [timeSlots, setTimeSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [selectedTime, setSelectedTime] = useState<string>("")
    const [rescheduling, setRescheduling] = useState(false)
    const [rescheduleErr, setRescheduleErr] = useState<string | null>(null)

    const { user, token } = useAuth()

    // ----------------- Consts & helpers -----------------
    const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`
    const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID || ""
    const clientId = user?._id
    const totalPages = Math.max(1, Math.ceil(total / limit))

    const getPayload = (raw: any) => raw?.data ?? raw
    const formatDateForAPI = (date: Date) => format(date, "yyyy-MM-dd")
    const getCurrentMonth = (date: Date) => format(date, "yyyy-MM")
    const isDateAvailable = (date: Date) => availableDays.includes(formatDateForAPI(date))

    const fmt = (iso: string) =>
        new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))

    // ----------------- Fetch bookings (reusable) -----------------
    const fetchBookings = useCallback(async () => {
        if (!token || !ACCOUNT_ID || !clientId) {
            setLoading(false)
            setErr(!token ? "Falta token" : !ACCOUNT_ID ? "Falta NEXT_PUBLIC_ACCOUNT_ID" : "Falta clientId")
            return
        }
        try {
            setLoading(true)
            setErr(null)
            const url = `${API_BASE}/clients/by-account/${ACCOUNT_ID}/clients/${clientId}/bookings`
            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                params: { upcoming: 1, page, limit },
            })
            console.log(data)
            setItems(Array.isArray(data?.items) ? data.items : [])
            setTotal(Number(data?.total ?? 0))
            if (Number.isFinite(data?.page)) setPage(Number(data.page))
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message || "Error")
        } finally {
            setLoading(false)
        }
    }, [token, ACCOUNT_ID, clientId, page, limit, API_BASE])

    useEffect(() => {
        void fetchBookings()
    }, [fetchBookings])

    // ----------------- Load for reschedule -----------------
    /* const loadProfessionals = async (serviceId: string) => {
        if (!serviceId) return
        setLoadingProfessionals(true)
        try {
            const res = await fetch(`${API_BASE}/services/${serviceId}/professionals?accountId=${ACCOUNT_ID}`, {
                cache: "no-store",
            })
            if (!res.ok) throw new Error("No se pudieron cargar los profesionales")
            const raw = await res.json()
            const payload = getPayload(raw)
            const list: Professional[] = Array.isArray(payload) ? payload : payload?.items ?? []
            setProfessionals(list)
            setSelectedProfessional("any")
        } catch (e) {
            console.error(e)
            setProfessionals([])
            setSelectedProfessional("any")
        } finally {
            setLoadingProfessionals(false)
        }
    } */

    const loadProfessionals = async (serviceId: string, opts?: { autoadvance?: boolean }) => {
        if (!serviceId) return;
        setLoadingProfessionals(true);
        try {
            const res = await fetch(
                `${API_BASE}/services/${serviceId}/professionals?accountId=${ACCOUNT_ID}`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error("No se pudieron cargar los profesionales");

            const raw = await res.json();
            const payload = getPayload(raw);
            const list: Professional[] = Array.isArray(payload) ? payload : payload?.items ?? [];

            setProfessionals(list);

            if (list.length === 1) {
                // 👉 Auto-select y pasar al paso 3
                const only = list[0];
                setSelectedProfessional(only._id);

                // limpiar selección actual
                setAvailableDays([]);
                setSelectedDate(undefined);
                setTimeSlots([]);
                setSelectedTime("");

                // precargar días del único profesional
                await loadAvailableDays(serviceId, only._id);

                if (opts?.autoadvance) {
                    setStep(3);
                }
            } else {
                // varios (o ninguno) → dejar “Indistinto”
                setSelectedProfessional("any");
            }
        } catch (e) {
            console.error(e);
            setProfessionals([]);
            setSelectedProfessional("any");
        } finally {
            setLoadingProfessionals(false);
        }
    };


    const loadAvailableDays = async (serviceId: string, professionalId: string | undefined) => {
        if (!serviceId) return
        const currentDate = new Date()
        const month = getCurrentMonth(currentDate)
        setLoadingDays(true)
        try {
            const params = new URLSearchParams()
            params.set("accountId", ACCOUNT_ID)
            params.set("service", serviceId)
            params.set("month", month)
            if (professionalId && professionalId !== "any") params.set("professional", professionalId)

            const res = await fetch(`${API_BASE}/available-days?${params.toString()}`, { cache: "no-store" })
            if (!res.ok) throw new Error("No se pudieron cargar los días disponibles")
            const raw = await res.json()
            const payload = getPayload(raw)

            let dates: any[] = []
            if (Array.isArray(payload)) dates = payload
            else if (Array.isArray(payload?.days)) dates = payload.days
            else if (Array.isArray(payload?.items)) dates = payload.items

            if (dates.length && typeof dates[0] !== "string") {
                dates = dates.map((d: any) => d?.date).filter(Boolean)
            }
            setAvailableDays(dates as string[])
        } catch (e) {
            console.error(e)
            setAvailableDays([])
        } finally {
            setLoadingDays(false)
        }
    }

    const loadTimeSlots = async (serviceId: string, professionalId: string | undefined, date: Date) => {
        const dateStr = formatDateForAPI(date)
        if (!serviceId || !availableDays.includes(dateStr)) return

        setLoadingSlots(true)
        try {
            const params = new URLSearchParams()
            params.set("accountId", ACCOUNT_ID)
            params.set("service", serviceId)
            params.set("date", dateStr)
            if (professionalId && professionalId !== "any") params.set("professional", professionalId)

            const res = await fetch(`${API_BASE}/day-slots?${params.toString()}`, { cache: "no-store" })
            if (!res.ok) throw new Error("No se pudieron cargar los horarios")
            const raw = await res.json()
            const payload = getPayload(raw)
            const slots: string[] = Array.isArray(payload) ? payload : payload?.slots ?? payload?.items ?? []
            setTimeSlots(slots)
            setSelectedTime("")
        } catch (e) {
            console.error(e)
            setTimeSlots([])
            setSelectedTime("")
        } finally {
            setLoadingSlots(false)
        }
    }

    // ----------------- Cancel -----------------
    const openCancel = (id: string) => {
        setCancelErr(null)
        setReason("")
        setCancelingId(id)
    }

    const closeCancel = () => {
        setSubmittingCancel(false)
        setCancelErr(null)
        setReason("")
        setCancelingId(null)
    }

    const confirmCancel = async () => {
        if (!cancelingId || !token) return
        try {
            setSubmittingCancel(true)
            setCancelErr(null)
            const url = `${API_BASE}/cancel/${cancelingId}`
            await axios.post(
                url,
                reason ? { reason } : {},
                { headers: { Authorization: `Bearer ${token}` }, params: { accountId: ACCOUNT_ID } }
            )
            // 🔁 Refetch lista
            await fetchBookings()
            closeCancel()
        } catch (e: any) {
            setCancelErr(e?.response?.data?.message || e.message || "No se pudo cancelar")
            setSubmittingCancel(false)
        }
    }

    // ----------------- Reschedule -----------------
    /* const openReschedule = (booking: any) => {
        setRescheduleErr(null)
        setRescheduling(false)
        setStep(2)
        setReschedulingId(String(booking._id))
        setSelectedService(String(booking?.service?._id || ""))

        // reset selección
        setSelectedProfessional("any")
        setSelectedDate(undefined)
        setAvailableDays([])
        setTimeSlots([])
        setSelectedTime("")

        if (booking?.service?._id) {
            void loadProfessionals(String(booking.service._id))
        }
    } */

    const openReschedule = (booking: any) => {
        setRescheduleErr(null);
        setRescheduling(false);
        setStep(2);
        setReschedulingId(String(booking._id));
        setSelectedService(String(booking?.service?._id || ""));

        // reset selección
        setSelectedProfessional("any");
        setSelectedDate(undefined);
        setAvailableDays([]);
        setTimeSlots([]);
        setSelectedTime("");

        if (booking?.service?._id) {
            void loadProfessionals(String(booking.service._id), { autoadvance: true });
        }
    };

    const closeReschedule = () => {
        setRescheduling(false)
        setRescheduleErr(null)
        setReschedulingId(null)
    }

    const confirmReschedule = async () => {
        if (!reschedulingId || !token) return
        if (!ACCOUNT_ID) {
            setRescheduleErr("Falta NEXT_PUBLIC_ACCOUNT_ID en el entorno")
            return
        }
        if (!selectedDate || !selectedTime) {
            setRescheduleErr("Elegí fecha y horario")
            return
        }
        try {
            setRescheduling(true)
            setRescheduleErr(null)

            const day = formatDateForAPI(selectedDate) // "YYYY-MM-DD"
            const hour = selectedTime                    // "HH:mm"
            const professional = selectedProfessional === "any" ? null : selectedProfessional

            const url = `${API_BASE}/reschedule/${reschedulingId}`
            await axios.post(
                url,
                { day, hour, professional },
                { headers: { Authorization: `Bearer ${token}` }, params: { accountId: ACCOUNT_ID } }
            )

            // 🔁 Refetch lista
            await fetchBookings()
            closeReschedule()
        } catch (e: any) {
            setRescheduleErr(e?.response?.data?.message || e.message || "No se pudo reprogramar")
            setRescheduling(false)
        }
    }

    // ----------------- Render -----------------
    return (
        <div className="w-full">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Tus reservaciones</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">Acá verás tus próximos turnos.</p>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="text-sm text-slate-600">Total: {total}</div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Por página</span>
                    <select
                        value={limit}
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (v !== limit) {
                                setPage(1)
                                setLimit(v)
                            }
                        }}
                        className="h-9 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden md:grid grid-cols-5 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                    <div>Fecha</div>
                    <div>Servicio</div>
                    <div>Profesional</div>
                    <div>Estado</div>
                    <div>Acciones</div>
                </div>

                {loading ? (
                    <div className="px-4 py-6 text-center text-slate-500">Cargando…</div>
                ) : err ? (
                    <div className="px-4 py-6 text-center text-red-600">{err}</div>
                ) : items.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-500">Aún no tenés reservaciones.</div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {items.map((b: any) => (
                            <li key={b._id} className="px-4 py-3">
                                <div className="hidden md:grid grid-cols-5 text-sm items-center">
                                    <div className="font-medium text-slate-900">{fmt(b.start)}</div>
                                    <div className="text-slate-700">{b.service?.name || "—"}</div>
                                    <div className="text-slate-700">{b.professional?.name || "A asignar"}</div>
                                    <div>
                                        <span
                                            className={[
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-background",
                                                b.status === "confirmed" ? "bg-emerald-600" : b.status === "pending" ? "bg-amber-600" : "bg-rose-600",
                                            ].join(" ")}
                                        >
                                            {b.status === "canceled"
                                                ? "Cancelada"
                                                : b.status === "confirmed"
                                                    ? "Confirmada"
                                                    : b.status === "pending"
                                                        ? "Pendiente"
                                                        : "Desconocido"}
                                        </span>
                                    </div>
                                    <TooltipProvider>
                                        <div className="flex gap-2 justify-end">
                                            {b.status === "pending" && b.depositInitPoint && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(b.depositInitPoint, "_blank")}
                                                            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs border-sky-300 text-sky-700 hover:bg-sky-50"
                                                        >
                                                            Pagar
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Pagar y confirmar tu turno</TooltipContent>
                                                </Tooltip>
                                            )}

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReschedule(b)}
                                                        disabled={b.status === "canceled"}
                                                        className={[
                                                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs border",
                                                            b.status === "canceled"
                                                                ? "border-slate-200 text-slate-400 cursor-not-allowed"
                                                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
                                                        ].join(" ")}
                                                    >
                                                        Reprogramar
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Cambiar fecha u horario</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => openCancel(b._id)}
                                                        disabled={b.status === "canceled"}
                                                        className={[
                                                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs border",
                                                            b.status === "canceled"
                                                                ? "border-slate-200 text-slate-400 cursor-not-allowed"
                                                                : "border-rose-300 text-rose-700 hover:bg-rose-50",
                                                        ].join(" ")}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Cancelar la reserva</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TooltipProvider>
                                </div>

                                {/* Mobile row */}
                                <div className="md:hidden space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-slate-900">{fmt(b.start)}</div>
                                        <span
                                            className={[
                                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-background",
                                                b.status === "confirmed" ? "bg-emerald-600" : b.status === "pending" ? "bg-amber-600" : "bg-rose-600",
                                            ].join(" ")}
                                        >
                                            {b.status === "canceled"
                                                ? "Cancelada"
                                                : b.status === "confirmed"
                                                    ? "Confirmada"
                                                    : b.status === "pending"
                                                        ? "Pendiente"
                                                        : "Desconocido"}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-700">
                                        <div className="grid grid-cols-3 gap-2">
                                            <span className="col-span-1 text-slate-500">Servicio</span>
                                            <span className="col-span-2">{b.service?.name || "—"}</span>
                                            <span className="col-span-1 text-slate-500">Profesional</span>
                                            <span className="col-span-2">{b.professional?.name || "A asignar"}</span>
                                        </div>
                                    </div>
                                    <div className="pt-1 grid grid-cols-2 gap-2">
                                        {b.status === "pending" && b.depositInitPoint && (
                                            <button
                                                onClick={() => window.open(b.depositInitPoint, "_blank")}
                                                className="w-full rounded-xl border px-3 py-2 text-sm border-sky-300 text-sky-600 hover:bg-sky-50"
                                            >
                                                Pagar seña
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openReschedule(b)}
                                            disabled={b.status === "canceled"}
                                            className={[
                                                "w-full rounded-xl border px-3 py-2 text-sm",
                                                b.status === "canceled"
                                                    ? "border-slate-200 text-slate-400 cursor-not-allowed"
                                                    : "border-green-300 text-green-600 hover:bg-green-50",
                                            ].join(" ")}
                                        >
                                            Reprogramar
                                        </button>
                                        <button
                                            onClick={() => openCancel(b._id)}
                                            disabled={b.status === "canceled"}
                                            className={[
                                                "w-full rounded-xl border px-3 py-2 text-sm",
                                                b.status === "canceled"
                                                    ? "border-slate-200 text-slate-400 cursor-not-allowed"
                                                    : "border-red-300 text-red-600 hover:bg-red-50",
                                            ].join(" ")}
                                        >
                                            Cancelar
                                        </button>
                                    </div>

                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
                >
                    Anterior
                </button>
                <div className="text-sm text-slate-700 text-center">
                    Página {page} de {totalPages}
                </div>
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages || loading}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
                >
                    Siguiente
                </button>
            </div>

            {/* CTA reservar */}
            <div className="mt-6">
                <Link
                    href="/reservar"
                    className="inline-flex items-center gap-2 rounded-full border border-yellow-400 px-4 py-2 text-sm md:text-base font-medium text-slate-900 hover:bg-yellow-50 transition"
                >
                    Reservar nueva cita
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-900">
                        <path fill="currentColor" d="M13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                </Link>
            </div>

            {/* Dialog cancelar */}
            <Dialog open={!!cancelingId} onOpenChange={(o) => (o ? null : closeCancel())}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cancelar reservación</DialogTitle>
                        <DialogDescription>Podés agregar una nota para explicar el motivo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Motivo de la cancelación (opcional)"
                            rows={4}
                        />
                        {cancelErr && <div className="text-sm text-red-600">{cancelErr}</div>}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <button
                            onClick={closeCancel}
                            disabled={submittingCancel}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={confirmCancel}
                            disabled={submittingCancel}
                            className="rounded-xl border border-red-300 bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                            {submittingCancel ? "Cancelando…" : "Cancelar turno"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog reprogramar */}
            <Dialog open={!!reschedulingId} onOpenChange={(o) => (o ? null : closeReschedule())}>
                <DialogContent className="!max-w-4xl !w-full">
                    <DialogHeader>
                        <DialogTitle>Reprogramar turno</DialogTitle>
                        <DialogDescription />
                    </DialogHeader>

                    {/* Step 2: Profesional */}
                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Elegí el profesional</h2>
                                <p className="text-gray-600">
                                    Podés seleccionar <b>Indistinto</b> para que asignemos uno automáticamente
                                </p>
                            </div>

                            {loadingProfessionals ? (
                                <div className="max-w-3xl mx-auto">
                                    <Skeleton className="h-20 w-full" />
                                    <div className="mt-4 bg-white rounded-xl shadow border overflow-hidden">
                                        <Skeleton className="h-20 border rounded-bl-none rounded-br-none w-full" />
                                        <Skeleton className="h-20 border rounded-none w-full" />
                                        <Skeleton className="h-20 border rounded-tl-none rounded-tr-none w-full" />
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto">
                                    {professionals.length !== 1 && (
                                        <div
                                            className={`mb-4 rounded-xl border-2 cursor-pointer transition-colors px-4 py-3 ${selectedProfessional === "any"
                                                    ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50"
                                                    : "border-gray-200 hover:border-amber-300 bg-white/80"
                                                }`}
                                            onClick={() => {
                                                setSelectedProfessional("any");
                                                setStep(3);
                                                setAvailableDays([]);
                                                setSelectedDate(undefined);
                                                setTimeSlots([]);
                                                setSelectedTime("");
                                                setLoadingDays(true);
                                                void loadAvailableDays(selectedService, undefined);
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold text-gray-900">Indistinto</div>
                                                <span className="text-xs px-3 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-semibold">
                                                    Automático
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Podés seleccionar Indistinto para que asignemos uno automáticamente
                                            </p>
                                        </div>
                                    )}

                                    <ProfessionalList
                                        professionals={professionals}
                                        selectedId={selectedProfessional === "any" ? undefined : selectedProfessional}
                                        onSelect={(id) => {
                                            setSelectedProfessional(id);
                                            setStep(3);
                                            setAvailableDays([]);
                                            setSelectedDate(undefined);
                                            setTimeSlots([]);
                                            setSelectedTime("");
                                            setLoadingDays(true);
                                            void loadAvailableDays(selectedService, id);
                                        }}
                                        backendBaseUrl={process.env.NEXT_PUBLIC_CDN_URL || ""}
                                    />
                                </div>
                            )}

                            <div className="flex justify-between">
                                <Button variant="outline" className="border-2" onClick={() => closeReschedule()}>
                                    Cerrar
                                </Button>
                                <Button
                                    disabled={!selectedService || loadingProfessionals}
                                    onClick={() => {
                                        setStep(3)
                                        setAvailableDays([])
                                        setSelectedDate(undefined)
                                        setTimeSlots([])
                                        setSelectedTime("")
                                        setLoadingDays(true)
                                        void loadAvailableDays(selectedService, selectedProfessional)
                                    }}
                                >
                                    Continuar
                                    <Calendar className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Fecha y hora */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Elegí fecha y horario</h2>
                                <p className="text-gray-600">Seleccioná una fecha disponible y luego el horario</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-amber-500" />
                                            Seleccionar Fecha
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex justify-center">
                                            {!loadingDays ? (
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={async (date) => {
                                                        setSelectedDate(date);
                                                        if (date && isDateAvailable(date)) {
                                                            setLoadingSlots(true);
                                                            setTimeSlots([]);
                                                            setSelectedTime("");
                                                            await loadTimeSlots(
                                                                selectedService,
                                                                selectedProfessional,
                                                                date
                                                            );
                                                        } else {
                                                            setTimeSlots([]);
                                                            setSelectedTime("");
                                                        }
                                                    }}
                                                    disabled={(date) => {
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const d = new Date(date);
                                                        d.setHours(0, 0, 0, 0);
                                                        if (d < today) return true;
                                                        if (availableDays.length > 0) return !isDateAvailable(date);
                                                        return false;
                                                    }}
                                                    locale={es}
                                                    className="rounded-xl border-2 border-amber-200 max-w-none w-full"
                                                    classNames={{
                                                        months:
                                                            "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                                                        month: "space-y-4 w-full flex flex-col",
                                                        table: "w-full h-full border-collapse space-y-1",
                                                        head_row: "",
                                                        row: "w-full mt-2",
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full">
                                                    <Skeleton className="h-[248px] w-full" />
                                                </div>
                                            )}
                                        </div>
                                        {selectedDate && availableDays.length > 0 && !isDateAvailable(selectedDate) && (
                                            <p className="text-sm text-red-500 text-center">Esta fecha no está
                                                disponible</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                            <Clock className="h-5 w-5 mr-2 text-amber-500" />
                                            Horarios Disponibles
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingSlots ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {Array.from({ length: 18 }).map((_, i) => (
                                                    <Skeleton key={i} className="h-9 w-full" />
                                                ))}
                                            </div>
                                        ) : !selectedDate ? (
                                            <p className="text-gray-600">Elegí una fecha para ver los horarios.</p>
                                        ) : !isDateAvailable(selectedDate) ? (
                                            <p className="text-gray-600">Esta fecha no está disponible.</p>
                                        ) : timeSlots.length === 0 ? (
                                            <p className="text-gray-600">No hay horarios disponibles para esta
                                                fecha.</p>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-3">
                                                {timeSlots.map((time) => (
                                                    <Button
                                                        key={time}
                                                        variant={selectedTime === time ? "default" : "outline"}
                                                        className={`h-12 transition-all duration-300 ${selectedTime === time
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

                            <div className="flex justify-between">
                                <Button variant="outline" className="border-2" onClick={() => setStep(2)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Volver
                                </Button>
                                <Button
                                    disabled={!selectedService || !selectedDate || !selectedTime || !isDateAvailable(selectedDate)}
                                    onClick={() => setStep(4)}
                                >
                                    Continuar
                                    <User className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmar */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-slate-900">Confirmar reprogramación</h3>
                            <div className="text-sm text-slate-700 space-y-1">
                                <div>
                                    <span className="text-slate-500">Fecha:</span>{" "}
                                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "—"}
                                </div>
                                <div>
                                    <span className="text-slate-500">Hora:</span> {selectedTime || "—"}
                                </div>
                                <div>
                                    <span className="text-slate-500">Profesional:</span>{" "}
                                    {selectedProfessional === "any"
                                        ? "Indistinto"
                                        : professionals.find((p) => p._id === selectedProfessional)?.name || "—"}
                                </div>
                            </div>

                            {rescheduleErr && <div className="text-sm text-red-600">{rescheduleErr}</div>}

                            <div className="flex justify-between">
                                <Button variant="outline" className="border-2" onClick={() => setStep(3)}
                                    disabled={rescheduling}>
                                    Volver
                                </Button>
                                <Button onClick={confirmReschedule}
                                    disabled={rescheduling || !selectedDate || !selectedTime}>
                                    {rescheduling ? "Reprogramando…" : "Confirmar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}


function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            <div className="text-slate-500">{label}</div>
            <div className="md:col-span-2 font-medium text-slate-900">{value}</div>
        </div>
    );
}
