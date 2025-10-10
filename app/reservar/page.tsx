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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ServiceList from "@/components/ServiceList";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/components/BookingStepper";
import { useAuth } from "../auth/AuthProvider";
import ProfessionalList from "@/components/ProfessionalList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FcGoogle } from "react-icons/fc";
import { isValidPhoneNumber, isPossiblePhoneNumber } from "react-phone-number-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";

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
  location?: {
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
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
          className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white"
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [notes, setNotes] = useState("");

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
    if (!selectedDateObj) return false;

    const currentDur = getServiceDuration(currentServiceId);
    if (!currentDur) return false;

    const slotStart = hhmmToMinutes(slot);
    const sameDayStr = fmtDay(selectedDateObj);

    // Sólo miramos servicios ya fijados (índices < scheduleIdx)
    for (let i = 0; i < scheduleIdx; i++) {
      const sid = selectedServices[i];
      const sel = selection[sid];
      if (!sel?.date || !sel?.time) continue;
      if (sel.date !== sameDayStr) continue;

      const prevDur = getServiceDuration(sid);
      if (!prevDur) continue;

      const prevStart = hhmmToMinutes(sel.time);

      // si se solapan, bloqueamos este slot
      if (overlaps(slotStart, currentDur, prevStart, prevDur)) {
        return true;
      }
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
      setFullName(user.name || "");
      setEmail(user.email || "");
      // @ts-ignore
      setPhone(user.phone || "");
      // @ts-ignore
      setDni(user.dni || "");
    }
  }, [user]);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    dni?: string;
  }>({});
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateField = (
    name: "fullName" | "email" | "phone" | "dni",
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

    setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
    return !msg;
  };
  const validateAll = () =>
    validateField("fullName", fullName) &&
    validateField("email", email) &&
    validateField("phone", phone) &&
    validateField("dni", dni);

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
    const preflight = async () => {
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
        setStep(2);
        scrollToTop();
      } else {
        // autoselección ya aplicada en nextSel arriba
        setSelection(nextSel);
        setBranchesByService(map);
        setHasBranchStep(false); // redundante pero explícito
        await loadProfessionalsForServices(serviceIds);
        setProfIdx(0);
        setStep(3);
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
    monthStr?: string
  ) => {
    setLoadingDays(true);
    try {
      const params = new URLSearchParams();
      params.set("service", srvId);
      params.set("month", monthStr ?? fmtMonth(visibleMonth));
      if (profId && profId !== "any") params.set("professional", profId);
      const slug =
        SUBDOMAIN ??
        (typeof window !== "undefined"
          ? window.location.hostname.split(".")[0]
          : "");
      const res = await fetch(
        `${API_BASE}/${slug}/available-days?${params.toString()}`,
        { cache: "no-store" }
      );
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
    date: Date
  ) => {
    const dateStr = fmtDay(date);
    if (!srvId || !availableDays.includes(dateStr)) return;
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams();
      params.set("service", srvId);
      params.set("date", dateStr);
      if (profId && profId !== "any") params.set("professional", profId);
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
        if (!hasAnyBooking(payload)) {
          setBulkErrors(errs);
          toast.error(
            payload?.message ||
            "No se pudo crear ninguna reserva. Revisá los errores."
          );
          setStep(5);
          return;
        }
        if (errs.length) setBulkWarns(errs);
        setBookingResult(payload);
        toast.success("¡Reserva(s) creada(s)!");
        setStep(6);
        scrollToTop();
        return;
      }

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
          throw new Error(msg);
        }

        const single = (await r.json()) as {
          booking: BookingCreated;
          message: string;
        };
        created.push(single.booking);
      }

      if (created.length === 0) throw new Error("No se pudo crear ninguna reserva");

      setBookingResult({
        success: true,
        bookings: created,
        message: "Reservas creadas",
      } as BookingResponse);
      toast.success("¡Reserva(s) creada(s)!");
      setStep(6);
      scrollToTop();
    } catch (e) {
      const msg =
        (e as Error)?.message ||
        "No se pudo crear la reserva. Probá nuevamente.";
      toast.error(msg);
      setStep(5);
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


  const goNextAfterProfessional = () => {
    if (profIdx + 1 < selectedServices.length) {
      setProfIdx((i) => i + 1);
    } else {
      setScheduleIdx(0);
      resetCalendar();
      setStep(4); // el useEffect de abajo hará el fetch con el profesional actualizado
      scrollToTop();
    }
  };

  useEffect(() => {
    if (step !== 4 || !currentServiceId) return;
    const pid = selection[currentServiceId]?.professionalId || "any";
    void loadAvailableDays(currentServiceId, pid);
    // al entrar al paso 4 o cambiar el profesional del servicio actual,
    // cargamos los días con el valor NUEVO ya aplicado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentServiceId, selection[currentServiceId]?.professionalId]);


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
            <h2 className="text-2xl font-bold text-gray-900">
              {blockMsg || "Reservas bloqueadas"}
            </h2>
            <p className="text-gray-600">
              Por el momento no estamos tomando reservas en línea.
            </p>
            <div className="pt-2">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600"
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
      <div className="mt-12 pb-[100px] relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-4">
          <BookingStepper
            step={step}
            includeBranchStep={hasBranchStep && step !== 1}
          />
        </div>

        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Elegí hasta 3 Tratamientos
              </h2>
              <p className="text-gray-600 text-lg">
                Podés combinar distintos tratamientos
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
                  services={services}
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
                  backDisabled
                  nextDisabled={selectedServices.length === 0 || submitting}
                  onNext={async () => {
                    const res = await loadBranchesForServices(selectedServices);
                    console.log(res)
                  }}
                />
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            {(() => {
              const sid = selectedServices[branchIdx];
              const srv = services.find(s => s._id === sid);
              const list = branchesByService[sid] ?? [];

              return (
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Elegí la sucursal
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Servicio {branchIdx + 1} de {selectedServices.length}: {srv?.name}
                    </p>
                  </div>

                  <Card className="max-w-3xl mx-auto">
                    <CardContent className="p-6">
                      {loadingBranches ? (
                        <div className="grid gap-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : list.length === 0 ? (
                        <p className="text-gray-600">No hay sucursales para este servicio.</p>
                      ) : (
                        <div className="grid gap-3">
                          {list.map((b) => {
                            const selected = selection[sid]?.branchId === b._id;
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
                                  }));
                                }}
                                className={`text-left w-full rounded-xl border-2 px-4 py-3 transition-colors ${selected
                                  ? "border-amber-500 bg-amber-50/60"
                                  : "border-gray-200 hover:border-amber-300 bg-white"
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-gray-900">
                                    {b.name}{" "}
                                    {b.default && (
                                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  {/* <div className="text-xs text-gray-500">
                                    {b.active ? "Activa" : "Inactiva"}
                                  </div> */}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {[
                                    b.location?.addressLine,
                                    b.location?.city,
                                    b.location?.state,
                                    b.location?.country,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <FloatingNav
                    onBack={() => {
                      if (branchIdx === 0) {
                        // volver a servicios
                        setStep(1);
                        scrollToTop();
                      } else {
                        setBranchIdx((i) => i - 1);
                        scrollToTop();
                      }
                    }}
                    onNext={async () => {
                      // requerimos sucursal elegida para este servicio
                      if (!selection[sid]?.branchId) return;

                      if (branchIdx + 1 < selectedServices.length) {
                        setBranchIdx((i) => i + 1);
                        scrollToTop();
                      } else {
                        // ya elegimos sucursal para todos -> cargar profesionales por servicio y pasar a paso 3
                        await loadProfessionalsForServices(
                          selectedServices,
                          /* branchId? ya NO, ahora por servicio abajo */
                        );
                        setProfIdx(0);
                        setStep(3);
                        scrollToTop();
                      }
                    }}
                    backDisabled={submitting}
                    nextDisabled={submitting || !selection[sid]?.branchId}
                    nextLabel={branchIdx + 1 < selectedServices.length ? "Siguiente servicio" : "Continuar"}
                  />
                </>
              );
            })()}
          </>
        )}

        {step === 3 && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            {(() => {
              const srvId = selectedServices[profIdx];
              const srv = services.find((s) => s._id === srvId);
              const pros = professionalsByService[srvId] || [];
              const sel = selection[srvId]?.professionalId || "any";
              const hasProSelected = !!(selection[srvId]?.professionalId ?? "any");

              return (
                <div className="space-y-8">
                  <div className="text-center">
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

                  <div className="max-w-3xl mx-auto">
                    {/*  {pros.length > 1 && (
                      <div
                        className={`mb-4 rounded-xl border-2 cursor-pointer transition-colors px-4 py-3 ${sel === "any"
                          ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50"
                          : "border-gray-200 hover:border-amber-300 bg-white/80"
                          }`}
                        onClick={() => {
                          setSelection((prev) => ({
                            ...prev,
                            [srvId]: {
                              ...(prev[srvId] || { serviceId: srvId }),
                              professionalId: "any",
                              branchId: prev[srvId]?.branchId,
                            },
                          }));
                          goNextAfterProfessional();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0 relative">
                            <img
                              src={"/indistinto.png"}
                              alt={""}
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-900">
                                Indistinto
                              </div>
                              <span className="text-xs px-3 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-semibold">
                                Automático
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Podés seleccionar “Indistinto” para que asignemos uno
                              automáticamente.
                            </p>
                          </div>
                        </div>
                      </div>
                    )} */}

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

                  </div>

                  {/* Dejo el FloatingNav para "Volver" si hace falta */}
                  <FloatingNav
                    onBack={() => {
                      if (hasBranchStep && profIdx === 0) setStep(2);
                      else if (!hasBranchStep && profIdx === 0) setStep(1); // ← vuelve a Servicios si NO hubo paso de sucursal
                      else setProfIdx((i) => Math.max(0, i - 1));
                      scrollToTop();
                    }}
                    onNext={() => {
                      if (profIdx + 1 < selectedServices.length) {
                        setProfIdx((i) => i + 1);
                      } else {
                        setScheduleIdx(0);
                        resetCalendar();
                        setStep(4); // sin loadAvailableDays acá
                        scrollToTop();
                      }
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

        {step === 4 && currentServiceId && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Elegí fecha y horario
              </h2>
              {!isSingleService ? (
                <p className="text-gray-600">
                  Servicio {scheduleIdx + 1} de {selectedServices.length}:{" "}
                  {currentService?.name}
                </p>
              ) : (
                <p className="text-gray-600">{currentService?.name}</p>
              )}
              {(currentService?.durationMinutes ??
                currentService?.sessionDuration) ? (
                <p className="text-xs text-gray-500 mt-1">
                  Duración:{" "}
                  {(
                    currentService?.durationMinutes ??
                    currentService?.sessionDuration
                  )!}{" "}
                  min. Al elegir una hora se bloquea el bloque completo.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-amber-500" />
                    Seleccionar Fecha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="w-full"> {/* <- antes: flex justify-center */}
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
                        className="rounded-lg border-2 border-amber-200 w-full p-3"
                        classNames={{
                          // layout ancho completo
                          months: "w-full",
                          month: "w-full",
                          table: "w-full border-collapse",
                          head_row: "grid grid-cols-7",
                          row: "grid grid-cols-7 mt-2",
                          head_cell:
                            "text-center text-muted-foreground text-[0.8rem] py-1",
                          cell: "p-0 relative w-full",

                          // botón del día (hover + rounded)
                          day:
                            "h-10 w-full cursor-pointer p-0 rounded-lg transition-colors " +
                            "hover:bg-amber-100 hover:text-amber-900 " +
                            "focus:outline-none focus:ring-2 focus:ring-amber-300",

                          // estados
                          day_selected:
                            "bg-amber-500 text-white hover:bg-amber-600 focus:bg-amber-600 rounded-lg",
                          day_today:
                            "bg-amber-50 text-amber-700 font-semibold rounded-lg",
                          day_outside:
                            "text-muted-foreground opacity-60",
                          day_disabled:
                            "opacity-40 cursor-not-allowed pointer-events-none rounded-lg",

                          // (opcional) si usás rango alguna vez
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
                    <p className="text-gray-600">
                      Elegí una fecha para ver los horarios.
                    </p>
                  ) : !availableDays.includes(fmtDay(selectedDateObj)) ? (
                    <p className="text-gray-600">Esta fecha no está disponible.</p>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-gray-600">
                      No hay horarios disponibles para esta fecha.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {timeSlots.map((time) => {
                        const blockedByDur = isSlotBlockedByDuration(time); // tu bloque para “pintar” el bloque cuando ya elegiste en el mismo servicio
                        const blockedByPrev = isSlotOverlappingWithPrevSelections(time); // ← nuevo
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
                  setStep(3);
                  setProfIdx(selectedServices.length - 1);
                  scrollToTop();
                  return;
                }
                const prevIdx = scheduleIdx - 1;
                setScheduleIdx(prevIdx);
                resetCalendar();
                await loadAvailableDays(
                  selectedServices[prevIdx],
                  selection[selectedServices[prevIdx]]?.professionalId || "any"
                );
                scrollToTop();
              }}
              onNext={async () => {
                const nextIdx = scheduleIdx + 1;
                if (!selection[currentServiceId]?.date || !selection[currentServiceId]?.time)
                  return;
                if (nextIdx < selectedServices.length) {
                  setScheduleIdx(nextIdx);
                  resetCalendar();
                  await loadAvailableDays(
                    selectedServices[nextIdx],
                    selection[selectedServices[nextIdx]]?.professionalId || "any"
                  );
                  scrollToTop();
                } else {
                  setStep(5);
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

        {step === 5 && (
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

            <Card className="relative">
              {submitting && (
                <div className="bg-white/70 flex items-center justify-center rounded-xl absolute w-full h-full top-0 left-0 z-10">
                  Creando su reserva...
                </div>
              )}
              <CardContent className="space-y-6">
                <fieldset
                  disabled={!!user || submitting}
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
                      <p className="mt-1 text-sm text-red-600">
                        {errors.fullName}
                      </p>
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

                  {/* <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl ${errors.phone ? "border-red-500" : "border-gray-200"
                        }`}
                      placeholder="+54 11 1234-5678"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) validateField("phone", e.target.value);
                      }}
                      onBlur={(e) => validateField("phone", e.target.value)}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div> */}

                  <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>

                    <div className="w-full">
                      <PhoneInput
                        // sugerencia: poné tu país por defecto (cambiá "AR" si hace falta)
                        defaultCountry="AR"
                        international
                        placeholder="Ej: +54 9 11 1234-5678"
                        value={phone}
                        onChange={(val) => {
                          const v = (val as string) || "";
                          setPhone(v);
                          // revalida al escribir si ya había error
                          if (errors.phone) validateField("phone", v);
                        }}
                        onBlur={() => validateField("phone", phone)}
                        className={cn(
                          // para que el conjunto botón-bandera + input conserve altura
                          "h-8"
                        )}
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
            </Card>

            {/*  <FloatingNav
              onBack={() => setStep(4)}
              onNext={createBooking}
              backDisabled={submitting}
              nextDisabled={
                submitting ||
                !allTimesChosen ||
                !fullName.trim() ||
                !email.trim() ||
                !phone.trim() ||
                !dni.trim()
              }
              nextLabel={submitting ? "Creando…" : "Confirmar Reserva"}
            /> */}

            <FloatingNav
              onBack={() => setStep(4)}
              onNext={createBooking}
              backDisabled={submitting}
              nextDisabled={
                submitting ||
                !allTimesChosen ||
                !fullName.trim() ||
                !email.trim() ||
                !phone.trim() ||
                !dni.trim() ||
                !!errors.fullName ||
                !!errors.email ||
                !!errors.phone ||
                !!errors.dni
              }
              nextLabel={submitting ? "Creando…" : "Confirmar Reserva"}
            />
          </>
        )}

        {step === 6 && bookingResult && (
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
                                      className="w-full sm:w-auto h-11 border-2 border-amber-300 hover:bg-amber-50"
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
                                          className="w-full sm:w-auto h-11 border-2 border-amber-300 hover:bg-amber-50"
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
                                        className="h-9 p-0 rounded-lg border-2 border-amber-300 hover:bg-amber-50"
                                        aria-label="Google Calendar"
                                      >
                                        <a
                                          href={buildGoogleCalendarUrl({
                                            title: `${singleBooking.service?.name}${singleBooking.professional?.name
                                              ? ` — ${singleBooking.professional.name}`
                                              : ""
                                              }`,
                                            startISO: singleBooking.start,
                                            endISO: singleBooking.end,
                                            details: "Reserva confirmada",
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
                                            className="h-10 w-10 p-0 rounded-lg border-2 border-amber-300 hover:bg-amber-50"
                                            aria-label="Google Calendar"
                                          >
                                            <a
                                              href={buildGoogleCalendarUrl({
                                                title: `${singleBooking.service?.name}${singleBooking?.professional?.name
                                                  ? ` — ${singleBooking.professional.name}`
                                                  : ""
                                                  }`,
                                                startISO: singleBooking.start,
                                                endISO: singleBooking.end,
                                                details: "Reserva confirmada",
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
                                        className="h-9 p-0 rounded-lg border-2 border-amber-300 hover:bg-amber-50"
                                        aria-label="Google Calendar"
                                      >
                                        <a
                                          href={buildGoogleCalendarUrl({
                                            title: `${b.service?.name}${b.professional?.name
                                              ? ` — ${b.professional.name}`
                                              : ""
                                              }`,
                                            startISO: b.start,
                                            endISO: b.end,
                                            details: "Reserva confirmada",
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
                                              className="h-9 w-9 p-0 rounded-lg border-2 border-amber-300 hover:bg-amber-50"
                                              aria-label="Google Calendar"
                                            >
                                              <a
                                                href={buildGoogleCalendarUrl({
                                                  title: `${b.service?.name}${b?.professional?.name
                                                    ? ` — ${b.professional.name}`
                                                    : ""
                                                    }`,
                                                  startISO: b.start,
                                                  endISO: b.end,
                                                  details: "Reserva confirmada",
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
                                    className="h-14 px-10 hover:opacity-85 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold shadow-xl border-0"
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
                      className="h-14 px-8 border-2 border-amber-300 hover:bg-amber-50 bg-white"
                      onClick={goToServices}
                    >
                      Nueva reserva
                    </Button>
                    <Button
                      size="lg"
                      disabled={submitting}
                      className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold shadow-xl border-0"
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
