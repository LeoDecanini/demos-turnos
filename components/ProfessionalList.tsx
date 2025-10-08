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
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <div className={cn("relative overflow-y-auto", heightClassName || "max-h-[60vh]")}>
        <ul>
          {items.map((p) => {
            const selected = selectedId === p._id;
            const imgSrc = srcFor(p.photo?.path);

            return (
              <li
                key={p._id}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 border-b border-gray-100 cursor-pointer transition-colors",
                  "hover:bg-amber-50/40",
                  selected && "bg-amber-50"
                )}
                onClick={() => onSelect(p._id)}
              >
                <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0 relative">
                  {imgSrc ? (
                    <Image src={imgSrc} alt={p.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-gray-600">
                      {initials(p.name)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                </div>

                <div
                  className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                    selected ? "bg-amber-500 border-amber-500" : "border-gray-300"
                  )}
                >
                  {selected && <Check className="w-4 h-4 text-white" />}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
