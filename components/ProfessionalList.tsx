"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfessionalItem = {
  _id: string;
  name: string;
  photo?: { path?: string };
};

type Props = {
  professionals: ProfessionalItem[];
  selectedId?: string;
  onSelect: (id: string) => void | Promise<void>;
  backendBaseUrl: string;
  heightClassName?: string;
  includeAny?: boolean;
  anyLabel?: string;
  anyImagePath?: string;
};

export default function ProfessionalList({
  professionals,
  selectedId,
  onSelect,
  backendBaseUrl,
  heightClassName,
  includeAny,
  anyLabel = "Indistinto",
  anyImagePath = "/indistinto.png",
}: Props) {
  const normBase = (backendBaseUrl || "").replace(/\/+$/, "");

  const srcFor = (path?: string) => {
    if (!path) return undefined;
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith("/")) return path;
    const clean = path.replace(/^\/+/, "");
    return `${normBase}/${clean}`;
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const items: ProfessionalItem[] = includeAny
    ? [{ _id: "any", name: anyLabel, photo: { path: anyImagePath } }, ...professionals]
    : professionals;

  return (
    <div className={cn("relative overflow-y-auto", heightClassName || "max-h-[60vh]")}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((p) => {
          const selected = selectedId === p._id;
          const imgSrc = srcFor(p.photo?.path);

          return (
            <button
              key={p._id}
              type="button"
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                "hover:shadow-md hover:border-green-300",
                selected
                  ? "bg-green-50 border-green-500 shadow-md"
                  : "bg-white border-gray-200"
              )}
              onClick={() => onSelect(p._id)}
            >
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 shrink-0 relative">
                {imgSrc ? (
                  <Image src={imgSrc} alt={p.name} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-gray-600">
                    {initials(p.name)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center">
                <p className="font-medium text-gray-900 text-sm line-clamp-2">{p.name}</p>
              </div>

              {selected && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
