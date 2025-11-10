"use client";

import { Layers, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  _id: string;
  name: string;
  servicesCount?: number;
};

type Props = {
  categories: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
};

export default function CategorySelector({
  categories,
  selectedId,
  onSelect,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-gray-200 bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No hay categorías disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
{/*       <p className="text-sm text-gray-600">
        Seleccioná una categoría para ver sus servicios
      </p> */}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => {
          const isSelected = selectedId === category._id;
          
          return (
            <button
              key={category._id}
              onClick={() => onSelect(category._id)}
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
                  isSelected
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <Layers className="w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <span
                  className={cn(
                    "font-medium text-sm line-clamp-2 transition-colors",
                    isSelected ? "text-green-700" : "text-gray-700"
                  )}
                >
                  {category.name}
                </span>
                
                {category.servicesCount !== undefined && category.servicesCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {category.servicesCount} servicio{category.servicesCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>

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
