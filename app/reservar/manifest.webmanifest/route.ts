// app/reservar/manifest.webmanifest/route.ts
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Reservas",
      short_name: "Reservas",
      id: "/reservar/v2", // <— NUEVO ID (importante)
      start_url: "/reservar/?source=pwa", // <— explícito
      scope: "/reservar/",
      display: "standalone",
      theme_color: "#0a0a0a",
      background_color: "#ffffff",
      icons: [
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
