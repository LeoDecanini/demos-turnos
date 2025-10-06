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
import BookingPublicView from "./BookingPublicView";

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
    /* const { user } = useAuth(); */

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

    const requiresDeposit = (x: any) =>
        (typeof x.depositValueApplied === "number" && x.depositValueApplied > 0) ||
        (typeof x.depositAmount === "number" && x.depositAmount > 0);

    return (
        <BookingPublicView
            isConfirmed={isConfirmed}
            esGrupo={esGrupo}
            booking={booking}
            groupData={groupData}
            deadlineHuman={deadlineHuman}
            dateStr={dateStr}
            startTime={startTime}
            endTime={endTime}
            service={service}
            professional={professional}
            showDepositCallout={showDepositCallout}
            isCanceled={isCanceled}
            paymentLink={paymentLink}
            totalTarget={totalTarget}
            totalCollected={totalCollected}
            totalRemaining={totalRemaining}
            groupCurrency={groupCurrency}
            señaAplicada={señaAplicada}
        />
    );
}
