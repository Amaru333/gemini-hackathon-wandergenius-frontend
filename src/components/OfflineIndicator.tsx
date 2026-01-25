import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, X } from 'lucide-react';
import { useOffline } from '../contexts/OfflineContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, offlineTrips, storageUsage } = useOffline();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Show banner when going offline, or coming back online
  useEffect(() => {
    if (!isOnline && !dismissed) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (isOnline && wasOffline) {
      setShowBanner(true);
      setDismissed(false);
      // Auto-hide after 3 seconds when back online
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, dismissed, wasOffline]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
  };

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOnline ? 'bg-emerald-500' : 'bg-amber-500'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                You're back online!
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                You're offline
              </span>
              {offlineTrips.length > 0 && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                  {offlineTrips.length} trip{offlineTrips.length !== 1 ? 's' : ''} available offline
                </span>
              )}
            </>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

// Smaller status indicator for the header
export const OfflineStatusBadge: React.FC = () => {
  const { isOnline, offlineTrips } = useOffline();

  if (isOnline && offlineTrips.length === 0) return null;

  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
        isOnline 
          ? 'bg-slate-100 text-slate-600' 
          : 'bg-amber-100 text-amber-700'
      }`}
      title={isOnline ? `${offlineTrips.length} trips saved offline` : 'Offline mode'}
    >
      {isOnline ? (
        <>
          <CloudOff className="w-3 h-3" />
          <span>{offlineTrips.length}</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};
