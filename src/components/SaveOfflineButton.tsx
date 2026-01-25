import React, { useState, useEffect } from 'react';
import { Download, Check, Trash2, Loader2, CloudOff, Map, X } from 'lucide-react';
import { useOffline } from '../contexts/OfflineContext';

interface SaveOfflineButtonProps {
  trip: {
    id: string;
    destinationName: string;
    destinationLat?: number;
    destinationLng?: number;
    photoUrl?: string;
    days: number;
    startLocation: string;
    itinerary?: any[];
    checklist?: any[];
    isPublic?: boolean;
    shareId?: string;
  };
  variant?: 'button' | 'icon' | 'card';
}

export const SaveOfflineButton: React.FC<SaveOfflineButtonProps> = ({ trip, variant = 'button' }) => {
  const { saveTripOffline, removeTripOffline, isTripSavedOffline, isOnline } = useOffline();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState({ stage: '', percent: 0 });
  const [downloadMaps, setDownloadMaps] = useState(true);

  useEffect(() => {
    checkIfSaved();
  }, [trip.id]);

  const checkIfSaved = async () => {
    const saved = await isTripSavedOffline(trip.id);
    setIsSaved(saved);
  };

  const handleSave = async () => {
    if (!isOnline) {
      alert('You need to be online to download trips for offline use.');
      return;
    }
    
    setIsLoading(true);
    setProgress({ stage: 'Starting...', percent: 0 });
    
    try {
      await saveTripOffline(trip, downloadMaps, (stage, percent) => {
        setProgress({ stage, percent });
      });
      setIsSaved(true);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save offline:', err);
      alert('Failed to save trip for offline use. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress({ stage: '', percent: 0 });
    }
  };

  const handleRemove = async () => {
    if (confirm('Remove this trip from offline storage?')) {
      try {
        await removeTripOffline(trip.id);
        setIsSaved(false);
      } catch (err) {
        console.error('Failed to remove offline trip:', err);
      }
    }
  };

  const hasMapsCapability = trip.destinationLat && trip.destinationLng;

  // Icon variant - minimal
  if (variant === 'icon') {
    if (isSaved) {
      return (
        <button
          onClick={handleRemove}
          className="p-2 text-emerald-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
          title="Remove from offline"
        >
          <Check className="w-5 h-5 group-hover:hidden" />
          <Trash2 className="w-5 h-5 hidden group-hover:block" />
        </button>
      );
    }

    return (
      <button
        onClick={() => setShowModal(true)}
        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Save for offline"
      >
        <Download className="w-5 h-5" />
      </button>
    );
  }

  // Button variant
  if (variant === 'button') {
    if (isSaved) {
      return (
        <button
          onClick={handleRemove}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-red-100 hover:text-red-700 transition-colors group"
        >
          <Check className="w-4 h-4 group-hover:hidden" />
          <Trash2 className="w-4 h-4 hidden group-hover:block" />
          <span className="group-hover:hidden">Saved Offline</span>
          <span className="hidden group-hover:inline">Remove</span>
        </button>
      );
    }

    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          disabled={!isOnline}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Save Offline
        </button>
        {renderModal()}
      </>
    );
  }

  // Card variant - shows in a card format for offline trips page
  if (variant === 'card') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <CloudOff className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{trip.destinationName}</h3>
              <p className="text-sm text-slate-500">{trip.days} days from {trip.startLocation}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Available offline</span>
          {hasMapsCapability && (
            <>
              <span className="text-slate-300">•</span>
              <Map className="w-3.5 h-3.5" />
              <span>Maps cached</span>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderModal() {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Save for Offline</h3>
              <button
                onClick={() => !isLoading && setShowModal(false)}
                disabled={isLoading}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {!isLoading ? (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  Download <strong>{trip.destinationName}</strong> for offline access. You'll be able to view the full itinerary, packing list, and maps without internet.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-slate-700">Full itinerary with activities</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-slate-700">Complete packing list</span>
                  </div>
                  
                  {hasMapsCapability && (
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={downloadMaps}
                        onChange={(e) => setDownloadMaps(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-slate-700 block">Download offline maps</span>
                        <span className="text-xs text-slate-500">~5-15 MB depending on area</span>
                      </div>
                      <Map className="w-5 h-5 text-slate-400" />
                    </label>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                </div>
                
                <p className="text-sm text-center text-slate-600 mb-4">
                  {progress.stage}
                </p>
                
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-500 mt-2">
                  {progress.percent}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return renderModal();
};
