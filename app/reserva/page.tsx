// app/reserva/page.tsx (App Router) — SERVER COMPONENT
import { redirect } from "next/navigation"

type SearchParams =
    | Record<string, string | string[] | undefined>
    | undefined

export default async function ReservaLanding({
                                               searchParams,
                                             }: {
  // Next.js 15: searchParams es Promise
  searchParams: Promise<SearchParams>
}) {
  const sp = (await searchParams) ?? {}

  // puede venir string o string[]; tomamos el primero si es array
  const extRaw = sp.external_reference
  const ext =
      Array.isArray(extRaw) ? extRaw[0] : extRaw

  if (ext && typeof ext === "string") {
    // external_reference = "b:<bookingId>:a:<accountId>"
    const parts = ext.split(":")
    const bIdx = parts.indexOf("b")
    const bookingId = bIdx >= 0 ? parts[bIdx + 1] : null
    if (bookingId) {
      redirect(`/reserva/${bookingId}`)
    }
  }

  // Si no hay ext o bookingId, podés renderizar algo mínimo
  return null
}
