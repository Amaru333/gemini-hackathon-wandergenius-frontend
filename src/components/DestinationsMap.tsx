import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom number icon creator
const createNumberIcon = (num: number, isActive: boolean) => {
  const size = isActive ? 32 : 26;
  const bg = isActive ? '#1e293b' : '#475569';
  const border = isActive ? '3px solid #f8fafc' : '2px solid #f1f5f9';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bg};
      border: ${border};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${isActive ? '14px' : '12px'};
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    ">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const startIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 12px;
    height: 12px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9]
});

interface Destination {
  name: string;
  lat: number;
  lng: number;
  cardIndex: number; // Index of the card this corresponds to
}

interface DestinationsMapProps {
  startLocation?: { lat: number; lng: number; name: string };
  destinations: Destination[];
  onMarkerClick?: (cardIndex: number) => void;  // Returns cardIndex, not array index
  activeIndex?: number | null;  // This is the cardIndex
}

// Component to pan to active marker
const MapController: React.FC<{ 
  destinations: Destination[]; 
  activeIndex: number | null;
  startLocation?: { lat: number; lng: number };
}> = ({ destinations, activeIndex, startLocation }) => {
  const map = useMap();
  
  React.useEffect(() => {
    // Fit bounds on initial load
    if (destinations.length > 0) {
      const points: [number, number][] = destinations.map(d => [d.lat, d.lng]);
      if (startLocation) {
        points.unshift([startLocation.lat, startLocation.lng]);
      }
      if (points.length > 1) {
        map.fitBounds(points, { padding: [40, 40] });
      } else if (points.length === 1) {
        map.setView(points[0], 10);
      }
    }
  }, [destinations, startLocation]);
  
  React.useEffect(() => {
    // Find the destination with this cardIndex
    if (activeIndex !== null) {
      const dest = destinations.find(d => d.cardIndex === activeIndex);
      if (dest) {
        map.panTo([dest.lat, dest.lng], { animate: true, duration: 0.3 });
      }
    }
  }, [activeIndex, destinations, map]);
  
  return null;
};

export const DestinationsMap: React.FC<DestinationsMapProps> = ({
  startLocation,
  destinations,
  onMarkerClick,
  activeIndex = null,
}) => {
  const defaultCenter: [number, number] = startLocation 
    ? [startLocation.lat, startLocation.lng]
    : destinations.length > 0 
      ? [destinations[0].lat, destinations[0].lng]
      : [39.8283, -98.5795]; // Center of US

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0" style={{ height: '320px' }}>
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          destinations={destinations} 
          activeIndex={activeIndex}
          startLocation={startLocation}
        />
        
        {/* Start location marker */}
        {startLocation && (
          <Marker position={[startLocation.lat, startLocation.lng]} icon={startIcon}>
            <Popup>
              <div className="text-sm font-medium text-slate-700">Start: {startLocation.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Destination markers with numbers matching card indices */}
        {destinations.map((dest) => (
          <Marker 
            key={dest.cardIndex} 
            position={[dest.lat, dest.lng]} 
            icon={createNumberIcon(dest.cardIndex + 1, activeIndex === dest.cardIndex)}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(dest.cardIndex);
                }
              }
            }}
          >
            <Popup>
              <div className="text-sm">
                <span className="font-semibold text-slate-800">{dest.cardIndex + 1}. {dest.name}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
