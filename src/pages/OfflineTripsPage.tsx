import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CloudOff, 
  MapPin, 
  Calendar, 
  Trash2, 
  ArrowRight, 
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useOffline } from '../contexts/OfflineContext';

export const OfflineTripsPage: React.FC = () => {
  const { 
    isOnline, 
    offlineTrips, 
    isLoading, 
    storageUsage, 
    removeTripOffline,
    clearOfflineData,
    refreshOfflineTrips 
  } = useOffline();

  const handleClearAll = async () => {
    if (confirm('Remove all offline data? This cannot be undone.')) {
      await clearOfflineData();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <CloudOff className="w-7 h-7 text-indigo-600" />
            Offline Trips
          </h1>
          <p className="text-slate-500 mt-1">
            Access your saved trips without internet
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isOnline 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Offline
              </>
            )}
          </div>
          
          <button
            onClick={refreshOfflineTrips}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Storage Info */}
      {storageUsage && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5" />
              <span className="font-medium">Storage Usage</span>
            </div>
            {(storageUsage.trips > 0 || storageUsage.tiles > 0) && (
              <button
                onClick={handleClearAll}
                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{storageUsage.trips}</div>
              <div className="text-xs text-slate-300">Trips Saved</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{storageUsage.tiles}</div>
              <div className="text-xs text-slate-300">Map Tiles</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{storageUsage.totalMB}</div>
              <div className="text-xs text-slate-300">MB Used</div>
            </div>
          </div>
        </div>
      )}

      {/* Trips List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : offlineTrips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudOff className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No Offline Trips</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Save your trips for offline access so you can view them without internet connection.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to My Trips
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {offlineTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Photo or Placeholder */}
                <div className="w-32 h-32 bg-slate-100 flex-shrink-0">
                  {trip.photoUrl ? (
                    <img
                      src={trip.photoUrl}
                      alt={trip.destinationName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {trip.destinationName}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          From {trip.startLocation}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {trip.days} days
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/itinerary/${trip.id}`}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => removeTripOffline(trip.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from offline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
                    <span>Saved {formatDate(trip.savedAt)}</span>
                    {trip.itinerary?.length > 0 && (
                      <span>{trip.itinerary.length} day plan</span>
                    )}
                    {trip.checklist?.length > 0 && (
                      <span>{trip.checklist.length} packing items</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Offline Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li>• Downloaded trips include full itinerary, packing list, and maps</li>
          <li>• Map tiles are cached for the destination area (10-15km radius)</li>
          <li>• Weather data requires internet connection</li>
          <li>• Changes made offline will sync when you're back online</li>
        </ul>
      </div>
    </div>
  );
};
