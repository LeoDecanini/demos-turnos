"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    ArrowLeft,
    CreditCard,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ServiceList, { type ServiceItem } from "@/components/ServiceList";
import ProfessionalList from "@/components/ProfessionalList";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/components/BookingStepper";

type Service = ServiceItem;

type Professional = {
    _id: string;
    name: string;
    photo?: { path?: string };
};

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
        service: {
            name: string;
            price: number;
            currency: string;
        };
        professional: {
            name: string;
        };
        start: string;
        end: string;
    };
    payment?: {
        required: boolean;
        amount: number;
        currency: string;
        initPoint: string;
        sandboxInitPoint: string;
    };
    message: string;
};

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`;
const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID as string;

const getPayload = (raw: any) => raw?.data ?? raw;

export default function ReservarPage() {
    const [step, setStep] = useState(1);

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

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dni, setDni] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        dni?: string;
    }>({});

    const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateField = (
        name: "firstName" | "lastName" | "email" | "phone" | "dni",
        value: string
    ) => {
        let msg = "";
        const v = value?.trim() || "";
        if (name === "firstName" && v.length < 2) msg = "Ingresá un nombre válido";
        if (name === "lastName" && v.length < 2) msg = "Ingresá un apellido válido";
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

    const validateAll = () => {
        const ok1 = validateField("firstName", firstName);
        const ok2 = validateField("lastName", lastName);
        const ok3 = validateField("email", email);
        const ok4 = validateField("phone", phone);
        const ok5 = validateField("dni", dni);
        return ok1 && ok2 && ok3 && ok4 && ok5;
    };

    const timeSectionRef = useRef<HTMLDivElement | null>(null);

    const scrollToTimes = () => {
        const el = timeSectionRef.current;
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 86;
        window.scrollTo({ top: y, behavior: "smooth" });
    };

    const serviceChosen = useMemo(
        () => services.find((s) => s._id === selectedService),
        [services, selectedService]
    );

    const professionalChosen = useMemo(
        () =>
            selectedProfessional !== "any"
                ? professionals.find((p) => p._id === selectedProfessional)
                : undefined,
        [professionals, selectedProfessional]
    );

    const formatDateForAPI = (date: Date) => format(date, "yyyy-MM-dd");
    const getCurrentMonth = (date: Date) => format(date, "yyyy-MM");

    useEffect(() => {
        const load = async () => {
            setLoadingServices(true);
            try {
                const res = await fetch(`${API_BASE}/services?accountId=${ACCOUNT_ID}`, {
                    cache: "no-store",
                });
                if (!res.ok) throw new Error("No se pudieron cargar los servicios");
                const raw = await res.json();
                const cfg: DepositCfg | undefined = raw?.config?.deposit;
                const payload = getPayload(raw);
                const list: ServiceWithDeposit[] = Array.isArray(payload)
                    ? payload
                    : payload?.items ?? [];
                const listWithDeposit = applyDepositPolicy(list, cfg);
                setServices(listWithDeposit as Service[]);
                if (listWithDeposit.length === 0)
                    toast.error("No hay servicios disponibles en este momento");
            } catch (e) {
                setServices([]);
                toast.error("Error al cargar los servicios");
            } finally {
                setLoadingServices(false);
            }
        };
        load();
    }, []);

    const loadProfessionals = async (serviceId: string) => {
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
            const list: Professional[] = Array.isArray(payload)
                ? payload
                : payload?.items ?? [];
            setProfessionals(list);
            setSelectedProfessional("any");
        } catch (e) {
            setProfessionals([]);
            setSelectedProfessional("any");
            toast.error("Error al cargar los profesionales");
        } finally {
            setLoadingProfessionals(false);
        }
    };

    const loadAvailableDays = async (
        serviceId: string,
        professionalId: string | undefined
    ) => {
        if (!serviceId) return;
        const currentDate = new Date();
        const month = getCurrentMonth(currentDate);
        setLoadingDays(true);
        try {
            const params = new URLSearchParams();
            params.set("accountId", ACCOUNT_ID);
            params.set("service", serviceId);
            params.set("month", month);
            if (professionalId && professionalId !== "any") {
                params.set("professional", professionalId);
            }
            const res = await fetch(`${API_BASE}/available-days?${params.toString()}`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("No se pudieron cargar los días disponibles");
            const raw = await res.json();
            const payload = getPayload(raw);

            let dates: any[] = [];
            if (Array.isArray(payload)) dates = payload;
            else if (Array.isArray(payload?.days)) dates = payload.days;
            else if (Array.isArray(payload?.items)) dates = payload.items;

            if (dates.length && typeof dates[0] !== "string") {
                dates = dates.map((d: any) => d?.date).filter(Boolean);
            }

            setAvailableDays(dates as string[]);
        } catch (e) {
            setAvailableDays([]);
            toast.error("Error al cargar los días disponibles");
        } finally {
            setLoadingDays(false);
        }
    };

    const loadTimeSlots = async (
        serviceId: string,
        professionalId: string | undefined,
        date: Date
    ) => {
        const dateStr = formatDateForAPI(date);
        if (!serviceId || !availableDays.includes(dateStr)) return;
        setLoadingSlots(true);
        try {
            const params = new URLSearchParams();
            params.set("accountId", ACCOUNT_ID);
            params.set("service", serviceId);
            params.set("date", dateStr);
            if (professionalId && professionalId !== "any") {
                params.set("professional", professionalId);
            }
            const res = await fetch(`${API_BASE}/day-slots?${params.toString()}`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("No se pudieron cargar los horarios");
            const raw = await res.json();
            const payload = getPayload(raw);
            const slots: string[] = Array.isArray(payload)
                ? payload
                : payload?.slots ?? payload?.items ?? [];
            setTimeSlots(slots);
            setSelectedTime("");
            if (slots.length === 0)
                toast.info("No hay horarios disponibles para esta fecha");
        } catch (e) {
            setTimeSlots([]);
            setSelectedTime("");
            toast.error("Error al cargar los horarios");
        } finally {
            setLoadingSlots(false);
        }
    };

    const isDateAvailable = (date: Date) =>
        availableDays.includes(formatDateForAPI(date));

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const createBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;
        if (!validateAll()) {
            toast.error("Revisá los campos resaltados");
            return;
        }
        const fullName = [firstName?.trim(), lastName?.trim()]
            .filter(Boolean)
            .join(" ")
            .trim();
        if (!fullName || !email || !phone || !dni) return;

        setSubmitting(true);
        try {
            const dateStr = formatDateForAPI(selectedDate);
            const res = await fetch(`${API_BASE}/create-booking/${ACCOUNT_ID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service: selectedService,
                    professional:
                        selectedProfessional !== "any" ? selectedProfessional : undefined,
                    day: dateStr,
                    hour: selectedTime,
                    client: { name: fullName, email, phone, dni },
                    notes: notes?.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const msg =
                    getPayload(err)?.message || err?.message || "No se pudo crear la reserva";
                throw new Error(msg);
            }
            const bookingResponse: BookingResponse = await res.json();
            setBookingResult(bookingResponse);
            if (bookingResponse.booking.depositRequired) {
                toast.success("¡Reserva creada! Necesitás pagar la seña para confirmar");
            } else {
                toast.success("¡Reserva confirmada exitosamente!");
            }
            setStep(5);
            scrollToTop();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg--gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
            <div className="mt-12 relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-4">
                    <BookingStepper step={step} />
                </div>

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
                                    onSelect={(id) => {
                                        setSelectedService(id);
                                        setProfessionals([]);
                                        setSelectedProfessional("any");
                                        setAvailableDays([]);
                                        setSelectedDate(undefined);
                                        setTimeSlots([]);
                                        setSelectedTime("");
                                        setStep(2);
                                        setLoadingProfessionals(true);
                                        void loadProfessionals(id);
                                        scrollToTop();
                                    }}
                                />
                            )}

                            <div className="text-center mt-6">
                                <Button
                                    size="lg"
                                    disabled={!selectedService || submitting}
                                    className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        setStep(2);
                                        setLoadingProfessionals(true);
                                        void loadProfessionals(selectedService);
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

                {step === 2 && (
                    <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                        <div className="space-y-8">
                            <div className="text-center mb-4">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí el profesional</h2>
                                <p className="text-gray-600 text-lg">
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
                                            scrollToTop();
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
                                        setStep(1);
                                        scrollToTop();
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
                                        setStep(3);
                                        setAvailableDays([]);
                                        setSelectedDate(undefined);
                                        setTimeSlots([]);
                                        setSelectedTime("");
                                        setLoadingDays(true);
                                        void loadAvailableDays(selectedService, selectedProfessional);
                                        scrollToTop();
                                    }}
                                >
                                    Continuar
                                    <Calendar className="ml-3 h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                        <div className="space-y-8">
                            <div className="text-center mb-4">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí fecha y horario</h2>
                                <p className="text-gray-600 text-lg">Seleccioná una fecha disponible y luego el horario que prefieras</p>
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
                                                            scrollToTimes();
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
                                            <p className="text-sm text-red-500 text-center">Esta fecha no está disponible</p>
                                        )}
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
                                        ) : !selectedDate ? (
                                            <p className="text-gray-600">Elegí una fecha para ver los horarios.</p>
                                        ) : !isDateAvailable(selectedDate) ? (
                                            <p className="text-gray-600">Esta fecha no está disponible.</p>
                                        ) : timeSlots.length === 0 ? (
                                            <p className="text-gray-600">No hay horarios disponibles para esta fecha.</p>
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

                            <div className="flex justify-center space-x-4 mt-4">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    disabled={submitting}
                                    className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                                    onClick={() => {
                                        setStep(2);
                                        scrollToTop();
                                    }}
                                >
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    Volver
                                </Button>
                                <Button
                                    size="lg"
                                    disabled={
                                        submitting ||
                                        !selectedService ||
                                        !selectedDate ||
                                        !selectedTime ||
                                        !isDateAvailable(selectedDate)
                                    }
                                    className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                    onClick={() => {
                                        setStep(4);
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

                {step === 4 && (
                    <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                        <div className="space-y-8">
                            <div className="text-center mb-4">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Tus datos de contacto</h2>
                                <p className="text-gray-600 text-lg">Completá la información para confirmar tu reserva</p>
                            </div>

                            <Card>
                                <CardContent className="space-y-6">
                                    <fieldset
                                        disabled={submitting}
                                        className={submitting ? "opacity-60 pointer-events-none select-none" : ""}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.firstName
                                                            ? "border-red-500 focus:ring-red-500"
                                                            : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
                                                        }`}
                                                    placeholder="Tu nombre"
                                                    value={firstName}
                                                    onChange={(e) => {
                                                        setFirstName(e.target.value);
                                                        if (errors.firstName) validateField("firstName", e.target.value);
                                                    }}
                                                    onBlur={(e) => validateField("firstName", e.target.value)}
                                                    aria-invalid={!!errors.firstName}
                                                />
                                                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.lastName
                                                            ? "border-red-500 focus:ring-red-500"
                                                            : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
                                                        }`}
                                                    placeholder="Tu apellido"
                                                    value={lastName}
                                                    onChange={(e) => {
                                                        setLastName(e.target.value);
                                                        if (errors.lastName) validateField("lastName", e.target.value);
                                                    }}
                                                    onBlur={(e) => validateField("lastName", e.target.value)}
                                                    aria-invalid={!!errors.lastName}
                                                />
                                                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.email
                                                        ? "border-red-500 focus:ring-red-500"
                                                        : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
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

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                                            <input
                                                type="tel"
                                                className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.phone
                                                        ? "border-red-500 focus:ring-red-500"
                                                        : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
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

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-1.5 !outline-none border-2 rounded-xl focus:ring-1.5 transition-all duration-300 ${errors.dni
                                                        ? "border-red-500 focus:ring-red-500"
                                                        : "border-gray-200 focus:ring-amber-500 focus:border-amber-500"
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

                                        <div>
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
                                        setStep(3);
                                        scrollToTop();
                                    }}
                                >
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    Volver
                                </Button>
                                <Button
                                    size="lg"
                                    disabled={
                                        submitting ||
                                        !selectedService ||
                                        !selectedDate ||
                                        !selectedTime ||
                                        !firstName.trim() ||
                                        !lastName.trim() ||
                                        !email.trim() ||
                                        !phone.trim() ||
                                        !dni.trim()
                                    }
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

                {step === 5 && bookingResult && (
                    <div className={submitting ? "pointer-events-none opacity-60" : ""}>
                        <div className="text-center space-y-8">
                            <div className="max-w-2xl mx-auto">
                                <div
                                    className={`rounded-3xl p-10 border backdrop-blur-sm ${bookingResult.booking.depositRequired
                                            ? "bg-gradient-to-br from-amber-50/60 to-yellow-50/40 border-amber-200"
                                            : "bg-gradient-to-br from-emerald-50/60 to-green-50/40 border-green-200"
                                        }`}
                                >
                                    <div className="flex items-center justify-center">
                                        <div
                                            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${bookingResult.booking.depositRequired
                                                    ? "bg-gradient-to-r from-amber-500 to-yellow-600"
                                                    : "bg-gradient-to-r from-green-500 to-emerald-600"
                                                }`}
                                        >
                                            {bookingResult.booking.depositRequired ? (
                                                <CreditCard className="h-10 w-10 text-white" />
                                            ) : (
                                                <CheckCircle className="h-10 w-10 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ring-1 ring-inset ${bookingResult.booking.depositRequired
                                                    ? "bg-amber-100 text-amber-900 ring-amber-200"
                                                    : "bg-emerald-100 text-emerald-900 ring-emerald-200"
                                                }`}
                                        >
                                            {bookingResult.booking.depositRequired ? "Acción requerida" : "Listo"}
                                        </div>

                                        <h2 className="text-3xl font-extrabold text-gray-900">
                                            {bookingResult.booking.depositRequired ? "¡Reserva creada!" : "¡Reserva confirmada!"}
                                        </h2>

                                        <p className="text-base text-gray-600">{bookingResult.message}</p>
                                    </div>

                                    {bookingResult.booking.depositRequired && bookingResult.payment && (
                                        <div className="mt-8 rounded-2xl border border-amber-200 bg-white/80 p-6 text-left">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">Seña a abonar</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {money(bookingResult.payment.amount)}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                                    Mercado Pago
                                                </span>
                                            </div>

                                            <div className="mt-5">
                                                <Button
                                                    className="h-12 w-full sm:w-auto px-6 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow-lg border-0 transition-transform hover:scale-[1.02]"
                                                    onClick={() => {
                                                        const link = bookingResult.payment!.initPoint;
                                                        navigator.clipboard
                                                            .writeText(link)
                                                            .then(() => toast.success("Link de pago copiado al portapapeles"))
                                                            .catch(() => toast.error("No se pudo copiar el link"));
                                                    }}
                                                >
                                                    <img src="/mercadopago.png" alt="Mercado Pago" className="h-4 mr-2" />
                                                    Copiar link de pago
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 grid gap-6">
                                        <div className="rounded-2xl bg-white border p-6 text-left">
                                            <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu reserva</h3>
                                            <div className="divide-y divide-gray-100">
                                                <div className="py-3 flex items-center justify-between">
                                                    <span className="text-gray-600">Servicio</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {bookingResult.booking.service.name}
                                                    </span>
                                                </div>
                                                <div className="py-3 flex items-center justify-between">
                                                    <span className="text-gray-600">Profesional</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {bookingResult.booking.professional.name}
                                                    </span>
                                                </div>
                                                <div className="py-3 flex items-center justify-between">
                                                    <span className="text-gray-600">Fecha</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {format(new Date(bookingResult.booking.start), "PPP", { locale: es })}
                                                    </span>
                                                </div>
                                                <div className="py-3 flex items-center justify-between">
                                                    <span className="text-gray-600">Hora</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {format(new Date(bookingResult.booking.start), "HH:mm")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {!bookingResult.booking.depositRequired && (
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                                <p className="text-sm text-emerald-800">
                                                    Tu turno quedó confirmado. Te enviamos un correo con el detalle.
                                                </p>
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
                                        setStep(1);
                                        setSelectedService("");
                                        setProfessionals([]);
                                        setSelectedProfessional("any");
                                        setSelectedDate(undefined);
                                        setAvailableDays([]);
                                        setTimeSlots([]);
                                        setSelectedTime("");
                                        setFirstName("");
                                        setLastName("");
                                        setEmail("");
                                        setPhone("");
                                        setDni("");
                                        setNotes("");
                                        setBookingResult(null);
                                        scrollToTop();
                                    }}
                                >
                                    Nueva reserva
                                </Button>

                                <Button
                                    size="lg"
                                    disabled={submitting}
                                    className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold shadow-xl border-0 transition-transform hover:scale-[1.02]"
                                    asChild
                                >
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

const money = (n?: number, currency = "ARS") =>
    typeof n === "number"
        ? n
            .toLocaleString("es-AR", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            })
            .replace(/\s/g, "")
        : "";
