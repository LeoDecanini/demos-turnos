import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ScrollTopButton } from "@/components/scroll-to-top";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "./auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import SWRegisterReservar from "./reservar/SWRegisterReservar";
import StandalonePwaGuard from "./StandalonePwaGuard";
import Script from "next/script";

export const metadata: Metadata = {
    title: "NutriVida - Centro de Nutrición",
    description:
        "Centro especializado en nutrición personalizada. Planes de alimentación, asesoramiento nutricional y seguimiento personalizado. Sistema de turnos MoveUp.",
    keywords:
        "nutrición, nutricionista, planes de alimentación, asesoramiento nutricional, seguimiento, hábitos saludables, NutriVida",
    authors: [{ name: "NutriVida" }],
    creator: "NutriVida",
    publisher: "NutriVida",
    openGraph: {
        title: "NutriVida - Centro de Nutrición",
        description:
            "Centro especializado en nutrición personalizada con enfoque integral y tecnología de vanguardia.",
        type: "website",
        locale: "es_AR",
    },
    twitter: {
        card: "summary_large_image",
        title: "NutriVida - Centro de Nutrición",
        description:
            "Centro especializado en nutrición personalizada con enfoque integral y tecnología de vanguardia.",
    },
    robots: { index: true, follow: true },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <head>
                <meta name="theme-color" content="#0a0a0a" />
            </head>
            <body className="antialiased">
                <Suspense fallback={null}>
                    <AuthProvider>
                        {/*                         <SWRegisterReservar />
                        <StandalonePwaGuard /> */}

                        {/* todo esto se oculta en modo PWA */}
                        <SiteHeader />

                        {children}

                        <Toaster position="top-center" />
                    </AuthProvider>

                    {/* también se ocultan en modo PWA */}
                    <SiteFooter />
                    {/* <WhatsAppButton /> */}
                    {/* <ScrollTopButton /> */}
                </Suspense>
            </body>
        </html>
    )
}
