"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Menu, X, Phone, User, Leaf } from "lucide-react"; // 👈 import User
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/auth/AuthProvider";

const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Servicios", href: "/#servicios" },
    { name: "Sobre Nosotros", href: "/#equipo" },
    /* { name: "Contacto", href: "/#contacto" }, */
    { name: "Reservar", href: "/reservar" },
];

export function SiteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth(); // 👈 solo leemos user; logout queda en /perfil

    return (
        <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">

                {/* Logo */}
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-md bg-[#4CCB89] flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="ml-2 text-xl font-semibold text-[#0A2E1F]">
                                NutriVida
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Desktop nav */}
                <div className="hidden lg:flex lg:gap-x-8">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-[#157347]",
                                pathname === item.href
                                    ? "text-[#157347]"
                                    : "text-gray-700"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Right actions */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">

                    {user ? (
                        <Link
                            href="/perfil"
                            className="inline-flex items-center gap-2 rounded-xl border border-[#4CCB89] bg-[#E8F9EF] px-3 py-1.5 text-sm font-medium text-[#0A2E1F] shadow-sm hover:bg-[#D6F3E3] transition"
                        >
                            <User className="h-4 w-4 text-[#0A2E1F]" />
                            Perfil
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-gray-100 transition"
                        >
                            Ingresar
                        </Link>
                    )}

                    <Button
                        size="sm"
                        className="bg-[#4CCB89] hover:bg-[#3BAB71] text-white shadow-sm"
                        asChild
                    >
                        <Link href="/reservar">
                            <CalendarCheck className="mr-2 h-4 w-4" /> Reservar Cita
                        </Link>
                    </Button>

                </div>

                {/* Mobile toggle */}
                <div className="flex lg:hidden">
                    <Button
                        size="sm"
                        className="bg-[#4CCB89] hover:bg-[#3BAB71] text-white shadow-sm mr-2"
                        asChild
                    >
                        <Link href="/reservar">
                            <CalendarCheck className="mr-2 h-4 w-4" /> Reservar
                        </Link>
                    </Button>

                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </nav>

            {/* Mobile menu (solo estética mejorada) */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-gray-900/40" />

                    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-white px-6 py-8 border-l border-gray-200">
                        {/* header */}
                        <div className="flex items-center justify-between">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-md bg-[#4CCB89] flex items-center justify-center">
                                        <Leaf className="h-5 w-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <span className="ml-2 text-xl font-semibold text-[#0A2E1F]">
                                        NutriVida
                                    </span>
                                </div>
                            </Link>

                            <button
                                className="rounded-md p-2.5 text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* contenido */}
                        <div className="mt-6 flex flex-col gap-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-base font-medium text-[#0A2E1F] hover:bg-[#F1FFF7] transition"
                                >
                                    {item.name}
                                </Link>
                            ))}

                            <Button
                                className="w-full bg-[#4CCB89] hover:bg-[#3BAB71] text-white shadow-sm mt-4"
                                asChild
                            >
                                <Link href="/reservar">Reservar Cita</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>

    );
}
