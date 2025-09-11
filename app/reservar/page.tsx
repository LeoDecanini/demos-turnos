"use client";

import {useEffect, useMemo, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";
import {toast} from "sonner";
import {Calendar as CalendarComponent} from "@/components/ui/calendar";
import {format} from "date-fns";
import {es} from "date-fns/locale";

// Lista reutilizable (agrupa por categoría)
import ServiceList, {type ServiceItem} from "@/components/ServiceList";
import ProfessionalList from "@/components/ProfessionalList";
import {Skeleton} from "@/components/ui/skeleton";
import {SiMercadopago} from "react-icons/si";

type Service = ServiceItem;

type Professional = {
    _id: string;
    name: string;
    photo?: { path?: string };
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

// helper para extraer data real desde data.data
const getPayload = (raw: any) => raw?.data ?? raw;

export default function ReservarPage() {
    // -------- Steps --------
    // 1 Servicio -> 2 Profesional -> 3 Fecha/Hora -> 4 Datos -> 5 Confirmación
    const [step, setStep] = useState(1);

    // ---- Paso 1: Servicios ----
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [selectedService, setSelectedService] = useState<string>("");

    // ---- Paso 2: Profesional (con "Indistinto") ----
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<string>("any"); // "any" = indistinto

    // ---- Paso 3: Días y horarios ----
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [availableDays, setAvailableDays] = useState<string[]>([]); // YYYY-MM-DD[]
    const [loadingDays, setLoadingDays] = useState(false);

    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string>("");

    // ---- Paso 4: Datos cliente ----
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dni, setDni] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ---- Paso 5: Confirmación ----
    const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

    // ------- Helpers -------
    const money = (n?: number) =>
        typeof n === "number"
            ? n
                .toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                })
                .replace(/\s/g, "") // elimina cualquier espacio
            : ""


    const serviceChosen = useMemo(() => services.find((s) => s._id === selectedService), [services, selectedService]);

    const professionalChosen = useMemo(
        () => (selectedProfessional !== "any" ? professionals.find((p) => p._id === selectedProfessional) : undefined),
        [professionals, selectedProfessional],
    );

    const formatDateForAPI = (date: Date) => format(date, "yyyy-MM-dd");
    const getCurrentMonth = (date: Date) => format(date, "yyyy-MM");

    // ------- Fetch servicios al cargar -------
    useEffect(() => {
        const load = async () => {
            setLoadingServices(true);
            try {
                const res = await fetch(`${API_BASE}/services?accountId=${ACCOUNT_ID}`, {cache: "no-store"});
                if (!res.ok) throw new Error("No se pudieron cargar los servicios");
                const raw = await res.json();
                const payload = getPayload(raw);
                const list: Service[] = Array.isArray(payload) ? payload : (payload?.items ?? []);
                setServices(list);
                if (list.length === 0) {
                    toast.error("No hay servicios disponibles en este momento");
                }
            } catch (e) {
                console.error(e);
                setServices([]);
                toast.error("Error al cargar los servicios");
            } finally {
                setLoadingServices(false);
            }
        };
        load();
    }, []);

    // ------- Cargas asíncronas (no bloquean el cambio de step) -------
    const loadProfessionals = async (serviceId: string) => {
        if (!serviceId) return;
        setLoadingProfessionals(true);
        try {
            const res = await fetch(`${API_BASE}/services/${serviceId}/professionals?accountId=${ACCOUNT_ID}`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("No se pudieron cargar los profesionales");
            const raw = await res.json();
            const payload = getPayload(raw);
            const list: Professional[] = Array.isArray(payload) ? payload : (payload?.items ?? []);
            setProfessionals(list);
            console.log({proffs: list})
            setSelectedProfessional("any");
        } catch (e) {
            console.error(e);
            setProfessionals([]);
            setSelectedProfessional("any");
            toast.error("Error al cargar los profesionales");
        } finally {
            setLoadingProfessionals(false);
        }
    };

    const loadAvailableDays = async (serviceId: string, professionalId: string | undefined) => {
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
            const res = await fetch(`${API_BASE}/available-days?${params.toString()}`, {cache: "no-store"});
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
            console.error(e);
            setAvailableDays([]);
            toast.error("Error al cargar los días disponibles");
        } finally {
            setLoadingDays(false);
        }
    };

    const loadTimeSlots = async (serviceId: string, professionalId: string | undefined, date: Date) => {
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
            const res = await fetch(`${API_BASE}/day-slots?${params.toString()}`, {cache: "no-store"});
            if (!res.ok) throw new Error("No se pudieron cargar los horarios");
            const raw = await res.json();
            const payload = getPayload(raw);
            const slots: string[] = Array.isArray(payload) ? payload : (payload?.slots ?? payload?.items ?? []);
            setTimeSlots(slots);
            setSelectedTime("");
            if (slots.length === 0) toast.info("No hay horarios disponibles para esta fecha");
        } catch (e) {
            console.error(e);
            setTimeSlots([]);
            setSelectedTime("");
            toast.error("Error al cargar los horarios");
        } finally {
            setLoadingSlots(false);
        }
    };

    // ------- Crear reserva (Paso 4 -> Paso 5) -------
    const createBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;
        const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim();
        if (!fullName || !email || !phone || !dni) return;

        setSubmitting(true);
        try {
            const dateStr = formatDateForAPI(selectedDate);
            const res = await fetch(`${API_BASE}/create-booking/${ACCOUNT_ID}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    service: selectedService,
                    professional: selectedProfessional !== "any" ? selectedProfessional : undefined,
                    day: dateStr,
                    hour: selectedTime,
                    client: {name: fullName, email, phone, dni},
                    notes: notes?.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const msg = getPayload(err)?.message || err?.message || "No se pudo crear la reserva";
                throw new Error(msg);
            }

            const bookingResponse: BookingResponse = await res.json();
            setBookingResult(bookingResponse);

            if (bookingResponse.booking.depositRequired) {
                toast.success("¡Reserva creada! Necesitas pagar la seña para confirmar");
            } else {
                toast.success("¡Reserva confirmada exitosamente!");
            }

            setStep(5);
            scrollToTop();
        } catch (e) {
            console.error(e);
            toast.error((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const isDateAvailable = (date: Date) => availableDays.includes(formatDateForAPI(date));

    const scrollToTop = () => {
        window.scrollTo({top: 0, behavior: "smooth"});
    }

    // -------- UI --------
    return (
        <div className="min-h-screen bg--gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
            <div
                className="absolute inset-0 bg--[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]"/>
            <div className="mt-12 relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-4">
                        {[
                            {number: 1, title: "Servicio", icon: Heart},
                            {number: 2, title: "Profesional", icon: User},
                            {number: 3, title: "Fecha y Hora", icon: Calendar},
                            {number: 4, title: "Datos", icon: User},
                            {number: 5, title: "Confirmación", icon: CheckCircle},
                        ].map((s, i) => (
                            <div key={i} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                                        step >= s.number
                                            ? "bg-gradient-to-r from-amber-500 to-yellow-600 border-amber-500 text-white shadow-lg"
                                            : "border-gray-300 text-gray-400 bg-white"
                                    }`}
                                >
                                    <s.icon className="h-5 w-5"/>
                                </div>
                                <span
                                    className={`ml-2 font-medium ${step >= s.number ? "text-amber-600" : "text-gray-400"}`}>
                  {s.title}
                </span>
                                {i < 4 && <div
                                    className={`w-8 h-0.5 mx-4 ${step > s.number ? "bg-amber-500" : "bg-gray-300"}`}/>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Servicios */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Elegí tu tratamiento</h2>
                            <p className="text-gray-600 text-lg">Seleccioná el servicio que te interesa</p>
                        </div>

                        {loadingServices ? (
                            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow border overflow-hidden">
                                <Skeleton className={"h-[760px] w-full"}/>
                            </div>
                        ) : services.length === 0 ? (
                            <p className="text-center text-gray-600">No hay servicios disponibles.</p>
                        ) : (
                            <ServiceList
                                services={services}
                                selectedId={selectedService}
                                onSelect={(id) => {
                                    // Avanza YA al paso 2 y muestra loading mientras trae profesionales
                                    setSelectedService(id);
                                    // limpiar estados de pasos posteriores
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

                        {/* Botón accesible (opcional) */}
                        <div className="text-center mt-6">
                            <Button
                                size="lg"
                                disabled={!selectedService}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                    setStep(2);
                                    setLoadingProfessionals(true);
                                    void loadProfessionals(selectedService);
                                    scrollToTop();
                                }}
                            >
                                Continuar
                                <User className="ml-3 h-6 w-6"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Profesional */}
                {step === 2 && (
                    <div className="space-y-8">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí el profesional</h2>
                            <p className="text-gray-600 text-lg">
                                Podés seleccionar <b>Indistinto</b> para que asignemos uno automáticamente
                            </p>
                        </div>

                        {loadingProfessionals ? (
                            <div className={"max-w-3xl mx-auto"}>
                                <Skeleton className={"h-20 w-full"}/>
                                <div className="mt-4 bg-white rounded-xl shadow border overflow-hidden">
                                    <Skeleton className={"h-20 border rounded-bl-none rounded-br-none w-full"}/>
                                    <Skeleton className={"h-20 border rounded-none w-full"}/>
                                    <Skeleton className={"h-20 border rounded-tl-none rounded-tr-none w-full"}/>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto">
                                {/* Opción “Indistinto” arriba de la lista */}
                                <div
                                    className={`mb-4 rounded-xl border-2 cursor-pointer transition-colors px-4 py-3 ${
                                        selectedProfessional === "any"
                                            ? "border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50"
                                            : "border-gray-200 hover:border-amber-300 bg-white/80"
                                    }`}
                                    onClick={() => setSelectedProfessional("any")}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-gray-900">Indistinto</div>
                                        <span
                                            className="text-xs px-3 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-semibold">
                                              Automático
                                            </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Podés seleccionar Indistinto para que asignemos uno automáticamente </p>
                                </div>

                                <ProfessionalList
                                    professionals={professionals}
                                    selectedId={selectedProfessional === "any" ? undefined : selectedProfessional}
                                    onSelect={(id) => setSelectedProfessional(id)}
                                    backendBaseUrl={process.env.NEXT_PUBLIC_CDN_URL || ""}
                                />
                            </div>
                        )}


                        <div className="flex justify-center space-x-4 mt-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                                onClick={() => {
                                    setStep(1)
                                    scrollToTop();
                                }}
                            >
                                <ArrowLeft className="mr-2 h-5 w-5"/>
                                Volver
                            </Button>
                            <Button
                                size="lg"
                                disabled={!selectedService || loadingProfessionals}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                onClick={() => {
                                    // Avanza YA al paso 3 y muestra loading mientras trae días disponibles
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
                                <Calendar className="ml-3 h-6 w-6"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Fecha y Hora */}
                {step === 3 && (
                    <div className="space-y-8">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Elegí fecha y horario</h2>
                            <p className="text-gray-600 text-lg">Seleccioná una fecha disponible y luego el horario que
                                prefieras</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <Card className="">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <Calendar className="h-5 w-5 mr-2 text-amber-500"/>
                                        Seleccionar Fecha
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex justify-center">
                                        {!loadingDays ?
                                            <CalendarComponent
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    setSelectedDate(date);
                                                    if (date && isDateAvailable(date)) {
                                                        setLoadingSlots(true);
                                                        setTimeSlots([]);
                                                        setSelectedTime("");
                                                        void loadTimeSlots(selectedService, selectedProfessional, date);
                                                    } else {
                                                        setTimeSlots([]);
                                                        setSelectedTime("");
                                                    }
                                                }}
                                                disabled={(date) => {
                                                    // Disable past dates (comparación a medianoche)
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    const d = new Date(date);
                                                    d.setHours(0, 0, 0, 0);
                                                    if (d < today) return true;
                                                    // Habilitar solo días disponibles si ya los tenemos
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
                                            /> : <>
                                                <div className={"w-full"}>
                                                    <Skeleton className={"h-[248px] w-full"}/>
                                                </div>
                                            </>
                                        }
                                    </div>
                                    {selectedDate && availableDays.length > 0 && !isDateAvailable(selectedDate) && (
                                        <p className="text-sm text-red-500 text-center">Esta fecha no está
                                            disponible</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Horarios */}
                            {/*<Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">*/}
                            <Card className="">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-amber-500"/>
                                        Horarios Disponibles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingSlots ? (
                                        <div className="grid grid-cols-3 gap-3">
                                        {/*array de 24 skeletons*/}
                                            {Array.from({length: 18}).map((_, i) =>
                                                <Skeleton key={i} className="h-9 w-full"/>)
                                            }
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
                                                    className={`h-12 transition-all duration-300 ${
                                                        selectedTime === time
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
                                className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                                onClick={() => {
                                    setStep(2)
                                    scrollToTop();
                                }}
                            >
                                <ArrowLeft className="mr-2 h-5 w-5"/>
                                Volver
                            </Button>
                            <Button
                                size="lg"
                                disabled={!selectedService || !selectedDate || !selectedTime || !isDateAvailable(selectedDate)}
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                onClick={() => {
                                    setStep(4)
                                    scrollToTop();
                                }}
                            >
                                Continuar
                                <User className="ml-3 h-6 w-6"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Datos del cliente */}
                {step === 4 && (
                    <div className="space-y-8">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tus datos de contacto</h2>
                            <p className="text-gray-600 text-lg">Completá la información para confirmar tu reserva</p>
                        </div>

                        <Card className="">
                            {/*<CardHeader>
                                <CardTitle
                                    className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Información Personal
                                </CardTitle>
                            </CardHeader>*/}
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                            placeholder="Tu nombre"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                            placeholder="Tu apellido"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="+54 11 1234-5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        placeholder="Tu DNI"
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Comentarios
                                        (opcional)</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-1.5 !outline-none border-2 border-gray-200 rounded-xl focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 resize-none"
                                        placeholder="¿Alguna consulta o requerimiento especial?"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center space-x-4 mt-4">
                            <Button
                                variant="outline"
                                size="lg"
                                disabled={submitting}
                                className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                                onClick={() => {
                                    setStep(3)
                                    scrollToTop();
                                }}
                            >
                                <ArrowLeft className="mr-2 h-5 w-5"/>
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
                                <CheckCircle className="ml-3 h-6 w-6"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 5: Confirmación */}
                {step === 5 && bookingResult && (
                    <div className="text-center space-y-8">
                        <div className="max-w-2xl mx-auto">
                            <div
                                className={`rounded-3xl p-12 border ${
                                    bookingResult.booking.depositRequired
                                        ? "bg-gradient-to-r from-amber-100/15 to-yellow-100/15 border-amber-200"
                                        : "bg-gradient-to-r from-green-100/15 to-emerald-100/15 border-green-200"
                                }`}
                            >
                                <div
                                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                                        bookingResult.booking.depositRequired
                                            ? "bg-gradient-to-r from-amber-500 to-yellow-600"
                                            : "bg-gradient-to-r from-green-500 to-emerald-600"
                                    }`}
                                >
                                    {bookingResult.booking.depositRequired ? (
                                        <CreditCard className="h-10 w-10 text-white"/>
                                    ) : (
                                        <CheckCircle className="h-10 w-10 text-white"/>
                                    )}
                                </div>

                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    {bookingResult.booking.depositRequired ? "¡Reserva Creada!" : "¡Reserva Confirmada!"}
                                </h2>

                                <p className="text-lg text-gray-600 mb-4">{bookingResult.message}</p>

                                {bookingResult.booking.depositRequired && bookingResult.payment && (
                                    <div className="rounded-2xl p-6 mt-0 pt-0">
                                        <div className="flex items-center justify-center mb-4">
                                            <CreditCard className="h-6 w-6 text-amber-500 mr-2"/>
                                            <h3 className="font-semibold text-gray-900 text-lg">Seña: {money(bookingResult.payment.amount)}</h3>
                                        </div>
                                        {/*<p className="text-gray-600 mb-4">
                                            Para confirmar tu reserva, necesitas pagar una seña de{" "}
                                            <span
                                                className="font-bold text-amber-600">{money(bookingResult.payment.amount)}</span>
                                        </p>*/}
                                        <Button
                                            size="lg"
                                            className="w-full h-14 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                                            onClick={() => {
                                                window.open(bookingResult.payment!.initPoint, "_blank");
                                                toast.success("Redirigiendo al pago...");
                                            }}
                                        >
                                            <img src={"/mercadopago.png"} alt={"Mercado Pago Logo"} className={"h-4"} />
                                            Pagar con Mercado Pago
                                        </Button>
                                    </div>
                                )}

                                <div className="bg-white border rounded-2xl p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu reserva:</h3>
                                    <div className="space-y-3 text-left">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Servicio:</span>
                                            <span className="font-semibold">{bookingResult.booking.service.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Profesional:</span>
                                            <span
                                                className="font-semibold">{bookingResult.booking.professional.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha:</span>
                                            <span className="font-semibold">
                        {format(new Date(bookingResult.booking.start), "PPP", {locale: es})}
                      </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Hora:</span>
                                            <span
                                                className="font-semibold">{format(new Date(bookingResult.booking.start), "HH:mm")}</span>
                                        </div>
                                        {/*<div className="flex justify-between">
                                            <span className="text-gray-600">Estado:</span>
                                            <Badge
                                                variant={bookingResult.booking.status === "confirmed" ? "default" : "secondary"}>
                                                {bookingResult.booking.status === "pending" ? "Pendiente" : "Confirmada"}
                                            </Badge>
                                        </div>
                                        {bookingResult.booking.depositRequired && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Estado del pago:</span>
                                                <Badge
                                                    variant={bookingResult.booking.depositStatus === "paid" ? "default" : "destructive"}>
                                                    {bookingResult.booking.depositStatus === "unpaid" ? "Pendiente" : "Pagado"}
                                                </Badge>
                                            </div>
                                        )}*/}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-8 border-2 border-amber-300 hover:bg-amber-50 bg-transparent"
                                onClick={() => {
                                    // reset para nueva reserva
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
                                Nueva Reserva
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                                asChild
                            >
                                <Link href="/">Volver al Inicio</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
