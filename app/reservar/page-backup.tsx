"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, CheckCircle, ArrowLeft, CreditCard, UserPlus, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ServiceList, { type ServiceItem } from "@/components/ServiceList";
import ProfessionalList from "@/components/ProfessionalList";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/components/BookingStepper";
import { useAuth } from "../auth/AuthProvider";

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

type Service = ServiceItem;
type Professional = { _id: string; name: string; photo?: { path?: string } };

type DepositType = "FIXED" | "PERCENT";
type ServiceWithDeposit = Service & {
  depositRequired?: boolean;
  depositType?: DepositType;
  depositValue?: number;
  usesGlobalDepositConfig?: boolean;
};
type DepositCfg = {
  allowOverrideOnService: boolean;
  defaultRequired: boolean;
  defaultType: DepositType;
  defaultValue: number;
  rounding?: { enabled?: boolean; decimals?: number };
};
const applyDepositPolicy = (list: ServiceWithDeposit[], cfg?: DepositCfg) => {
  if (!cfg) return list;
  if (cfg.allowOverrideOnService === false)
    return list.map((s) => ({ ...s, depositRequired: cfg.defaultRequired, depositType: cfg.defaultType, depositValue: cfg.defaultValue }));
  return list.map((s) => (s.usesGlobalDepositConfig ? { ...s, depositRequired: cfg.defaultRequired, depositType: cfg.defaultType, depositValue: cfg.defaultValue } : s));
};

