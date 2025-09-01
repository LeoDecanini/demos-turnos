import {FaWhatsapp} from "react-icons/fa6";
import Link from "next/link";

export function WhatsAppButton() {
    return (
        <div className="fixed bottom-6 right-3 sm:right-6 z-50">
            <Link
                href={`https://wa.me/5491124013754?text=${encodeURIComponent("Hola! Me gustaría recibir más información.")}`}
                target={"_blank"}
                className={`bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-colors duration-200`}
                aria-label="Contactar por WhatsApp"
            >
                <FaWhatsapp className="h-8 w-8" />
            </Link>
        </div>
    )
}
