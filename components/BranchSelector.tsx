"use client";

import { Building2, MapPin, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type BranchItem = {
  _id: string;
  name: string;
  location?: string;
  address?: string;
};

type Props = {
  branches: BranchItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
};

export default function BranchSelector({
  branches,
  selectedId,
  onSelect,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg border border-gray-200 bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No hay sucursales disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Seleccioná la sucursal donde querés realizar el servicio
      </p>
      
      <div className="space-y-3">
        {branches.map((branch) => {
          const isSelected = selectedId === branch._id;
          
          return (
            <button
              key={branch._id}
              onClick={() => onSelect(branch._id)}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all duration-200",
                "flex items-center gap-4 text-left",
                "hover:shadow-md hover:-translate-y-0.5",
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <Building2 className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    "font-semibold text-base transition-colors",
                    isSelected ? "text-blue-700" : "text-gray-900"
                  )}
                >
                  {branch.name}
                </h3>
                
                {(branch.location || branch.address) && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {branch.location || branch.address}
                    </p>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
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