type BookingResponse = {
  success: boolean;
  booking: {
    _id: string;
    status: string;
    paymentStatus: string;
    depositRequired: boolean;
    depositAmount?: number;
    depositCurrency?: string;
    depositStatus?: string;
    depositInitPoint?: string;
    depositSandboxInitPoint?: string;
    service: { name: string; price: number; currency: string };
    professional: { name: string };
    start: string;
    end: string;
    client?: any;
  };
  payment?: { required: boolean; amount: number; currency: string; initPoint: string; sandboxInitPoint: string };
  message: string;
};

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`;
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string;

const getPayload = (raw: any) => raw?.data ?? raw;
const fmtDay = (date: Date) => format(date, "yyyy-MM-dd");
const fmtMonth = (date: Date) => format(date, "yyyy-MM");

export default function ReservarPage() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();

  // Gate
  const [gateLoading, setGateLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState<string | null>(null);

  // Selección
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<string>("");

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<string>("any");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());

  // Cliente
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  type Branch = {
    _id: string;
    name: string;
    description?: string;
    default?: boolean;
    active: boolean;
    location?: { addressLine?: string; city?: string; state?: string; postalCode?: string; country?: string };
  };

  const disableAllDays = !loadingDays && availableDays.length === 0;
  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const formatBranchAddress = (b?: Branch) =>
    b ? [b.location?.addressLine, b.location?.city, b.location?.state, b.location?.postalCode, b.location?.country].filter(Boolean).join(", ") : "";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Flag de UX para mostrar/ocultar el paso Sucursal en el stepper
  const [hasBranchStep, setHasBranchStep] = useState(false);

  const timeSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollToTimes = () => {
    const el = timeSectionRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 86;
    window.scrollTo({ top: y, behavior: "smooth" });
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const serviceChosen = useMemo(() => services.find((s) => s._id === selectedService), [services, selectedService]);
  const professionalChosen = useMemo(() => (selectedProfessional !== "any" ? professionals.find((p) => p._id === selectedProfessional) : undefined), [professionals, selectedProfessional]);

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

  // Validaciones
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

  // Helpers
  const resetCalendar = () => {
    setAvailableDays([]);
    setSelectedDate(undefined);
    setTimeSlots([]);
    setSelectedTime("");
    setVisibleMonth(new Date());
  };

  const selectedBranch = useMemo(() => branches.find((b) => b._id === selectedBranchId), [branches, selectedBranchId]);
  const selectedBranchAddress = useMemo(() => formatBranchAddress(selectedBranch), [selectedBranch]);

  const includeBranchInStepper = hasBranchStep && step !== 1;

  const goToServices = () => {
    setSelectedBranchId("");
    setBranches([]);
    setHasBranchStep(false);
    setStep(1);
    scrollToTop();
  };

  // Preflight servicios
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
        const list: ServiceWithDeposit[] = Array.isArray(payload) ? payload : payload?.items ?? [];
        const listWithDeposit = applyDepositPolicy(list, cfg);
        setServices(listWithDeposit as Service[]);
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

  // Cargar sucursales para un servicio (decide siguiente paso)
  const loadBranchesByService = async (serviceId: string) => {
    if (!serviceId || isBlocked) return;
    setLoadingBranches(true);
    try {
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const res = await fetch(`${API_BASE}/${slug}/services/${serviceId}/branches`, { cache: "no-store" });
      const raw = await res.json().catch(() => ({}));
      if (raw?.message === "Reservas bloqueadas") {
        setIsBlocked(true);
        setBlockMsg("Reservas bloqueadas");
        return;
      }
      const payload = getPayload(raw);
      const list: Branch[] = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
      list.sort((a, b) => Number(!!b.default) - Number(!!a.default) || a.name.localeCompare(b.name));
      setBranches(list);

      if (list.length <= 1) {
        // No hay paso sucursal
        setHasBranchStep(false);
        const branchId = list[0]?._id;
        if (branchId) setSelectedBranchId(branchId);
        // Avanzar a profesionales
        setLoadingProfessionals(true);
        await loadProfessionalsByServiceAndBranch(serviceId, branchId!);
        setStep(3);
        scrollToTop();
      } else {
        // Hay paso sucursal
        setHasBranchStep(true);
        setStep(2);
        scrollToTop();
      }
    } catch {
      setBranches([]);
      toast.error("Error al cargar las sucursales de este servicio");
    } finally {
      setLoadingBranches(false);
    }
  };

  // Profesionales por servicio+sucursal
  const loadProfessionalsByServiceAndBranch = async (serviceId: string, branchId: string) => {
    if (!serviceId || !branchId || isBlocked) return;
    setLoadingProfessionals(true);
    try {
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const url = `${API_BASE}/${slug}/services/${serviceId}/branches/${branchId}/professionals`;
      const res = await fetch(url, { cache: "no-store" });
      const raw = await res.json().catch(() => ({}));
      if (raw?.message === "Reservas bloqueadas") {
        setIsBlocked(true);
        setBlockMsg("Reservas bloqueadas");
        return;
      }
      const payload = getPayload(raw);
      const list: Professional[] = Array.isArray(payload) ? payload : payload?.items ?? [];
      setProfessionals(list);

      // 🔴 borramos el redirect automático al único profesional
      setSelectedProfessional("any");
    } catch {
      setProfessionals([]);
      setSelectedProfessional("any");
      toast.error("Error al cargar los profesionales");
    } finally {
      setLoadingProfessionals(false);
    }
  };


  // Profesionales solo por servicio (fallback si no hay branch API, casi no se usa en este flujo)
  const loadProfessionals = async (serviceId: string) => {
    if (!serviceId || isBlocked) return;
    setLoadingProfessionals(true);
    try {
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const url = `${API_BASE}/${slug}/services/${serviceId}/professionals`;
      const res = await fetch(url, { cache: "no-store" });
      const raw = await res.json().catch(() => ({}));
      if (raw?.message === "Reservas bloqueadas") {
        setIsBlocked(true);
        setBlockMsg("Reservas bloqueadas");
        return;
      }
      const payload = getPayload(raw);
      const list: Professional[] = Array.isArray(payload) ? payload : payload?.items ?? [];
      setProfessionals(list);

      if (list.length === 1) {
        const only = list[0];
        setSelectedProfessional(only._id);
        resetCalendar();
        await loadAvailableDays(serviceId, only._id, fmtMonth(visibleMonth));
        setStep(3);
        scrollToTop();
      } else {
        setSelectedProfessional("any");
      }
    } catch {
      setProfessionals([]);
      setSelectedProfessional("any");
      toast.error("Error al cargar los profesionales");
    } finally {
      setLoadingProfessionals(false);
    }
  };

  // Días disponibles
  const loadAvailableDays = async (serviceId: string, professionalId: string | undefined, monthStr?: string) => {
    if (!serviceId || isBlocked) return;
    const month = monthStr ?? fmtMonth(visibleMonth);
    setLoadingDays(true);
    try {
      const params = new URLSearchParams();
      params.set("service", serviceId);
      params.set("month", month);
      if (professionalId && professionalId !== "any") params.set("professional", professionalId);

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
      toast.error("Error al cargar los días disponibles");
    } finally {
      setLoadingDays(false);
    }
  };

  const handleMonthChange = async (newMonth: Date) => {
    setVisibleMonth(newMonth);
    await loadAvailableDays(selectedService, selectedProfessional, fmtMonth(newMonth));
  };

  // Horarios
  const loadTimeSlots = async (serviceId: string, professionalId: string | undefined, date: Date) => {
    if (isBlocked) return;
    const dateStr = fmtDay(date);
    if (!serviceId || !availableDays.includes(dateStr)) return;
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams();
      params.set("service", serviceId);
      params.set("date", dateStr);
      if (professionalId && professionalId !== "any") params.set("professional", professionalId);
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
      setSelectedTime("");
      if (slots.length === 0) toast.info("No hay horarios disponibles para esta fecha");
    } catch {
      setTimeSlots([]);
      setSelectedTime("");
      toast.error("Error al cargar los horarios");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Crear reserva
  const createBooking = async () => {
    if (isBlocked) return;
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!validateAll()) {
      toast.error("Revisá los campos resaltados");
      return;
    }
    const fullNameStr = fullName.trim();
    if (!fullNameStr || !email || !phone || !dni) return;

    const tz = "America/Argentina/Buenos_Aires";
    const dateStr = fmtDay(selectedDate!);
    const startISO = `${dateStr}T${selectedTime}:00`;

    setSubmitting(true);
    try {
      const slug = SUBDOMAIN ?? (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
      const res = await fetch(`${API_BASE}/${slug}/create-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selectedService,
          professional: selectedProfessional !== "any" ? selectedProfessional : undefined,
          day: dateStr,
          branch: selectedBranchId || undefined,
          hour: selectedTime,
          startISO,
          timezone: tz,
          client: { name: fullNameStr, email, phone, dni },
          notes: notes?.trim() || undefined,
          indistint: selectedProfessional === "any",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = getPayload(err)?.message || err?.message || "No se pudo crear la reserva";
        throw new Error(msg);
      }

      const bookingResponse: BookingResponse = await res.json();
      setBookingResult(bookingResponse);
      if (bookingResponse.booking.depositRequired) toast.success("¡Reserva creada! Necesitás pagar la seña para confirmar");
      else toast.success("¡Reserva confirmada exitosamente!");
      setStep(hasBranchStep ? 6 : 6);
      scrollToTop();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // UIs gate
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
        <Card className="max-w-md w-full border-amber-300/50">
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

  // Página
  return (
    <div className="min-h-screen bg--gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
      <div className="mt-12 relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-4">
          <BookingStepper step={step} includeBranchStep={includeBranchInStepper} />
        </div>

        {/* Paso 1: Servicio */}
        {step === 1 && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            <div className="space-y-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí tu tratamiento</h2>
                <p className="text-gray-600 text-lg">Seleccioná el servicio que te interesa</p>
              </div>

              {loadingServices ? (
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow border overflow-hidden">
                  <Skeleton className="h-[760px] w-full" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-center text-gray-600">No hay servicios disponibles.</p>
              ) : (
                <ServiceList
                  services={services}
                  selectedId={selectedService}
                  onSelect={async (id) => {
                    setSelectedService(id);

                    // limpiar siempre estado de sucursales al entrar a servicio
                    setSelectedBranchId("");
                    setBranches([]);
                    setHasBranchStep(false);

                    // limpiar profesionales y calendario
                    setProfessionals([]);
                    setSelectedProfessional("any");
                    resetCalendar();

                    // cargar sucursales y avanzar automáticamente
                    setLoadingBranches(true);
                    await loadBranchesByService(id);
                  }}
                />
              )}

              <div className="text-center mt-6">
                <Button
                  size="lg"
                  disabled={!selectedService || submitting}
                  className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={async () => {
                    if (!selectedService) return;
                    // si el usuario prefiere “Continuar”, aseguramos sucursales cargadas y avanzamos igual
                    if (!branches.length) {
                      setLoadingBranches(true);
                      await loadBranchesByService(selectedService);
                      return;
                    }
                    if (branches.length === 1) {
                      setHasBranchStep(false);
                      setSelectedBranchId(branches[0]._id);
                      setLoadingProfessionals(true);
                      await loadProfessionalsByServiceAndBranch(selectedService, branches[0]._id);
                      setStep(3);
                      scrollToTop();
                      return;
                    }
                    setHasBranchStep(true);
                    setStep(2);
                    scrollToTop();
                  }}
                >
                  Continuar
                  <User className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Sucursales (solo si hay >1) */}
        {step === 2 && hasBranchStep && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            <div className="space-y-8">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí la sucursal</h2>
                <p className="text-gray-600 text-lg">Mostramos solo las sucursales donde se brinda el servicio seleccionado</p>
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
                    <p className="text-gray-600">No hay sucursales disponibles para este servicio.</p>
                  ) : (
                    <div className="grid gap-3">
                      {branches.map((b) => {
                        const addr = [b.location?.addressLine, b.location?.city, b.location?.state, b.location?.country].filter(Boolean).join(", ");
                        const selected = selectedBranchId === b._id;
                        return (
                          <button
                            key={b._id}
                            type="button"
                            onClick={() => setSelectedBranchId(b._id)}
                            className={`text-left w-full rounded-xl border-2 px-4 py-3 transition-colors ${selected ? "border-amber-500 bg-amber-50/60" : "border-gray-200 hover:border-amber-300 bg-white"
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-900">
                                {b.name} {b.default && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Default</span>}
                              </div>
                              <div className="text-xs text-gray-500">{b.active ? "Activa" : "Inactiva"}</div>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{addr || "—"}</div>
                            {b.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{b.description}</div>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center space-x-4 mt-4">
                <Button variant="outline" size="lg" disabled={submitting} className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent" onClick={goToServices}>
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Volver
                </Button>
                <Button
                  size="lg"
                  disabled={!selectedBranchId || submitting}
                  className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  onClick={() => {
                    setStep(3);
                    setLoadingProfessionals(true);
                    setProfessionals([]);
                    setSelectedProfessional("any");
                    resetCalendar();
                    void loadProfessionalsByServiceAndBranch(selectedService, selectedBranchId);
                    scrollToTop();
                  }}
                >
                  Continuar
                  <User className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Profesional */}
        {step === 3 && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            <div className="space-y-8">
              {!loadingProfessionals && (
                <div className="max-w-3xl mx-auto">
                  {professionals.length > 1 && (
                    <div
                      className={`mb-4 rounded-xl border-2 cursor-pointer transition-colors px-4 py-3 ${selectedProfessional === "any" ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50" : "border-gray-200 hover:border-amber-300 bg-white/80"
                        }`}
                      onClick={() => {
                        setSelectedProfessional("any");
                        setStep(3);
                        resetCalendar();
                        setLoadingDays(true);
                        void loadAvailableDays(selectedService, undefined);
                        scrollToTop();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">Indistinto</div>
                        <span className="text-xs px-3 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-semibold">Automático</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Podés seleccionar Indistinto para que asignemos uno automáticamente</p>
                    </div>
                  )}

                  <ProfessionalList
                    professionals={professionals}
                    selectedId={selectedProfessional === "any" ? undefined : selectedProfessional}
                    onSelect={(id) => {
                      setSelectedProfessional(id);
                      setStep(3);
                      resetCalendar();
                      setLoadingDays(true);
                      void loadAvailableDays(selectedService, id);
                      scrollToTop();
                    }}
                    backendBaseUrl={process.env.NEXT_PUBLIC_CDN_URL || ""}
                  />
                </div>
              )}

              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={submitting}
                  className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                  onClick={() => {
                    if (hasBranchStep) setStep(2);
                    else goToServices();
                  }}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Volver
                </Button>
                <Button
                  size="lg"
                  disabled={!selectedService || loadingProfessionals || submitting}
                  className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  onClick={() => {
                    setStep(4);
                    resetCalendar();
                    setLoadingDays(true);
                    void loadAvailableDays(selectedService, selectedProfessional);
                    scrollToTop();
                  }}
                >
                  Continuar
                  <CalendarIcon className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 4: Fecha y horarios */}
        {step === 4 && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            <div className="space-y-8">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí fecha y horario</h2>
                <p className="text-gray-600 text-lg">Seleccioná una fecha disponible y luego el horario que prefieras</p>
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
                          selected={selectedDate}
                          month={visibleMonth}
                          onMonthChange={handleMonthChange}
                          onSelect={async (date) => {
                            setSelectedDate(date || undefined);
                            if (date && availableDays.includes(fmtDay(date))) {
                              scrollToTimes();
                              setLoadingSlots(true);
                              setTimeSlots([]);
                              setSelectedTime("");
                              await loadTimeSlots(selectedService, selectedProfessional, date);
                            } else {
                              setTimeSlots([]);
                              setSelectedTime("");
                            }
                          }}
                          // 🔴 acá el cambio:
                          disabled={(date) => {
                            // mientras carga → todo deshabilitado (evita clicks “fantasma”)
                            if (loadingDays) return true;
                            // si no hay días disponibles → todo deshabilitado
                            if (disableAllDays) return true;
                            // no permitir pasado
                            if (isPast(date)) return true;
                            // si hay lista, solo permitir los que llegaron del backend
                            return !availableDays.includes(fmtDay(date));
                          }}
                          locale={es}
                          className="rounded-xl border-2 border-amber-200 max-w-none w-full"
                          classNames={{
                            months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
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
                    {selectedDate && availableDays.length > 0 && !availableDays.includes(fmtDay(selectedDate)) && (
                      <p className="text-sm text-red-500 text-center">Esta fecha no está disponible</p>
                    )}
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
                    ) : !selectedDate ? (
                      <p className="text-gray-600">Elegí una fecha para ver los horarios.</p>
                    ) : !availableDays.includes(fmtDay(selectedDate)) ? (
                      <p className="text-gray-600">Esta fecha no está disponible.</p>
                    ) : timeSlots.length === 0 ? (
                      <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            className={`h-12 transition-all duration-300 ${selectedTime === time ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg border-0" : "border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50"
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

              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={submitting}
                  className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                  onClick={() => {
                    setStep(3);
                    scrollToTop();
                  }}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Volver
                </Button>
                <Button
                  size="lg"
                  disabled={submitting || !selectedService || !selectedDate || !selectedTime || !availableDays.includes(fmtDay(selectedDate))}
                  className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  onClick={() => {
                    setStep(5);
                    scrollToTop();
                  }}
                >
                  Continuar
                  <User className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 5: Datos del cliente */}
        {step === 5 && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            <div className="space-y-8">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Tus datos de contacto</h2>
                <p className="text-gray-600 text-lg">Completá la información para confirmar tu reserva</p>
              </div>

              <Card className="relative">
                {submitting && <div className="bg-white/70 flex items-center justify-center rounded-xl absolute w-full h-full top-0 left-0 z-10">Creando su reserva...</div>}
                <CardContent className="space-y-6">
                  <fieldset disabled={!!user || submitting} className={submitting ? "opacity-60 pointer-events-none select-none" : ""}>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                      <input
                        type="text"
                        className={`${user ? "opacity-60" : ""} w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.fullName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
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
                      {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        className={`${user ? "opacity-60" : ""} w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
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
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                      <input
                        type="tel"
                        className={`${user ? "opacity-60" : ""} w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
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
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                      <input
                        type="text"
                        className={`${user ? "opacity-60" : ""} w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.dni ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
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
                      {errors.dni && <p className="mt-1 text-sm text-red-600">{errors.dni}</p>}
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Comentarios (opcional)</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 resize-none"
                        placeholder="¿Alguna consulta o requerimiento especial?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </fieldset>
                </CardContent>
              </Card>

              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={submitting}
                  className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                  onClick={() => {
                    setStep(4);
                    scrollToTop();
                  }}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Volver
                </Button>
                <Button
                  size="lg"
                  disabled={submitting || !selectedService || !selectedDate || !selectedTime || !fullName.trim() || !email.trim() || !phone.trim() || !dni.trim()}
                  className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  onClick={createBooking}
                >
                  {submitting ? "Creando…" : "Confirmar Reserva"}
                  <CheckCircle className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 6: Resultado */}
        {step === 6 && bookingResult && (
          <div className={submitting ? "pointer-events-none opacity-60" : ""}>
            <div className="text-center space-y-8">
              <div className="max-w-2xl mx-auto">
                <div
                  className={`rounded-3xl p-4 sm:p-10 border backdrop-blur-sm ${bookingResult.booking.depositRequired ? "bg-gradient-to-br from-amber-50/60 to-yellow-50/40 border-amber-200" : "bg-gradient-to-br from-emerald-50/60 to-green-50/40 border-green-200"
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${bookingResult.booking.depositRequired ? "bg-gradient-to-r from-amber-500 to-yellow-600" : "bg-gradient-to-r from-green-500 to-emerald-600"
                        }`}
                    >
                      {bookingResult.booking.depositRequired ? <CreditCard className="h-10 w-10 text-white" /> : <CheckCircle className="h-10 w-10 text-white" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ring-1 ring-inset ${bookingResult.booking.depositRequired ? "bg-amber-100 text-amber-900 ring-amber-200" : "bg-emerald-100 text-emerald-900 ring-emerald-200"
                        }`}
                    >
                      {bookingResult.booking.depositRequired ? "Acción requerida" : "Listo"}
                    </div>

                    <h2 className="text-3xl font-extrabold text-gray-900">{bookingResult.booking.depositRequired ? "¡Reserva Pendiente!" : "¡Reserva confirmada!"}</h2>

                    <p className="text-black text-xl">{bookingResult.message}</p>
                  </div>

                  {bookingResult.booking.depositRequired && bookingResult.payment && (
                    <div className="mt-8 rounded-2xl border border-amber-200 bg-white/80 p-6 text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Seña a abonar</p>
                          <p className="text-2xl font-bold text-gray-900">{money(bookingResult.payment.amount)}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">Mercado Pago</span>
                      </div>

                      {bookingResult?.payment!.initPoint && (
                        <div className="mt-5 flex gap-2">
                          <Button
                            className="h-12 w-full flex-1 px-6 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow-lg border-0 transition-transform hover:scale-[1.02]"
                            onClick={() => {
                              const link = bookingResult.payment!.initPoint;
                              window.open(link, "_blank")?.focus();
                            }}
                          >
                            <img src="/mercadopago.png" alt="Mercado Pago" className="h-4 mr-2" />
                            Abrir Mercado Pago
                          </Button>

                          <Button
                            variant="outline"
                            className="h-12 w-full flex-1"
                            onClick={() => {
                              const link = bookingResult.payment!.initPoint;
                              navigator.clipboard.writeText(link).then(() => toast.success("Link de pago copiado al portapapeles")).catch(() => toast.error("No se pudo copiar el link"));
                            }}
                          >
                            Copiar link de pago
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {!bookingResult.booking.depositRequired && (
                    <div className="pt-10">
                      {(() => {
                        const title = `${bookingResult.booking.service.name}${bookingResult?.booking?.professional?.name ? ` — ${bookingResult.booking.professional.name}` : ""}`;
                        const details = (bookingResult.message ? bookingResult.message + "\n" : "") + `Reserva #${bookingResult.booking._id}`;
                        const gcalUrl = buildGoogleCalendarUrl({
                          title,
                          startISO: bookingResult.booking.start,
                          endISO: bookingResult.booking.end,
                          details,
                          location: selectedBranchAddress,
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
                  )}

                  <div className="mt-8 grid gap-6">
                    <div className="rounded-2xl bg-white border p-6 text-left">
                      <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu reserva</h3>
                      <div className="divide-y divide-gray-100">
                        <div className="py-3 flex items-center justify-between">
                          <span className="text-gray-600">Servicio</span>
                          <span className="font-semibold text-gray-900">{bookingResult.booking.service.name}</span>
                        </div>
                        <div className="py-3 flex items-center justify-between">
                          <span className="text-gray-600">Profesional</span>
                          <span className="font-semibold text-gray-900">{bookingResult?.booking?.professional?.name || "Profesional indistinto"}</span>
                        </div>
                        <div className="py-3 flex items-center justify-between">
                          <span className="text-gray-600">Fecha</span>
                          <span className="font-semibold text-gray-900">{format(new Date(bookingResult.booking.start), "PPP", { locale: es })}</span>
                        </div>
                        <div className="py-3 flex items-center justify-between">
                          <span className="text-gray-600">Hora</span>
                          <span className="font-semibold text-gray-900">{format(new Date(bookingResult.booking.start), "HH:mm")}</span>
                        </div>
                        <div className="py-3 flex items-center justify-between">
                          <span className="text-gray-600">Dirección</span>
                          <span className="font-semibold text-gray-900">{selectedBranchAddress || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {!bookingResult.booking.depositRequired && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <p className="text-sm text-emerald-800">Tu turno quedó confirmado. Te enviamos un correo con el detalle.</p>
                      </div>
                    )}

                    {bookingResult?.booking?.client?.email && (
                      <div className="pt-2">
                        <Link
                          href={`/verify-client?email=${encodeURIComponent(bookingResult.booking.client.email)}`}
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

                        <p className="mt-2 text-xs text-gray-500">Creá tu cuenta para ver y gestionar tus reservas más rápido.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  disabled={submitting}
                  className="h-14 px-8 border-2 border-amber-300 hover:bg-amber-50 bg-white"
                  onClick={() => {
                    // reset total
                    setStep(1);
                    setSelectedService("");
                    setProfessionals([]);
                    setSelectedProfessional("any");
                    resetCalendar();
                    setFullName("");
                    setEmail("");
                    setPhone("");
                    setDni("");
                    setNotes("");
                    setBookingResult(null);
                    // limpiar sucursales/flag
                    setBranches([]);
                    setSelectedBranchId("");
                    setHasBranchStep(false);
                    scrollToTop();
                  }}
                >
                  Nueva reserva
                </Button>

                <Button size="lg" disabled={submitting} className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold shadow-xl border-0 transition-transform hover:scale-[1.02]" asChild>
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

const money = (n?: number, currency = "ARS") => (typeof n === "number" ? n.toLocaleString("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).replace(/\s/g, "") : "");
