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
        "Centro especializado en nutrición personalizada. Planes de alimentación, asesoramiento nutricional y seguimiento personalizado. Sistema de turnos moveup.",
    keywords:
        "medicina estética, tratamientos faciales, rejuvenecimiento, botox, rellenos, depilación láser, MG Estética 22",
    authors: [{ name: "MG Estética 22" }],
    creator: "MG Estética 22",
    publisher: "MG Estética 22",
    openGraph: {
        title: "MG Estética 22 - Centro de Medicina Estética Premium",
        description:
            "Centro especializado en medicina estética con tecnología de vanguardia",
        type: "website",
        locale: "es_AR",
    },
    twitter: {
        card: "summary_large_image",
        title: "MG Estética 22 - Centro de Medicina Estética Premium",
        description:
            "Centro especializado en medicina estética con tecnología de vanguardia",
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <head>
                <link rel="manifest" href="/reservar/manifest.webmanifest" />
                <meta name="theme-color" content="#0a0a0a" />
                <Script id="pwa-boot-redirect" strategy="beforeInteractive">
                    {`
      (function () {
        var standalone =
          (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
          ('standalone' in navigator && navigator.standalone);
        if (standalone && !location.pathname.startsWith('/reservar')) {
          location.replace('/reservar/');
        }
      })();
    `}
                </Script>
            </head>
            <body className="antialiased">
                <Suspense fallback={null}>
                    <AuthProvider>
                        <SWRegisterReservar />
                        <StandalonePwaGuard />

                        {/* todo esto se oculta en modo PWA */}
                        <SiteHeader />

                        {children}

                        <Toaster position="top-center" />
                    </AuthProvider>

                    {/* también se ocultan en modo PWA */}
                    <SiteFooter />
                    <WhatsAppButton />
                    <ScrollTopButton />
                </Suspense>
            </body>
        </html>
    )
}
