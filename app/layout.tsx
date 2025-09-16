import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { ScrollTopButton } from "@/components/scroll-to-top"
import { Suspense } from "react"
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "./auth/AuthProvider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
    title: "MG Estética 22 - Centro de Medicina Estética",
    description:
        "Centro especializado en medicina estética con tecnología de vanguardia. Tratamientos faciales, corporales y rejuvenecimiento. Sistema de turnos moveup.",
    keywords:
        "medicina estética, tratamientos faciales, rejuvenecimiento, botox, rellenos, depilación láser, MG Estética 22",
    authors: [{ name: "MG Estética 22" }],
    creator: "MG Estética 22",
    publisher: "MG Estética 22",
    generator: "v0.app",
    openGraph: {
        title: "MG Estética 22 - Centro de Medicina Estética Premium",
        description: "Centro especializado en medicina estética con tecnología de vanguardia",
        type: "website",
        locale: "es_AR",
    },
    twitter: {
        card: "summary_large_image",
        title: "MG Estética 22 - Centro de Medicina Estética Premium",
        description: "Centro especializado en medicina estética con tecnología de vanguardia",
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body className="antialiased">
                <Suspense fallback={null}>
                    <AuthProvider>
                    <SiteHeader />
                        {children}
                        <Toaster position="top-center" />
                    </AuthProvider>
                    <SiteFooter />
                    <WhatsAppButton />
                    <ScrollTopButton />
                </Suspense>
            </body>
        </html>
    )
}
