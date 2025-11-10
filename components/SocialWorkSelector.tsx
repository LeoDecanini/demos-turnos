"use client";

import { Shield, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SocialWorkItem = {
  _id: string;
  name: string;
};

type Props = {
  socialWorks: SocialWorkItem[];
  selectedId: string | null; // null = "Sin obra social"
  onSelect: (id: string | null) => void;
  loading?: boolean;
};

export default function SocialWorkSelector({
  socialWorks,
  selectedId,
  onSelect,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-gray-200 bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
{/*       <p className="text-sm text-gray-600">
        Seleccioná tu obra social o continuá sin ella
      </p> */}
      
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Opción "Sin obra social" */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all duration-200",
            "flex flex-col items-center justify-center gap-3 text-center",
            "hover:shadow-lg hover:-translate-y-0.5",
            selectedId === null
              ? "border-green-500 bg-green-50 shadow-lg"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              selectedId === null
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
            )}
          >
            <Shield className="w-6 h-6" />
          </div>
          
          <span
            className={cn(
              "font-medium text-sm transition-colors",
              selectedId === null ? "text-green-700" : "text-gray-700"
            )}
          >
            Sin obra social
          </span>

          {selectedId === null && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </button>

        {/* Lista de obras sociales */}
        {socialWorks.map((sw) => {
          const isSelected = selectedId === sw._id;
          
          return (
            <button
              key={sw._id}
              onClick={() => onSelect(sw._id)}
              className={cn(
                "relative p-6 rounded-xl border-2 transition-all duration-200",
                "flex flex-col items-center justify-center gap-3 text-center",
                "hover:shadow-lg hover:-translate-y-0.5",
                isSelected
                  ? "border-green-500 bg-green-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  "font-bold text-lg",
                  isSelected
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {sw.name.charAt(0).toUpperCase()}
              </div>
              
              <span
                className={cn(
                  "font-medium text-sm line-clamp-2 transition-colors",
                  isSelected ? "text-green-700" : "text-gray-700"
                )}
              >
                {sw.name}
              </span>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
