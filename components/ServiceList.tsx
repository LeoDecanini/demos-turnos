"use client"

import { Check, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export type ServiceCategory = {
  _id: string
  name: string
  description?: string
}

export type ServiceItem = {
  _id: string
  name: string
  description?: string
  sessionDuration?: number
  sessionsCount?: number
  price?: number
  currency?: string
  popular?: boolean
  category?: ServiceCategory | null
  depositRequired?: boolean
  depositValue?: number
  depositType?: "percent" | "fixed" | null
  // Campos calculados del backend
  depositAmountCalculated?: number
  depositRequiredCalculated?: boolean
  depositTypeCalculated?: "percent" | "fixed" | null
  depositCurrencyCalculated?: string
}

type Props = {
  services: ServiceItem[]
  selectedId?: string
  onSelect?: (serviceId: string) => void | Promise<void>
  selectedIds?: string[]
  onToggle?: (serviceId: string) => void
  maxSelectable?: number
  heightClassName?: string
}

const money = (n?: number, currency = "ARS") =>
  typeof n === "number"
    ? n
        .toLocaleString("es-AR", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        })
        .replace(/\s/g, "")
    : ""

export default function ServiceList({
  services,
  selectedId,
  onSelect,
  selectedIds,
  onToggle,
  maxSelectable = 3,
  heightClassName,
}: Props) {
  const isMulti = Array.isArray(selectedIds)

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5", heightClassName)}>
      {services.map((s) => {
        const selected = isMulti ? selectedIds!.includes(s._id) : selectedId === s._id
        const limitReached = isMulti && !selected && selectedIds!.length >= (maxSelectable ?? 3)
        const dur = s.sessionDuration

        return (
          <div
            key={s._id}
            className={cn(
              "relative bg-white rounded-lg border shadow-sm transition-all duration-200 cursor-pointer overflow-hidden",
              "hover:shadow-md hover:-translate-y-1",
              selected && "border-green-500 bg-green-50/40 shadow-md",
              !selected && "border-gray-200 hover:border-green-300",
              limitReached && "opacity-50 cursor-not-allowed hover:translate-y-0"
            )}
            onClick={() => {
              if (isMulti) {
                if (limitReached) return
                onToggle?.(s._id)
              } else {
                onSelect?.(s._id)
              }
            }}
          >
            {/* Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  selected ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                )}
              >
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>

            {/* Badges arriba a la derecha */}
            <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
              {s.popular && (
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full font-medium shadow-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Popular
                </span>
              )}
              {s.depositRequiredCalculated && s.depositAmountCalculated != null && s.depositTypeCalculated && (
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                  Seña:{" "}
                  {s.depositTypeCalculated === "percent" && (s.depositValue ?? 0) > 0 && (s.depositValue ?? 0) < 100
                    ? `${s.depositValue}%`
                    : money(s.depositAmountCalculated, s.depositCurrencyCalculated || s.currency)}
                </span>
              )}
            </div>

            {/* Contenido */}
            <div className="p-4 pt-8">
              <h3 className="font-semibold text-sm text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">
                {s.name}
              </h3>

              <div className="border-t border-gray-100 my-2"></div>

              {/* Duración y Sesiones */}
              <div className="flex items-center justify-between text-xs text-gray-700">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-green-500" />
                  <span>{dur ? `${dur} min` : "Variable"}</span>
                </div>
                {s.sessionsCount != null && s.sessionsCount > 0 && (
                  <div className="text-right">
                    {s.sessionsCount === 1 ? "1 sesión" : `${s.sessionsCount} sesiones`}
                  </div>
                )}
              </div>

              {/* Precio */}
              {s.price != null && (
                <div className="mt-4">
                  {s.price === 0 ? (
                    <span className="text-xl font-bold text-green-600">Pago en consultorio</span>
                  ) : (
                    <span className="text-2xl font-bold text-green-600">
                      {money(s.price, s.currency)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
