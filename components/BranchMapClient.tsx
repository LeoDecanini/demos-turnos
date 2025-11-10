'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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

// Crear íconos personalizados de Leaflet
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${isSelected ? '#10b981' : '#3b82f6'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg 
          style="
            width: 16px;
            height: 16px;
            transform: rotate(45deg);
            fill: white;
          "
          viewBox="0 0 24 24"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function BranchMapClient({
  branches,
  selectedBranchId,
  onBranchSelect,
}: BranchMapClientProps) {
  // Filtrar sucursales con coordenadas
  const branchesWithCoords = branches.filter((b) => b.location?.lat && b.location?.lng);

  if (branchesWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-3 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm">No hay ubicaciones disponibles</p>
        </div>
      </div>
    );
  }

  // Calcular centro del mapa
  const selectedBranch = branchesWithCoords.find((b) => b._id === selectedBranchId);
  const centerLat =
    selectedBranch?.location?.lat ||
    branchesWithCoords.reduce((sum, b) => sum + (b.location?.lat || 0), 0) /
      branchesWithCoords.length;
  const centerLng =
    selectedBranch?.location?.lng ||
    branchesWithCoords.reduce((sum, b) => sum + (b.location?.lng || 0), 0) /
      branchesWithCoords.length;

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={selectedBranch ? 15 : 12}
        className="h-full w-full rounded-xl"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />

        {branchesWithCoords.map((b) => {
          const isSelected = b._id === selectedBranchId;
          return (
            <Marker
              key={b._id}
              position={[b.location!.lat!, b.location!.lng!]}
              icon={createCustomIcon(isSelected)}
              eventHandlers={{
                click: () => onBranchSelect(b._id),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-semibold text-gray-900 mb-1">{b.name}</div>
                  <div className="text-sm text-gray-600">
                    {[b.location?.addressLine, b.location?.city].filter(Boolean).join(', ')}
                  </div>
                  {b.phone && <div className="text-sm mt-1">📞 {b.phone}</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Info de sucursal seleccionada */}
      {selectedBranch && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200 z-[1000]">
          <div className="font-semibold text-gray-900 mb-1">{selectedBranch.name}</div>
          <div className="text-sm text-gray-600">
            {[
              selectedBranch.location?.addressLine,
              selectedBranch.location?.city,
              selectedBranch.location?.state,
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
          {selectedBranch.phone && (
            <div className="text-sm text-gray-600 mt-1">📞 {selectedBranch.phone}</div>
          )}
        </div>
      )}

      {/* Botón para abrir en Google Maps */}
      {selectedBranch?.location?.lat && selectedBranch?.location?.lng && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${selectedBranch.location.lat},${selectedBranch.location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md text-sm font-medium flex items-center gap-2 transition-colors z-[1000]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Abrir en Maps
        </a>
      )}
    </div>
  );
}
