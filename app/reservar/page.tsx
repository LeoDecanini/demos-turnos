"use client"

import {CalendarCheck, ArrowLeft, Sparkles, Clock, Users} from "lucide-react"
import Link from "next/link"
import {Badge} from "@/components/ui/badge"
import ReusableBadge from "@/components/reusable-badge";
import {Button} from "@/components/ui/button";
import {FaWhatsapp} from "react-icons/fa6";

export default function ReservarPage() {
    return (
        <div className="min-h-svh bg-gradient-to-br from-gray-50 via-white to-amber-50/30 relative overflow-hidden">
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]"></div>
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,191,36,0.05),transparent_50%)]"></div>

            <div className="relative flex h-svh items-center justify-center px-4">
                <div
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 flex flex-col items-center text-center max-w-2xl mx-auto">
                    <ReusableBadge>
                        Sistema de Reservas
                    </ReusableBadge>

                    <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-600 w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-xl">
                        <CalendarCheck className="w-5 h-5 text-white"/>
                    </div>

                    <h1 className="text-1xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3 leading-tight">
                        Formulario de Reservas
                    </h1>

                    <div
                        className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-3 rounded-full"></div>

                    <p className="text-gray-600 mb-4 leading-relaxed max-w-lg">
                        Estamos trabajando en esta sección. Muy pronto vas a poder hacer tus reservas desde acá de forma
                        rápida y
                        sencilla.
                    </p>

                    {/*<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
                            <div
                                className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-yellow-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <Clock className="w-6 h-6 text-white"/>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Horarios Flexibles</h3>
                                <p className="text-gray-600 text-sm">Elegí el horario que mejor te convenga</p>
                            </div>

                            <div
                                className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-yellow-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <Sparkles className="w-6 h-6 text-white"/>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Todos los Servicios</h3>
                                <p className="text-gray-600 text-sm">Acceso a todos nuestros tratamientos</p>
                            </div>

                            <div
                                className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-yellow-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <Users className="w-6 h-6 text-white"/>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Equipo Profesional</h3>
                                <p className="text-gray-600 text-sm">Reservá con nuestros especialistas</p>
                            </div>
                        </div>*/}

                    <Link href={"/"}>
                        <Button
                            size="lg"
                            className="h-14 px-8 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-xl border-0 transition-all duration-300 hover:scale-105"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2"/>
                            Volver al Inicio
                        </Button>
                    </Link>

                    <div
                        className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-amber-50/50 rounded-2xl border border-gray-100">
                        <p className="text-gray-700 font-medium mb-2">Mientras tanto, escribinos por</p>
                        <Link
                            href="https://wa.me/5491124013754"
                            target={"_blank"}
                            className="flex items-center justify-center gap-1 text-amber-600 hover:text-amber-700 font-semibold transition-colors duration-300"
                        >
                            <FaWhatsapp/> WhatsApp
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
