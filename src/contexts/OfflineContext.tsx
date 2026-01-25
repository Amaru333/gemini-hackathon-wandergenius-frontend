import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  OfflineTrip,
  getAllOfflineTrips,
  saveTrip,
  deleteOfflineTrip,
  isOfflineTripSaved,
  getStorageUsage,
  downloadMapTilesForArea,
  clearAllOfflineData,
} from '../services/offlineStorage';

interface OfflineContextType {
  isOnline: boolean;
  offlineTrips: OfflineTrip[];
  isLoading: boolean;
  storageUsage: { trips: number; tiles: number; totalMB: number } | null;
  
  // Actions
  saveTripOffline: (trip: any, downloadMaps?: boolean, onProgress?: (stage: string, progress: number) => void) => Promise<void>;
  removeTripOffline: (tripId: string) => Promise<void>;
  isTripSavedOffline: (tripId: string) => Promise<boolean>;
  refreshOfflineTrips: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getOfflineTripById: (tripId: string) => OfflineTrip | undefined;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineTrips, setOfflineTrips] = useState<OfflineTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState<{ trips: number; tiles: number; totalMB: number } | null>(null);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline trips on mount
  useEffect(() => {
    refreshOfflineTrips();
  }, []);

  const refreshOfflineTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const trips = await getAllOfflineTrips();
      setOfflineTrips(trips.reverse()); // Most recent first
      
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      console.error('Failed to load offline trips:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTripOffline = useCallback(async (
    trip: any,
    downloadMaps: boolean = true,
    onProgress?: (stage: string, progress: number) => void
  ) => {
    onProgress?.('Saving trip data...', 10);
    
    // Prepare trip data
    const offlineTripData = {
      id: trip.id,
      destinationName: trip.destinationName,
      destinationLat: trip.destinationLat,
      destinationLng: trip.destinationLng,
      photoUrl: trip.photoUrl,
      days: trip.days,
      startLocation: trip.startLocation,
      itinerary: trip.itinerary || [],
      checklist: trip.checklist || [],
      isPublic: trip.isPublic,
      shareId: trip.shareId,
    };
    
    await saveTrip(offlineTripData);
    onProgress?.('Trip data saved!', 30);
    
    // Download map tiles if coordinates are available
    if (downloadMaps && trip.destinationLat && trip.destinationLng) {
      onProgress?.('Downloading map tiles...', 40);
      
      try {
        await downloadMapTilesForArea(
          trip.destinationLat,
          trip.destinationLng,
          15, // 15km radius
          (current, total) => {
            const progress = 40 + Math.round((current / total) * 55);
            onProgress?.(`Downloading maps: ${current}/${total} tiles`, progress);
          }
        );
      } catch (err) {
        console.warn('Failed to download some map tiles:', err);
      }
    }
    
    onProgress?.('Complete!', 100);
    await refreshOfflineTrips();
  }, [refreshOfflineTrips]);

  const removeTripOffline = useCallback(async (tripId: string) => {
    await deleteOfflineTrip(tripId);
    await refreshOfflineTrips();
  }, [refreshOfflineTrips]);

  const isTripSavedOffline = useCallback(async (tripId: string): Promise<boolean> => {
    return isOfflineTripSaved(tripId);
  }, []);

  const getOfflineTripById = useCallback((tripId: string): OfflineTrip | undefined => {
    return offlineTrips.find(t => t.id === tripId);
  }, [offlineTrips]);

  const clearOfflineData = useCallback(async () => {
    await clearAllOfflineData();
    await refreshOfflineTrips();
  }, [refreshOfflineTrips]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        offlineTrips,
        isLoading,
        storageUsage,
        saveTripOffline,
        removeTripOffline,
        isTripSavedOffline,
        refreshOfflineTrips,
        clearOfflineData,
        getOfflineTripById,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
