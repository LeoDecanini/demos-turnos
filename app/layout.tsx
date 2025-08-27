import type React from "react"
import "@/app/globals.css"
import {Inter} from "next/font/google"
import {SiteHeader} from "@/components/site-header"
import {SiteFooter} from "@/components/site-footer"

const inter = Inter({subsets: ["latin"]})

export const metadata = {
    title: "BeautyCenter - Centro de Medicina Estética",
    description: "Centro especializado en tratamientos faciales, corporales y medicina estética avanzada.",
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
        <body className={inter.className}>
        <SiteHeader/>
        <main>{children}</main>
        <SiteFooter/>
        </body>
        </html>
    )
}
