"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReusableBadge from "./reusable-badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const CDN_UPLOADS = "https://cdn.moveup.digital";
const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`;
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT;

type DepositType = "FIXED" | "PERCENT";

type ServiceImage = {
  _id: string;
  path: string;
  alt?: string | null;
  position?: number;
};

type Service = {
  _id: string;
  name: string;
  description?: string;
  category?: { _id: string; name: string } | null;
  images?: ServiceImage[];
  depositRequired?: boolean;
  depositType?: DepositType;
  depositValue?: number;
  price?: number;
  currency?: string;
};

export default function ServicesSlider() {
  const [items, setItems] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchServicios() {
      try {
        const url = `${API_BASE}/${SUBDOMAIN}/services`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Error al cargar servicios");

        const data = await res.json();
        const list: Service[] = Array.isArray(data?.data)
          ? data.data
          : data?.data?.items ?? [];
        setItems(list);
      } catch (err) {
        console.error("Error al obtener servicios:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchServicios();
  }, []);

  if (loading)
    return (
      <div className="py-20 text-center text-gray-500">Cargando servicios...</div>
    );

  if (!items.length)
    return (
      <div className="py-20 text-center text-gray-500">
        No hay servicios disponibles.
      </div>
    );

  return (
    <section className="py-20">
      <div className="px-6 sm:px-10">
        <div className="text-center mb-8">
          <ReusableBadge className="mb-2">Nuestros Servicios</ReusableBadge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Nuestros tratamientos
          </h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto mb-4 rounded-full" />
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Realizamos tratamientos o procedimientos estéticos tanto faciales
            como corporales no invasivos. Nuestro objetivo es resaltar tu
            belleza y mejorar ciertos rasgos de la forma más natural posible.
          </p>
        </div>

        <Carousel
          opts={{ align: "start", loop: false, dragFree: true }}
          className="relative"
        >
          <CarouselContent className="-ml-4">
            {items.map((srv) => {
              const first = srv.images?.[0];
              const bgUrl = first?.path
                ? `${CDN_UPLOADS.replace(/\/$/, "")}/${encodeURI(first.path)}`
                : null;

              const noImg = !bgUrl;

              return (
                <CarouselItem
                  key={srv._id}
                  className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-[40%] xl:basis-[33%]"
                >
                  <article
                    className={[
                      "relative h-[360px] sm:h-[420px] rounded-[28px] overflow-hidden",
                      "ring-1 ring-amber-200",
                      noImg ? "bg-amber-100" : "bg-amber-100",
                    ].join(" ")}
                  >
                    {bgUrl && (
                      <Image
                        src={bgUrl}
                        alt={first?.alt || srv.name}
                        fill
                        sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center"
                        priority={false}
                        draggable={false}
                      />
                    )}

                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      {noImg && (
                        <div className="absolute inset-0 grid place-items-center">
                          <div className="rounded-3xl bg-white/60 p-6 shadow">
                            <Sparkles className="w-16 h-16 text-amber-800" />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {srv.category?.name ? (
                          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900 bg-amber-100 px-2 py-1 rounded">
                            {srv.category.name}
                          </span>
                        ) : (
                          <span className="inline-block h-[12px]" />
                        )}

                        <h3
                          className={[
                            "text-2xl sm:text-3xl font-semibold",
                            noImg ? "text-amber-950" : "text-white drop-shadow",
                          ].join(" ")}
                        >
                          {srv.name}
                        </h3>
                      </div>

                      <div className="flex items-end justify-between">
                        <p
                          className={[
                            "max-w-[70%] text-sm line-clamp-2",
                            noImg ? "text-amber-950/80" : "text-white/90",
                          ].join(" ")}
                        >
                          {srv.description}
                        </p>

                        <Button
                          asChild
                          variant="secondary"
                          className="rounded-xl h-9 px-4 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          <Link href="/reservar">Ver detalles</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <CarouselPrevious className="left-2 bg-white/90 border-amber-200 text-amber-900 hover:bg-amber-50" />
          <CarouselNext className="right-2 bg-white/90 border-amber-200 text-amber-900 hover:bg-amber-50" />
        </Carousel>
      </div>
    </section>
  );
}
