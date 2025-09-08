"use client"

import {ChevronUp} from "lucide-react"
import {useEffect, useState} from "react";

export function ScrollTopButton() {
    const [showScrollTop, setShowScrollTop] = useState(false)

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true)
            } else {
                setShowScrollTop(false)
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, []);

    return (
        <>
            {showScrollTop && (
                <div className="fixed bottom-6 left-3 sm:left-6 z-50">
                    <button
                        onClick={scrollToTop}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors duration-200 animate-in fade-in slide-in-from-bottom-5 cursor-pointer"
                        aria-label="Volver arriba"
                    >
                        <ChevronUp className="h-6 w-6"/>
                    </button>
                </div>
            )}
        </>
    )
}
