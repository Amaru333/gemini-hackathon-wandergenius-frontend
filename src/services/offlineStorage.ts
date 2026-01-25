import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the structure of offline trip data
export interface OfflineTrip {
  id: string;
  destinationName: string;
  destinationLat?: number;
  destinationLng?: number;
  photoUrl?: string;
  days: number;
  startLocation: string;
  itinerary: any[];
  checklist: any[];
  isPublic?: boolean;
  shareId?: string;
  savedAt: number; // timestamp
  // Map tile bounds for offline maps
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom: number;
  };
}

export interface CachedMapTile {
  key: string; // `${z}/${x}/${y}`
  blob: Blob;
  url: string;
  savedAt: number;
}

interface WanderGeniusDB extends DBSchema {
  'offline-trips': {
    key: string;
    value: OfflineTrip;
    indexes: { 'by-date': number };
  };
  'map-tiles': {
    key: string;
    value: CachedMapTile;
    indexes: { 'by-date': number };
  };
  'offline-meta': {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

const DB_NAME = 'wandergenius-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WanderGeniusDB>> | null = null;

export const getDB = async (): Promise<IDBPDatabase<WanderGeniusDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<WanderGeniusDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store for offline trips
        if (!db.objectStoreNames.contains('offline-trips')) {
          const tripStore = db.createObjectStore('offline-trips', { keyPath: 'id' });
          tripStore.createIndex('by-date', 'savedAt');
        }
        
        // Store for cached map tiles
        if (!db.objectStoreNames.contains('map-tiles')) {
          const tileStore = db.createObjectStore('map-tiles', { keyPath: 'key' });
          tileStore.createIndex('by-date', 'savedAt');
        }
        
        // Meta store for app state
        if (!db.objectStoreNames.contains('offline-meta')) {
          db.createObjectStore('offline-meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// ============ TRIP OPERATIONS ============

export const saveTrip = async (trip: Omit<OfflineTrip, 'savedAt'>): Promise<void> => {
  const db = await getDB();
  const offlineTrip: OfflineTrip = {
    ...trip,
    savedAt: Date.now(),
  };
  await db.put('offline-trips', offlineTrip);
};

export const getOfflineTrip = async (tripId: string): Promise<OfflineTrip | undefined> => {
  const db = await getDB();
  return db.get('offline-trips', tripId);
};

export const getAllOfflineTrips = async (): Promise<OfflineTrip[]> => {
  const db = await getDB();
  return db.getAllFromIndex('offline-trips', 'by-date');
};

export const deleteOfflineTrip = async (tripId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('offline-trips', tripId);
};

export const isOfflineTripSaved = async (tripId: string): Promise<boolean> => {
  const trip = await getOfflineTrip(tripId);
  return !!trip;
};

// ============ MAP TILE OPERATIONS ============

export const saveTile = async (z: number, x: number, y: number, blob: Blob, url: string): Promise<void> => {
  const db = await getDB();
  const key = `${z}/${x}/${y}`;
  await db.put('map-tiles', {
    key,
    blob,
    url,
    savedAt: Date.now(),
  });
};

export const getTile = async (z: number, x: number, y: number): Promise<Blob | null> => {
  const db = await getDB();
  const key = `${z}/${x}/${y}`;
  const tile = await db.get('map-tiles', key);
  return tile?.blob || null;
};

export const getTileCount = async (): Promise<number> => {
  const db = await getDB();
  return db.count('map-tiles');
};

export const clearOldTiles = async (maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> => {
  const db = await getDB();
  const cutoff = Date.now() - maxAge;
  const tiles = await db.getAllFromIndex('map-tiles', 'by-date');
  let deleted = 0;
  
  for (const tile of tiles) {
    if (tile.savedAt < cutoff) {
      await db.delete('map-tiles', tile.key);
      deleted++;
    }
  }
  
  return deleted;
};

// ============ UTILITY OPERATIONS ============

export const getStorageUsage = async (): Promise<{ trips: number; tiles: number; totalMB: number }> => {
  const db = await getDB();
  const trips = await db.count('offline-trips');
  const tiles = await db.count('map-tiles');
  
  // Estimate storage size
  let totalBytes = 0;
  
  const allTrips = await db.getAll('offline-trips');
  for (const trip of allTrips) {
    totalBytes += JSON.stringify(trip).length;
  }
  
  const allTiles = await db.getAll('map-tiles');
  for (const tile of allTiles) {
    totalBytes += tile.blob.size;
  }
  
  return {
    trips,
    tiles,
    totalMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
  };
};

export const clearAllOfflineData = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('offline-trips');
  await db.clear('map-tiles');
  await db.clear('offline-meta');
};

// ============ MAP TILE CACHING FOR AREA ============

interface TileCoord {
  x: number;
  y: number;
  z: number;
}

const latLngToTile = (lat: number, lng: number, zoom: number): { x: number; y: number } => {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
};

export const getTilesForArea = (
  north: number,
  south: number,
  east: number,
  west: number,
  minZoom: number = 10,
  maxZoom: number = 14
): TileCoord[] => {
  const tiles: TileCoord[] = [];
  
  for (let z = minZoom; z <= maxZoom; z++) {
    const topLeft = latLngToTile(north, west, z);
    const bottomRight = latLngToTile(south, east, z);
    
    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ x, y, z });
      }
    }
  }
  
  return tiles;
};

export const downloadMapTilesForArea = async (
  lat: number,
  lng: number,
  radiusKm: number = 10,
  onProgress?: (current: number, total: number) => void
): Promise<number> => {
  // Calculate bounds from center point and radius
  const latDelta = radiusKm / 111; // ~111km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  
  const north = lat + latDelta;
  const south = lat - latDelta;
  const east = lng + lngDelta;
  const west = lng - lngDelta;
  
  // Get tiles for zoom levels 10-14 (good for city-level detail)
  const tiles = getTilesForArea(north, south, east, west, 10, 14);
  let downloaded = 0;
  let errors = 0;
  
  const tileUrl = (z: number, x: number, y: number) => 
    `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  
  // Download in batches of 10 to avoid overwhelming the server
  const batchSize = 10;
  for (let i = 0; i < tiles.length; i += batchSize) {
    const batch = tiles.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async ({ x, y, z }) => {
        try {
          // Check if already cached
          const existing = await getTile(z, x, y);
          if (existing) {
            downloaded++;
            return;
          }
          
          const url = tileUrl(z, x, y);
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            await saveTile(z, x, y, blob, url);
            downloaded++;
          } else {
            errors++;
          }
        } catch (err) {
          errors++;
        }
      })
    );
    
    onProgress?.(i + batch.length, tiles.length);
    
    // Small delay between batches to be polite to the tile server
    if (i + batchSize < tiles.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return downloaded;
};

// ============ OFFLINE STATUS HELPERS ============

export const setLastSyncTime = async (): Promise<void> => {
  const db = await getDB();
  await db.put('offline-meta', { key: 'lastSync', value: Date.now() });
};

export const getLastSyncTime = async (): Promise<number | null> => {
  const db = await getDB();
  const meta = await db.get('offline-meta', 'lastSync');
  return meta?.value || null;
};
