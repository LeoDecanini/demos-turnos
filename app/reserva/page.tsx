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
    const parts = ext.split(":")

    // Caso grupo: "g:<groupId>:a:<accountId>"
    const gIdx = parts.indexOf("g")
    if (gIdx >= 0) {
      const groupId = parts[gIdx + 1]
      if (groupId) {
        redirect(`/reserva/${groupId}?grupo=true`)
      }
    }

    // Caso individual: "b:<bookingId>:a:<accountId>"
    const bIdx = parts.indexOf("b")
    const bookingId = bIdx >= 0 ? parts[bIdx + 1] : null
    if (bookingId) {
      redirect(`/reserva/${bookingId}`)
    }
  }

  // Si no hay ext o bookingId, podés renderizar algo mínimo
  return null
}