import { Heart, User, Calendar, CheckCircle, Building2 } from "lucide-react"
import * as React from "react"

type Step = { number: number; title: string; icon: React.ComponentType<{ className?: string }> }

export function BookingStepper({ step, includeBranchStep }: { step: number; includeBranchStep: boolean }) {
  // Pasos visibles (con o sin sucursal)
  const steps: Step[] = includeBranchStep
    ? [
        { number: 1, title: "Servicio", icon: Heart },
        { number: 2, title: "Sucursal", icon: Building2 },
        { number: 3, title: "Profesional", icon: User },
        { number: 4, title: "Fecha y Hora", icon: Calendar },
        { number: 5, title: "Datos", icon: User },
        { number: 6, title: "Confirmación", icon: CheckCircle },
      ]
    : [
        { number: 1, title: "Servicio", icon: Heart },
        { number: 2, title: "Profesional", icon: User },
        { number: 3, title: "Fecha y Hora", icon: Calendar },
        { number: 4, title: "Datos", icon: User },
        { number: 5, title: "Confirmación", icon: CheckCircle },
      ]

  // Mapeo del step "real" de la página (que siempre cuenta la sucursal como paso 2)
  // a un step "visual" del stepper cuando la sucursal no se muestra.
  // Página: 1(S), 2(B), 3(P), 4(F), 5(D), 6(C)
  // Sin sucursal => Visual: 1(S), 2(P), 3(F), 4(D), 5(C)
  const visualStep = includeBranchStep ? step : step <= 1 ? step : step - 1

  const maxStep = steps.length
  const pct = Math.max(0, Math.min(100, ((Math.min(visualStep, maxStep) - 1) / (maxStep - 1)) * 100))

  return (
    <nav aria-label="Progreso de la reserva" className="mx-auto w-full max-w-4xl pb-6 md:pb-8">
      <ol className="relative flex h-9 md:h-11 items-center justify-between">
        {/* Línea base + progreso */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-200">
          <div className="h-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>

        {steps.map((s, idx) => {
          // En el arreglo sin sucursal, los números van 1..5.
          // En el arreglo con sucursal, van 1..6.
          const number = idx + 1
          const isDone = visualStep > number
          const isCurrent = visualStep === number
          const Icon = s.icon

          return (
            <li key={s.title} className="relative z-10 flex items-center justify-center">
              <div
                className={[
                  "flex items-center justify-center rounded-full border transition-all duration-300",
                  "h-9 w-9 md:h-11 md:w-11",
                  isDone || isCurrent ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-500 shadow-lg" : "bg-white text-gray-400 border-gray-300",
                  isCurrent ? "ring-4 ring-amber-100" : "",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${number}. ${s.title}`}
                title={s.title}
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5" />
                {isDone && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </span>
                )}
              </div>

              {/* Título en absolute: no empuja la línea */}
              <span
                className={[
                  "pointer-events-none absolute left-1/2 -translate-x-1/2",
                  "top-[calc(100%+0.5rem)] hidden md:block",
                  "text-xs font-medium whitespace-nowrap",
                  isDone || isCurrent ? "text-amber-700" : "text-gray-400",
                ].join(" ")}
              >
                {s.title}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Etiqueta de paso actual (solo mobile) */}
      <div className="mt-2 text-center text-xs font-medium text-amber-700 md:hidden">
        {steps[visualStep - 1]?.title}
      </div>
    </nav>
  )
}
