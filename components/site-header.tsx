"use client"

import {useState} from "react"
import Link from "next/link"
import {usePathname} from "next/navigation"
import {Button} from "@/components/ui/button"
import {CalendarCheck, Menu, X, Phone} from "lucide-react"
import {cn} from "@/lib/utils"

const navigation = [
    {name: "Inicio", href: "/"},
    {name: "Servicios", href: "/#servicios"},
    {name: "Sobre Nosotros", href: "/#equipo"},
    {name: "Contacto", href: "/#contacto"},
    {name: "Reservar", href: "/reservar"},
]

export function SiteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">Centro de Estética</span>
                        <div className="flex items-center">
                            <div
                                className="h-8 w-8 rounded-full bg-[url(/logo.jpg)] bg-center bg-contain">
                            </div>
                            <span className="ml-2 text-xl font-semibold text-gray-900">MG Estética 22</span>
                        </div>
                    </Link>
                </div>

                <div className="flex lg:hidden">
                    <Button size="sm" asChild className={"mr-2"}>
                        <Link href="/reservar">
                            <CalendarCheck className="mr-2 h-4 w-4"/> Reservar
                        </Link>
                    </Button>
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Abrir menú principal</span>
                        <Menu className="h-6 w-6" aria-hidden="true"/>
                    </button>
                </div>

                <div className="hidden lg:flex lg:gap-x-8">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-yellow-600",
                                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                                    ? "text-yellow-600"
                                    : "text-gray-700",
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
                    {/*<div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-yellow-600"/>
                        <span className="text-xs font-medium">11 1234-5678</span>
                    </div>*/}
                    <Button size="sm" asChild>
                        <Link href="/reservar">
                            <CalendarCheck className="mr-2 h-4 w-4"/> Reservar Cita
                        </Link>
                    </Button>
                </div>
            </nav>

            {/* Mobile menu */}
            <div className={cn("lg:hidden", mobileMenuOpen ? "fixed inset-0 z-50" : "hidden")}>
                <div className="fixed inset-0 bg-gray-900/80" aria-hidden="true"/>

                <div
                    className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                            <span className="sr-only">Centro de Estética</span>
                            <div className="flex items-center">
                                <div
                                    className="h-8 w-8 rounded-full bg-[url(/logo.jpg)] bg-center bg-contain">
                                </div>
                                <span className="ml-2 text-xl font-semibold text-gray-900">MG Estética 22</span>
                            </div>
                        </Link>
                        <button
                            type="button"
                            className="-m-2.5 rounded-md p-2.5 text-gray-700"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span className="sr-only">Cerrar menú</span>
                            <X className="h-6 w-6" aria-hidden="true"/>
                        </button>
                    </div>

                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7",
                                            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                                                ? "bg-gray-50 text-yellow-600"
                                                : "text-gray-900 hover:bg-gray-50",
                                        )}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="py-6">
                                <Button className="w-full" asChild>
                                    <Link href="/reservar" onClick={() => setMobileMenuOpen(false)}>
                                        <CalendarCheck className="mr-2 h-4 w-4"/> Reservar Cita
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
