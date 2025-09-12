"use client";

import { useMemo } from "react";
import { Check, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ServiceCategory = {
    _id: string;
    name: string;
    description?: string;
};

export type ServiceItem = {
    _id: string;
    name: string;
    description?: string;
    /** Duración de UNA sesión (en minutos) */
    sessionDuration?: number;
    /** Cantidad de sesiones que incluye el servicio */
    sessionsCount?: number;
    /** Precio total (base) del servicio */
    price?: number;
    /** Moneda del precio (p.ej. "ARS") */
    currency?: string;
    /** Badge opcional */
    popular?: boolean;
    /** Categoría populada */
    category?: ServiceCategory | null;
    depositRequired?: boolean;
    depositValue?: number;
    depositType?: 'percent' | 'fixed' | null;
};

type Props = {
    services: ServiceItem[];
    selectedId?: string;
    /** Se llama al clickear un servicio. */
    onSelect: (serviceId: string) => void | Promise<void>;
    /** Opcional: alto del contenedor scroll (default: h-[calc(100vh-theme(spacing.40))]) */
    heightClassName?: string;
};

/**
 * Lista de servicios agrupada por CATEGORÍA (sticky headers).
 * Muestra: duración (min), sesiones, precio y badge “Popular”.
 */

const money = (n?: number, currency = "ARS") =>
    typeof n === "number"
        ? n
            .toLocaleString("es-AR", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            })
            .replace(/\s/g, "") // elimina cualquier espacio
        : ""

export default function ServiceList({
    services,
    selectedId,
    onSelect,
    heightClassName,
}: Props) {
    const groups = useMemo(() => {
        // Agrupar por categoría (nombre); fallback "Sin categoría"
        const byCat: Record<string, ServiceItem[]> = {};
        for (const s of services) {
            const catName = (s.category?.name || "Sin categoría").trim();
            if (!byCat[catName]) byCat[catName] = [];
            byCat[catName].push(s);
        }
        // Ordenar categorías alfabéticamente y, dentro, por nombre de servicio
        return Object.entries(byCat)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(
                ([cat, arr]) =>
                    [cat, arr.sort((a, b) => a.name.localeCompare(b.name))] as const
            );
    }, [services]);

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow border overflow-hidden">
            <div
                className={cn(
                    "relative overflow-y-auto",
                )}
            >
                {groups.map(([categoryName, items]) => (
                    <section key={categoryName}>
                        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border-b border-gray-200 px-4 py-2">
                            <h2 className="font-semibold text-gray-800 tracking-wide">
                                {categoryName}
                            </h2>
                        </div>

                        <ul>
                            {items.map((s) => {
                                const selected = selectedId === s._id;
                                return (
                                    <li
                                        key={s._id}
                                        className={cn(
                                            "flex gap-4 px-4 py-4 border-b border-gray-100 cursor-pointer transition-colors",
                                            "hover:bg-amber-50/40",
                                            selected && "bg-amber-50"
                                        )}
                                        onClick={() => onSelect(s._id)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 truncate">
                                                    {s.name}
                                                </span>
                                                {s.popular && (
                                                    <span className="inline-flex items-center text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Popular
                                                    </span>
                                                )}
                                            </div>

                                            {s.description && (
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {s.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-700">
                                                <span className="inline-flex items-center">
                                                    <Clock className="w-4 h-4 mr-1 text-amber-500" />
                                                    {s.sessionDuration
                                                        ? `${s.sessionDuration} min`
                                                        : "Duración variable"}
                                                </span>

                                                {s.sessionsCount != null && s.sessionsCount > 0 && (
                                                    <span className="inline-flex items-center">
                                                        {s.sessionsCount === 1
                                                            ? "1 sesión"
                                                            : `${s.sessionsCount} sesiones`}
                                                    </span>
                                                )}

                                                {s.price != null && (
                                                    <span className="font-semibold text-amber-700">
                                                        {money(s.price, s.currency)}
                                                    </span>
                                                )}
                                                {
                                                    s.depositRequired && s.depositValue != null && s.depositType != null && (
                                                        <span className="inline-flex items-center text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Seña: {s.depositType === 'percent' ? `${s.depositValue}%` : money(s.depositValue, s.currency)}
                                                        </span>
                                                    )
                                                }
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                "mt-1 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                                selected
                                                    ? "bg-amber-500 border-amber-500"
                                                    : "border-gray-300"
                                            )}
                                        >
                                            {selected && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
