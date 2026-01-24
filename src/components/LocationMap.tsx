import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, Crosshair, MapPin, Loader2 } from 'lucide-react';

// Fix default marker icons for Leaflet + webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationMapProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

// Component to handle map events
const MapEvents: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to recenter map
const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

export const LocationMap: React.FC<LocationMapProps> = ({
  onLocationSelect,
  initialLocation,
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Get current location on mount
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        const name = await reverseGeocode(latitude, longitude);
        setLocationName(name);
        onLocationSelect({ lat: latitude, lng: longitude, name });
        setGettingLocation(false);
      },
      () => {
        // Default to a central location if geolocation fails
        setPosition({ lat: 40.7128, lng: -74.006 });
        setLocationName('New York, NY');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || '';
      const state = data.address?.state || '';
      const country = data.address?.country || '';
      return [city, state, country].filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    const name = await reverseGeocode(lat, lng);
    setLocationName(name);
    onLocationSelect({ lat, lng, name });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        setPosition({ lat: latNum, lng: lngNum });
        setLocationName(display_name.split(',').slice(0, 3).join(','));
        onLocationSelect({ lat: latNum, lng: lngNum, name: display_name.split(',').slice(0, 3).join(',') });
      }
    } catch {
      console.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const defaultCenter: [number, number] = position 
    ? [position.lat, position.lng] 
    : [40.7128, -74.006];

  return (
    <div className="space-y-4 relative z-0">
      {/* Search bar */}
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-grow flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2"
          title="Use current location"
        >
          {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
        </button>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border-2 border-slate-100 shadow-lg" style={{ height: '300px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onLocationSelect={handleMapClick} />
          {position && (
            <>
              <Marker position={[position.lat, position.lng]} />
              <RecenterMap lat={position.lat} lng={position.lng} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Selected location display */}
      {locationName && (
        <div className="flex items-center gap-2 text-sm bg-indigo-50 px-4 py-3 rounded-xl">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-indigo-800">Selected:</span>
          <span className="text-indigo-600">{locationName}</span>
        </div>
      )}
    </div>
  );
};
