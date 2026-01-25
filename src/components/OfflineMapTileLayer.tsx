import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getTile, saveTile } from '../services/offlineStorage';
import { useOffline } from '../contexts/OfflineContext';

interface OfflineMapTileLayerProps {
  url?: string;
  attribution?: string;
}

/**
 * Custom tile layer that uses cached tiles when offline
 * and caches tiles as they're loaded when online
 */
export const OfflineMapTileLayer: React.FC<OfflineMapTileLayerProps> = ({
  url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}) => {
  const map = useMap();
  const { isOnline } = useOffline();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    // Remove existing layer if any
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Create a custom tile layer class with offline support
    const OfflineTileLayer = L.TileLayer.extend({
      createTile: function (coords: { x: number; y: number; z: number }, done: (error: Error | null, tile: HTMLImageElement) => void) {
        const tile = document.createElement('img');
        const { x, y, z } = coords;
        
        // Try to get from cache first
        getTile(z, x, y).then((cachedBlob) => {
          if (cachedBlob) {
            // Use cached tile
            const objectUrl = URL.createObjectURL(cachedBlob);
            tile.onload = () => {
              URL.revokeObjectURL(objectUrl);
              done(null, tile);
            };
            tile.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              // Fall back to network if cache is corrupted
              this._loadFromNetwork(tile, coords, done);
            };
            tile.src = objectUrl;
          } else if (navigator.onLine) {
            // Load from network and cache
            this._loadFromNetwork(tile, coords, done);
          } else {
            // Offline and no cache - show placeholder
            tile.src = 'data:image/svg+xml,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
                <rect fill="#f1f5f9" width="256" height="256"/>
                <text x="128" y="128" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="12">
                  Offline
                </text>
              </svg>
            `);
            done(null, tile);
          }
        }).catch(() => {
          // If IndexedDB fails, fall back to network
          this._loadFromNetwork(tile, coords, done);
        });

        return tile;
      },

      _loadFromNetwork: function (
        tile: HTMLImageElement, 
        coords: { x: number; y: number; z: number }, 
        done: (error: Error | null, tile: HTMLImageElement) => void
      ) {
        const tileUrl = this.getTileUrl(coords);
        
        // Fetch and cache
        fetch(tileUrl)
          .then((response) => {
            if (!response.ok) throw new Error('Network error');
            return response.blob();
          })
          .then((blob) => {
            // Cache the tile
            saveTile(coords.z, coords.x, coords.y, blob, tileUrl).catch(console.warn);
            
            // Display the tile
            const objectUrl = URL.createObjectURL(blob);
            tile.onload = () => {
              URL.revokeObjectURL(objectUrl);
              done(null, tile);
            };
            tile.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              done(new Error('Failed to load tile'), tile);
            };
            tile.src = objectUrl;
          })
          .catch((err) => {
            // Try loading directly as fallback
            tile.onload = () => done(null, tile);
            tile.onerror = () => done(err, tile);
            tile.src = tileUrl;
          });
      }
    });

    // Create and add the layer
    const layer = new OfflineTileLayer(url, {
      attribution,
      maxZoom: 19,
    });
    
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, url, attribution, isOnline]);

  return null;
};

/**
 * Simple wrapper component that replaces TileLayer with offline support
 */
export const OfflineTileLayer: React.FC = () => {
  return <OfflineMapTileLayer />;
};
