// /reserva/page.tsx (App Router) — SERVER COMPONENT (sin "use client")
import { redirect } from "next/navigation"

export default function ReservaLanding({
  searchParams,
}: {
  searchParams: { external_reference?: string }
}) {
  const ext = searchParams?.external_reference
  if (ext) {
    // external_reference = "b:<bookingId>:a:<accountId>"
    const parts = ext.split(":")
    const bIdx = parts.indexOf("b")
    const bookingId = bIdx >= 0 ? parts[bIdx + 1] : null
    if (bookingId) {
      redirect(`/reserva/${bookingId}`)
    }
  }
  // podrías renderizar un loader mínimo si quieres
  return null
}
