'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

// Importar dinámicamente el componente del mapa (solo cliente)
const MapComponent = dynamic<BranchMapClientProps>(
  () => import('./BranchMapClient'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

type Branch = {
  _id: string;
  name: string;
  phone?: string;
  location?: {
    addressLine?: string;
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
};

interface BranchMapClientProps {
  branches: Branch[];
  selectedBranchId?: string;
  onBranchSelect: (branchId: string) => void;
}

export default function BranchMap({ branches, selectedBranchId, onBranchSelect }: BranchMapClientProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

  return (
    <MapComponent
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchSelect={onBranchSelect}
    />
  );
}
