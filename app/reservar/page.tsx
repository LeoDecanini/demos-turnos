"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, CheckCircle, ArrowLeft, UserPlus, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ServiceList, { type ServiceItem as UIServiceItem } from "@/components/ServiceList";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/components/BookingStepper";
import { useAuth } from "../auth/AuthProvider";

/* ---- Google Calendar helpers ---- */
const toGCalDateUTC = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function buildGoogleCalendarUrl(opts: { title: string; startISO: string; endISO?: string; details?: string; location?: string }) {
  const start = new Date(opts.startISO);
  const end = opts.endISO ? new Date(opts.endISO) : new Date(start.getTime() + 30 * 60 * 1000);
  const dates = `${toGCalDateUTC(start)}/${toGCalDateUTC(end)}`;
  const params = new URLSearchParams({ action: "TEMPLATE", text: opts.title || "Reserva", dates });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ---- Tipos de datos ---- */
type Professional = { _id: string; name: string; photo?: { path?: string } };

type DepositType = "FIXED" | "PERCENT";
type RawService = {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  durationMinutes?: number;        // ⇐ usamos esto para bloqueo por duración
  depositRequired?: boolean;
  depositType?: DepositType;
  depositValue?: number;
  usesGlobalDepositConfig?: boolean;
  category?: { _id: string; name: string } | null; // para ServiceList
  popular?: boolean;
  sessionsCount?: number;
  sessionDuration?: number;
};

type DepositCfg = {
  allowOverrideOnService: boolean;
  defaultRequired: boolean;
  defaultType: DepositType;
  defaultValue: number;
  rounding?: { enabled?: boolean; decimals?: number };
};
const applyDepositPolicy = (list: RawService[], cfg?: DepositCfg) => {
  if (!cfg) return list;
  if (cfg.allowOverrideOnService === false)
    return list.map((s) => ({ ...s, depositRequired: cfg.defaultRequired, depositType: cfg.defaultType, depositValue: cfg.defaultValue }));
  return list.map((s) => (s.usesGlobalDepositConfig ? { ...s, depositRequired: cfg.defaultRequired, depositType: cfg.defaultType, depositValue: cfg.defaultValue } : s));
};

type BookingCreated = {
  _id: string;
  status: string;
  service: { name: string; price?: number; currency?: string };
  professional: { name: string } | null;
  start: string;
  end: string;
  client?: { email?: string };
};
type BookingResponse =
  | { success: true; bookings: BookingCreated[]; message: string }
  | { success: true; booking: BookingCreated; message: string }
  | { success: false; message: string };

type Branch = {
  _id: string;
  name: string;
  description?: string;
  default?: boolean;
  active: boolean;
  location?: { addressLine?: string; city?: string; state?: string; postalCode?: string; country?: string };
};

type PerServiceSelection = {
  serviceId: string;
  branchId?: string;
  professionalId?: string | "any";
  date?: string;
  time?: string;
};

/* ---- Config API ---- */
const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`;
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string;
const getPayload = (raw: any) => raw?.data ?? raw;
const fmtDay = (date: Date) => format(date, "yyyy-MM-dd");
const fmtMonth = (date: Date) => format(date, "yyyy-MM");

/* ---- UI helpers ---- */
function FloatingNav({
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
  backLabel = "Volver",
  nextLabel = "Continuar",
}: {
  onBack?: () => void;
  onNext?: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  backLabel?: string;
  nextLabel?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto rounded-full bg-white/90 backdrop-blur border shadow-lg px-3 py-2 flex gap-2">
        <Button variant="outline" disabled={backDisabled} onClick={onBack} className="border-2 border-gray-300">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
        <Button disabled={nextDisabled} onClick={onNext} className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

/* ====================== PAGE ====================== */
export default function ReservarPage() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [gateLoading, setGateLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState<string | null>(null);

  // Servicios (multi hasta 3)
  const [services, setServices] = useState<RawService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Sucursales
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [hasBranchStep, setHasBranchStep] = useState(false);

  // Profesionales
  const [professionalsByService, setProfessionalsByService] = useState<Record<string, Professional[]>>({});
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [selection, setSelection] = useState<Record<string, PerServiceSelection>>({});
  const [profIdx, setProfIdx] = useState(0); // paso secuencial de profesionales

  // Calendario/Horarios (por servicio)
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [scheduleIdx, setScheduleIdx] = useState(0);
  const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>();
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<string | null>(null); // bloqueo por duración

  // Cliente
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [notes, setNotes] = useState("");

  // Resultado
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  // NEW: errores detallados de bulk (index, message)
  const [bulkErrors, setBulkErrors] = useState<Array<{ index: number; message: string }>>([]);

  const prettyBulkError = (idx: number, msg: string) => {
    const srvId = selectedServices[idx];
    const srv = services.find(s => s._id === srvId);
    const sel = selection[srvId];
    const when = sel?.date && sel?.time ? `${sel.date} • ${sel.time}` : '';
    return `${srv?.name ?? `Ítem #${idx + 1}`} ${when ? `(${when}) ` : ''}— ${msg}`;
  };

  // Traducciones/normalizaciones de errores del backend
  const ERROR_MAP: Array<[test: RegExp, nice: string]> = [
    [/superpone/i, "El cliente ya tiene un turno que se superpone con ese horario"],
    [/dni.*exists|dni.*duplicado/i, "El DNI ya está registrado para otro cliente"],
    [/email.*exists|correo.*registrado/i, "Ese email ya existe"],
    [/no hay profesionales disponibles/i, "No hay profesionales disponibles en ese horario"],
    [/no.*disponible/i, "El turno seleccionado no está disponible"],
  ];

  const normalizeErr = (msg = "Error") => {
    for (const [re, nice] of ERROR_MAP) if (re.test(msg)) return nice;
    return msg;
  };

  const [bulkWarns, setBulkWarns] = useState<Array<{ index: number; message: string }>>([]); // para paso 6

  // UX helpers
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
      setFullName(user.name || "");
      setEmail(user.email || "");
      // @ts-ignore
      setPhone(user.phone || "");
      // @ts-ignore
      setDni(user.dni || "");
    }
  }, [user]);

  // Validaciones simples
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; phone?: string; dni?: string }>({});
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateField = (name: "fullName" | "email" | "phone" | "dni", value: string) => {
    let msg = "";
    const v = value?.trim() || "";
    if (name === "fullName" && v.length < 2) msg = "Ingresá un nombre válido";
    if (name === "email" && !emailRe.test(v)) msg = "Ingresá un email válido";
    if (name === "phone") {
      const digits = v.replace(/\D/g, "");
      if (digits.length < 8) msg = "Ingresá un teléfono válido";
    }
    if (name === "dni") {
      const digits = v.replace(/\D/g, "");
      if (digits.length < 6) msg = "Ingresá un DNI válido";
    }
    setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
    return !msg;
  };
  const validateAll = () => validateField("fullName", fullName) && validateField("email", email) && validateField("phone", phone) && validateField("dni", dni);

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

  /* -------- Preflight: cargar servicios -------- */
  useEffect(() => {
    const preflight = async () => {
      setGateLoading(true);
      setLoadingServices(true);
      try {
        const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
        const res = await fetch(`${API_BASE}/${slug}/services`, { cache: "no-store" });
        const raw = await res.json().catch(() => ({}));
        if (raw?.message === "Reservas bloqueadas") {
          setIsBlocked(true);
          setBlockMsg("Reservas bloqueadas");
          setServices([]);
          return;
        }
        const cfg: DepositCfg | undefined = raw?.config?.deposit;
        const payload = getPayload(raw);
        const list: RawService[] = Array.isArray(payload) ? payload : payload?.items ?? [];
        const listWithDeposit = applyDepositPolicy(list, cfg);
        setServices(listWithDeposit);
        if (listWithDeposit.length === 0) toast.error("No hay servicios disponibles en este momento");
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

  /* -------- Sucursales para varios servicios -------- */
  const loadBranchesForServices = async (serviceIds: string[]) => {
    setLoadingBranches(true);
    try {
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const promises = serviceIds.map((sid) => fetch(`${API_BASE}/${slug}/services/${sid}/branches`, { cache: "no-store" }).then((r) => r.json().catch(() => ({}))));
      const raws = await Promise.all(promises);
      if (raws.some((r: any) => r?.message === "Reservas bloqueadas")) {
        setIsBlocked(true);
        setBlockMsg("Reservas bloqueadas");
        return;
      }
      const merged: Record<string, Branch> = {};
      raws.forEach((raw: any) => {
        const payload = getPayload(raw);
        const list: Branch[] = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
        list.forEach((b) => (merged[b._id] = b));
      });
      const list = Object.values(merged).sort((a, b) => Number(!!b.default) - Number(!!a.default) || a.name.localeCompare(b.name));
      setBranches(list);

      if (list.length <= 1) {
        setHasBranchStep(false);
        const branchId = list[0]?._id;
        if (branchId) {
          const nextSel = { ...selection };
          serviceIds.forEach((sid) => (nextSel[sid] = { ...(nextSel[sid] || { serviceId: sid }), branchId, professionalId: nextSel[sid]?.professionalId || "any" }));
          setSelection(nextSel);
        }
        await loadProfessionalsForServices(serviceIds, list[0]?._id);
        setProfIdx(0);
        setStep(3);
        scrollToTop();
      } else {
        setHasBranchStep(true);
        setStep(2);
        scrollToTop();
      }
    } catch {
      setBranches([]);
      toast.error("Error al cargar sucursales");
    } finally {
      setLoadingBranches(false);
    }
  };

  /* -------- Profesionales (map por servicio) -------- */
  const loadProfessionalsForServices = async (serviceIds: string[], branchId?: string) => {
    setLoadingProfessionals(true);
    try {
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const promises = serviceIds.map((sid) => {
        const url = branchId ? `${API_BASE}/${slug}/services/${sid}/branches/${branchId}/professionals` : `${API_BASE}/${slug}/services/${sid}/professionals`;
        return fetch(url, { cache: "no-store" }).then((r) => r.json().catch(() => ({})));
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
        const list: Professional[] = Array.isArray(payload) ? payload : payload?.items ?? [];
        map[serviceIds[idx]] = list;
      });
      setProfessionalsByService(map);
    } catch {
      setProfessionalsByService({});
      toast.error("Error al cargar profesionales");
    } finally {
      setLoadingProfessionals(false);
    }
  };

  /* -------- Días y horarios -------- */
  const loadAvailableDays = async (srvId: string, profId?: string | "any", monthStr?: string) => {
    setLoadingDays(true);
    try {
      const params = new URLSearchParams();
      params.set("service", srvId);
      params.set("month", monthStr ?? fmtMonth(visibleMonth));
      if (profId && profId !== "any") params.set("professional", profId);
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const res = await fetch(`${API_BASE}/${slug}/available-days?${params.toString()}`, { cache: "no-store" });
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
      if (dates.length && typeof dates[0] !== "string") dates = dates.map((d: any) => d?.date).filter(Boolean);
      setAvailableDays(dates as string[]);
    } catch {
      setAvailableDays([]);
      toast.error("Error al cargar días");
    } finally {
      setLoadingDays(false);
    }
  };

  const loadTimeSlots = async (srvId: string, profId: string | "any" | undefined, date: Date) => {
    const dateStr = fmtDay(date);
    if (!srvId || !availableDays.includes(dateStr)) return;
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams();
      params.set("service", srvId);
      params.set("date", dateStr);
      if (profId && profId !== "any") params.set("professional", profId);
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const res = await fetch(`${API_BASE}/${slug}/day-slots?${params.toString()}`, { cache: "no-store" });
      const raw = await res.json().catch(() => ({}));
      if (raw?.message === "Reservas bloqueadas") {
        setIsBlocked(true);
        setBlockMsg("Reservas bloqueadas");
        return;
      }
      const payload = getPayload(raw);
      const slots: string[] = Array.isArray(payload) ? payload : payload?.slots ?? payload?.items ?? [];
      setTimeSlots(slots);
      setSelectedTimeBlock(null);
    } catch {
      setTimeSlots([]);
      toast.error("Error al cargar horarios");
    } finally {
      setLoadingSlots(false);
    }
  };

  /* -------- Selecciones actuales -------- */
  const currentServiceId = selectedServices[scheduleIdx];
  const currentService = services.find((s) => s._id === currentServiceId);
  const currentProfId = selection[currentServiceId]?.professionalId || "any";

  /* -------- Dinero helper -------- */
  const money = (n?: number, currency = "ARS") => (typeof n === "number" ? n.toLocaleString("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).replace(/\s/g, "") : "");

  /* -------- Confirmar hora para el servicio vigente -------- */
  const handleConfirmTimesForCurrent = (date: Date, time: string) => {
    const dateStr = fmtDay(date);
    const next = { ...selection };
    next[currentServiceId] = { ...(next[currentServiceId] || { serviceId: currentServiceId }), date: dateStr, time, branchId: next[currentServiceId]?.branchId, professionalId: currentProfId };
    setSelection(next);
    setSelectedTimeBlock(time);
  };

  const allTimesChosen = selectedServices.every((sid) => selection[sid]?.date && selection[sid]?.time);

  /* ======== BLOQUEO POR DURACIÓN + SERVICIO ANTERIOR ======== */
  function hhmmToMinutes(h: string) {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  }
  function isSlotBlockedByDuration(slot: string): boolean {
    if (!selectedTimeBlock) return false;
    const dur = currentService?.durationMinutes ?? currentService?.sessionDuration ?? 0;
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
  /* ========================================================== */

  /* -------- Crear reservas (bulk o de a una) -------- */
  /* -------- Crear reservas (bulk con validación + fallback) -------- */
  const createBooking = async () => {
    if (isBlocked) return;
    if (!validateAll()) {
      toast.error("Revisá los campos resaltados");
      return;
    }

    // helpers locales
    const hasAnyBooking = (r: any) =>
      !!(r?.booking || (Array.isArray(r?.bookings) && r.bookings.length > 0));

    const getErrors = (r: any) =>
      (Array.isArray(r?.errors) ? r.errors : []).map((e: any) => ({
        index: Number(e.index ?? 0),
        message: String(e.message ?? "Error"),
      }));

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

      // 1) Intento BULK
      const bulkRes = await fetch(bulkUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          timezone: tz,
          client: {
            name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            dni: dni.trim(),
          },
          notes: notes?.trim() || undefined,
        }),
      });

      if (bulkRes.ok) {
        const payload = await bulkRes.json();
        const errs = getErrors(payload);

        // ❌ No se creó nada → quedate en Paso 5 y mostrás lista de errores
        if (!hasAnyBooking(payload)) {
          setBulkErrors(errs);
          toast.error(
            payload?.message ||
            "No se pudo crear ninguna reserva. Revisá los errores."
          );
          setStep(5);
          return;
        }

        // ✅ Hay al menos una reserva
        if (errs.length) setBulkWarns(errs); // banner de “algunos errores” en Paso 6
        setBookingResult(payload);
        toast.success("¡Reserva(s) creada(s)!");
        setStep(6);
        scrollToTop();
        return;
      }

      // 2) Fallback: crear de a una (si el bulk devolvió 4xx/5xx)
      const created: BookingCreated[] = [];
      for (const it of items) {
        const r = await fetch(oneUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...it,
            client: {
              name: fullName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              dni: dni.trim(),
            },
            notes: notes?.trim() || undefined,
          }),
        });

        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          const msg =
            getPayload(e)?.message || e?.message || "No se pudo crear la reserva";
          // Abortamos ante el primer error y nos quedamos en Paso 5
          throw new Error(msg);
        }

        const single = (await r.json()) as {
          booking: BookingCreated;
          message: string;
        };
        created.push(single.booking);
      }

      if (created.length === 0) {
        throw new Error("No se pudo crear ninguna reserva");
      }

      setBookingResult({
        success: true,
        bookings: created,
        message: "Reservas creadas",
      } as BookingResponse);
      toast.success("¡Reserva(s) creada(s)!");
      setStep(6);
      scrollToTop();
    } catch (e) {
      // Nos quedamos en Paso 5 para que el usuario vea el detalle
      const msg =
        (e as Error)?.message ||
        "No se pudo crear la reserva. Probá nuevamente.";
      toast.error(msg);
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  };



  /* -------- Gate states -------- */
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
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 via-white to-amber-50/30">
        <Card className="max-w-md w/full border-amber-300/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{blockMsg || "Reservas bloqueadas"}</h2>
            <p className="text-gray-600">Por el momento no estamos tomando reservas en línea.</p>
            <div className="pt-2">
              <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-yellow-600">
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  /* ====================== RENDER ====================== */
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="mt-12 relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-4">
          <BookingStepper step={step} includeBranchStep={hasBranchStep && step !== 1} />
        </div>

        {/* PASO 1: Servicios (multi hasta 3) */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí hasta 3 servicios</h2>
              <p className="text-gray-600 text-lg">Podés combinar distintos tratamientos</p>
            </div>

            {loadingServices ? (
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow border overflow-hidden">
                <Skeleton className="h-[760px] w-full" />
              </div>
            ) : services.length === 0 ? (
              <p className="text-center text-gray-600">No hay servicios disponibles.</p>
            ) : (
              <>
                <ServiceList
                  /* @ts-ignore */
                  services={services}
                  selectedIds={selectedServices}         // string[]
                  onToggle={(id) => {
                    setSelectedServices((prev) =>
                      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                    );
                  }}
                  maxSelectable={3}
                />


                <FloatingNav
                  backDisabled
                  nextDisabled={selectedServices.length === 0 || submitting}
                  onNext={async () => {
                    await loadBranchesForServices(selectedServices);
                  }}
                />
              </>
            )}
          </>
        )}

        {/* PASO 2: Sucursal (si hay > 1) */}
        {step === 2 && hasBranchStep && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí la sucursal</h2>
              <p className="text-gray-600 text-lg">Se aplicará a todos los servicios seleccionados</p>
            </div>

            <Card className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                {loadingBranches ? (
                  <div className="grid gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : branches.length === 0 ? (
                  <p className="text-gray-600">No hay sucursales disponibles.</p>
                ) : (
                  <div className="grid gap-3">
                    {branches.map((b) => {
                      const selected = selectedServices.every((sid) => selection[sid]?.branchId === b._id);
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => {
                            const next = { ...selection };
                            selectedServices.forEach((sid) => (next[sid] = { ...(next[sid] || { serviceId: sid }), branchId: b._id, professionalId: next[sid]?.professionalId || "any" }));
                            setSelection(next);
                          }}
                          className={`text-left w-full rounded-xl border-2 px-4 py-3 transition-colors ${selected ? "border-amber-500 bg-amber-50/60" : "border-gray-200 hover:border-amber-300 bg-white"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-gray-900">
                              {b.name} {b.default && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Default</span>}
                            </div>
                            <div className="text-xs text-gray-500">{b.active ? "Activa" : "Inactiva"}</div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {[b.location?.addressLine, b.location?.city, b.location?.state, b.location?.country].filter(Boolean).join(", ") || "—"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <FloatingNav
              onBack={goToServices}
              onNext={async () => {
                await loadProfessionalsForServices(selectedServices, selection[selectedServices[0]]?.branchId);
                setProfIdx(0);
                setStep(3);
                scrollToTop();
              }}
              backDisabled={submitting}
              nextDisabled={submitting || !selectedServices.every((sid) => selection[sid]?.branchId)}
            />
          </>
        )}

        {/* PASO 3: Profesional (secuencial por servicio) */}
        {step === 3 && (
          <>
            {(() => {
              const srvId = selectedServices[profIdx];
              const srv = services.find((s) => s._id === srvId);
              const pros = professionalsByService[srvId] || [];
              const sel = selection[srvId]?.professionalId || "any";

              return (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí profesional</h2>
                    <p className="text-gray-600">
                      Servicio {profIdx + 1} de {selectedServices.length}: {srv?.name}
                    </p>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-3">
                    <div
                      className={`rounded-xl border-2 px-4 py-3 cursor-pointer ${sel === "any" ? "border-amber-500 bg-amber-50/60" : "border-gray-200 hover:border-amber-300"}`}
                      onClick={() =>
                        setSelection((prev) => ({ ...prev, [srvId]: { ...(prev[srvId] || { serviceId: srvId }), professionalId: "any", branchId: prev[srvId]?.branchId } }))
                      }
                    >
                      <div className="font-semibold">Indistinto</div>
                      <div className="text-xs text-gray-500">Asignación automática</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pros.map((p) => {
                        const isSel = sel === p._id;
                        return (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() =>
                              setSelection((prev) => ({ ...prev, [srvId]: { ...(prev[srvId] || { serviceId: srvId }), professionalId: p._id, branchId: prev[srvId]?.branchId } }))
                            }
                            className={`rounded-xl border-2 px-4 py-3 text-left ${isSel ? "border-amber-500 bg-amber-50/60" : "border-gray-200 hover:border-amber-300"}`}
                          >
                            <div className="font-semibold">{p.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <FloatingNav
                    onBack={() => {
                      if (hasBranchStep && profIdx === 0) setStep(2);
                      else if (!hasBranchStep && profIdx === 0) setStep(1);
                      else setProfIdx((i) => Math.max(0, i - 1));
                      scrollToTop();
                    }}
                    onNext={() => {
                      if (profIdx + 1 < selectedServices.length) {
                        setProfIdx((i) => i + 1);
                      } else {
                        setScheduleIdx(0);
                        resetCalendar();
                        void loadAvailableDays(selectedServices[0], selection[selectedServices[0]]?.professionalId || "any");
                        setStep(4);
                        scrollToTop();
                      }
                    }}
                    backDisabled={submitting}
                    nextDisabled={submitting || !selection[srvId]?.professionalId}
                  />
                </>
              );
            })()}
          </>
        )}

        {/* PASO 4: Fecha y horario (secuencial) */}
        {step === 4 && currentServiceId && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí fecha y horario</h2>
              <p className="text-gray-600">
                Servicio {scheduleIdx + 1} de {selectedServices.length}: {currentService?.name}
              </p>
              {(currentService?.durationMinutes ?? currentService?.sessionDuration) ? (
                <p className="text-xs text-gray-500 mt-1">
                  Duración: {(currentService?.durationMinutes ?? currentService?.sessionDuration)!} min. Al elegir una hora se bloquea el bloque completo.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Calendario */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-amber-500" />
                    Seleccionar Fecha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    {!loadingDays ? (
                      <CalendarComponent
                        mode="single"
                        selected={selectedDateObj}
                        month={visibleMonth}
                        onMonthChange={async (m) => {
                          setVisibleMonth(m);
                          await loadAvailableDays(currentServiceId, currentProfId, fmtMonth(m));
                        }}
                        onSelect={async (date) => {
                          setSelectedDateObj(date || undefined);
                          if (date && availableDays.includes(fmtDay(date))) {
                            setTimeSlots([]);
                            setSelectedTimeBlock(null);
                            await loadTimeSlots(currentServiceId, currentProfId, date);
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
                        className="rounded-xl border-2 border-amber-200 w-full"
                        classNames={{
                          months: "flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 w-full",
                          month: "space-y-2 w-full",
                          table: "w-full border-collapse",
                          head_row: "flex w-full",
                          row: "flex w-full mt-2",
                          head_cell: "w-9 text-center text-muted-foreground text-[0.8rem]",
                          cell: "h-9 w-9 p-0 relative text-center",
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
              <Card ref={timeSectionRef}>
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
                  ) : !selectedDateObj ? (
                    <p className="text-gray-600">Elegí una fecha para ver los horarios.</p>
                  ) : !availableDays.includes(fmtDay(selectedDateObj)) ? (
                    <p className="text-gray-600">Esta fecha no está disponible.</p>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {timeSlots.map((time) => {
                        const blockedByDur = isSlotBlockedByDuration(time);
                        const blockedByPrev = isSlotBlockedByPrevService(time);
                        const picked = selectedTimeBlock === time;
                        const blocked = (blockedByDur && !picked) || blockedByPrev;

                        return (
                          <Button
                            key={time}
                            variant={picked ? "default" : "outline"}
                            disabled={blocked}
                            className={`h-12 transition-all duration-300 ${picked
                              ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg border-0"
                              : blocked
                                ? "opacity-40 cursor-not-allowed border-2"
                                : "border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50"
                              }`}
                            onClick={() => {
                              if (!selectedDateObj) return;
                              handleConfirmTimesForCurrent(selectedDateObj, time);
                            }}
                          >
                            {time}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <FloatingNav
              onBack={async () => {
                if (scheduleIdx === 0) {
                  // volver a profesionales secuenciales
                  setStep(3);
                  setProfIdx(selectedServices.length - 1);
                  scrollToTop();
                  return;
                }
                const prevIdx = scheduleIdx - 1;
                setScheduleIdx(prevIdx);
                resetCalendar();
                await loadAvailableDays(selectedServices[prevIdx], selection[selectedServices[prevIdx]]?.professionalId || "any");
                scrollToTop();
              }}
              onNext={async () => {
                const nextIdx = scheduleIdx + 1;
                if (!selection[currentServiceId]?.date || !selection[currentServiceId]?.time) return;
                if (nextIdx < selectedServices.length) {
                  setScheduleIdx(nextIdx);
                  resetCalendar();
                  await loadAvailableDays(selectedServices[nextIdx], selection[selectedServices[nextIdx]]?.professionalId || "any");
                  scrollToTop();
                } else {
                  setStep(5);
                  scrollToTop();
                }
              }}
              backDisabled={submitting}
              nextDisabled={submitting || !selection[currentServiceId]?.date || !selection[currentServiceId]?.time}
            />
          </>
        )}

        {/* PASO 5: Datos del cliente */}
        {step === 5 && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tus datos de contacto</h2>
              <p className="text-gray-600 text-lg">Completá la información para confirmar</p>
            </div>

            {bulkErrors.length > 0 && (
              <div className="max-w-3xl mx-auto mb-4 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800">
                <div className="font-semibold mb-2">No se pudieron crear las reservas:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {bulkErrors.map((e, idx) => (
                    <li key={`${e.index}-${idx}`}>
                      {prettyBulkError(e.index, e.message)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Card className="relative">
              {submitting && <div className="bg-white/70 flex items-center justify-center rounded-xl absolute w-full h-full top-0 left-0 z-10">Creando su reserva...</div>}
              <CardContent className="space-y-6">
                <fieldset disabled={!!user || submitting} className={submitting ? "opacity-60 pointer-events-none select-none" : ""}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.fullName ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Tu nombre y apellido"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) validateField("fullName", e.target.value);
                      }}
                      onBlur={(e) => validateField("fullName", e.target.value)}
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.email ? "border-red-500" : "border-gray-200"}`}
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) validateField("email", e.target.value);
                      }}
                      onBlur={(e) => validateField("email", e.target.value)}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.phone ? "border-red-500" : "border-gray-200"}`}
                      placeholder="+54 11 1234-5678"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) validateField("phone", e.target.value);
                      }}
                      onBlur={(e) => validateField("phone", e.target.value)}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.dni ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Tu DNI"
                      value={dni}
                      onChange={(e) => {
                        setDni(e.target.value);
                        if (errors.dni) validateField("dni", e.target.value);
                      }}
                      onBlur={(e) => validateField("dni", e.target.value)}
                      aria-invalid={!!errors.dni}
                    />
                    {errors.dni && <p className="mt-1 text-sm text-red-600">{errors.dni}</p>}
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Comentarios (opcional)</label>
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
            </Card>

            <FloatingNav
              onBack={() => setStep(4)}
              onNext={createBooking}
              backDisabled={submitting}
              nextDisabled={submitting || !allTimesChosen || !fullName.trim() || !email.trim() || !phone.trim() || !dni.trim()}
              nextLabel={submitting ? "Creando…" : "Confirmar Reserva"}
            />
          </>
        )}

        {/* PASO 6: Resultado */}
        {step === 6 && bookingResult && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            <div className="text-center space-y-8">
              <div className="max-w-2xl mx-auto">
                <div className="rounded-3xl p-4 sm:p-10 border backdrop-blur-sm bg-gradient-to-br from-emerald-50/60 to-green-50/40 border-green-200">
                  <div className="flex items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ring-1 ring-inset bg-emerald-100 text-emerald-900 ring-emerald-200">
                      Listo
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                      ¡Reserva{Array.isArray((bookingResult as any).bookings) && (bookingResult as any).bookings.length > 1 ? "s" : ""} confirmada!
                    </h2>
                    <p className="text-black text-xl">{(bookingResult as any).message || "Se creó la reserva"}</p>
                  </div>

                  {Array.isArray((bookingResult as any).bookings) ? (
                    <div className="mt-8 grid gap-3">
                      {(bookingResult as any).bookings.map((b: BookingCreated) => (
                        <div key={b._id} className="rounded-xl border p-4 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{b.service?.name}</div>
                            <div className="text-sm">
                              {format(new Date(b.start), "PPP", { locale: es })} • {format(new Date(b.start), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="pt-8">
                    {(() => {
                      const first = Array.isArray((bookingResult as any).bookings) ? (bookingResult as any).bookings[0] : (bookingResult as any).booking;
                      if (!first) return null;
                      const gcalUrl = buildGoogleCalendarUrl({
                        title: Array.isArray((bookingResult as any).bookings) ? "Reserva — Paquete" : `${first.service?.name}${first?.professional?.name ? ` — ${first.professional.name}` : ""}`,
                        startISO: first.start,
                        endISO: first.end,
                        details: `Reserva ${Array.isArray((bookingResult as any).bookings) ? "múltiple" : ""}`,
                        location: branches.length ? "" : "", // setea si querés dirección
                      });
                      return (
                        <Button asChild variant="outline" className="w-full sm:w-auto h-12 px-5 border-2 border-amber-300 hover:bg-amber-50">
                          <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            Guardar en Google Calendar
                          </a>
                        </Button>
                      );
                    })()}
                  </div>

                  <div className="mt-8 grid gap-6">
                    {(((bookingResult as any).booking && (bookingResult as any).booking.client?.email) ||
                      (Array.isArray((bookingResult as any).bookings) && (bookingResult as any).bookings[0]?.client?.email)) && (
                        <div className="pt-2">
                          <Link
                            href={`/verify-client?email=${encodeURIComponent(
                              (bookingResult as any).booking?.client?.email || (bookingResult as any).bookings[0]?.client?.email
                            )}`}
                            className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-inset ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:brightness-105 hover:shadow-xl"
                          >
                            <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                            <UserPlus className="h-5 w-5 shrink-0" />
                            <span>Crear cuenta</span>
                          </Link>
                          <p className="mt-2 text-xs text-gray-500">Creá tu cuenta para ver y gestionar tus reservas más rápido.</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-6">
                <Button
                  size="lg"
                  variant="outline"
                  disabled={submitting}
                  className="h-14 px-8 border-2 border-amber-300 hover:bg-amber-50 bg-white"
                  onClick={goToServices}
                >
                  Nueva reserva
                </Button>

                <Button size="lg" disabled={submitting} className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold shadow-xl border-0" asChild>
                  <Link href="/">Volver al inicio</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
