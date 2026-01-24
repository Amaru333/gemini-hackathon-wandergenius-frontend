import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Share2, Download, MapPin, Calendar, Sparkles, Camera, ExternalLink } from 'lucide-react';

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    destinationName: string;
    startLocation: string;
    days: number;
    photoUrl?: string;
    travelStyle?: string;
    isPublic?: boolean;
    isPhotoAlbumPublic?: boolean;
    shareId?: string;
  };
  onTogglePublic?: (isPublic: boolean) => Promise<void>;
  onTogglePhotoAlbum?: (isPhotoAlbumPublic: boolean) => Promise<void>;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({ isOpen, onClose, trip, onTogglePublic, onTogglePhotoAlbum }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [togglingAlbum, setTogglingAlbum] = useState(false);

  if (!isOpen) return null;

  const handleTogglePublic = async () => {
    if (!onTogglePublic || toggling) return;
    setToggling(true);
    try {
      await onTogglePublic(!trip.isPublic);
    } finally {
      setToggling(false);
    }
  };

  const handleTogglePhotoAlbum = async () => {
    if (!onTogglePhotoAlbum || togglingAlbum) return;
    setTogglingAlbum(true);
    try {
      await onTogglePhotoAlbum(!trip.isPhotoAlbumPublic);
    } finally {
      setTogglingAlbum(false);
    }
  };

  const handleDownload = async () => {
    if (cardRef.current === null) {
      return;
    }

    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `wandergenius-${trip.destinationName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Could not download image', err);
    } finally {
      setDownloading(false);
    }
  };

  // Determine vibes based on destination or just generic cool keywords
  const vibes = ['Adventure', 'Relaxation', 'Culture']; 

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-600" /> Share Trip
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex flex-col items-center">
          
          {/* Card Preview Container */}
          <div className="shadow-2xl rounded-2xl overflow-hidden transform transition-transform hover:scale-[1.01] duration-500 mb-6">
            <div 
              ref={cardRef}
              className="w-[320px] h-[500px] relative flex flex-col bg-slate-900 text-white"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                 {trip.photoUrl ? (
                   <img 
                     src={trip.photoUrl} 
                     alt={trip.destinationName} 
                     className="w-full h-full object-cover opacity-80"
                   />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700" />
                 )}
                 {/* Overlay Gradient */}
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              </div>

              {/* Card Content */}
              <div className="relative z-10 flex-1 flex flex-col justify-between p-6">
                
                {/* Top Badge */}
                <div className="flex justify-between items-start">
                  <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase text-white/90">
                    WanderGenius AI
                  </div>
                </div>

                {/* Bottom Info */}
                <div>
                  <h1 className="text-4xl font-bold mb-2 text-white leading-tight drop-shadow-sm">
                    {trip.destinationName}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white/80 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      <Calendar className="w-4 h-4" /> {trip.days} Days
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white/80 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      <MapPin className="w-4 h-4" /> {trip.startLocation}
                    </div>
                  </div>

                  {/* Vibes / Footer */}
                  <div className="border-t border-white/20 pt-4 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Trip Vibe</p>
                      <div className="flex gap-2">
                         {vibes.map(v => (
                           <span key={v} className="text-xs font-medium text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">
                             {v}
                           </span>
                         ))}
                      </div>
                    </div>
                    <div className="text-right">
                       <Sparkles className="w-5 h-5 text-amber-400 mb-1 ml-auto" />
                       <p className="text-[10px] text-white/60">Generated by AI</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 text-center max-w-xs mb-4">
            Export this memory as a high-quality image to share on Instagram, WhatsApp, or keep for yourself.
          </p>

          {/* Public Link Section */}
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-4 mb-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${trip.isPublic ? 'bg-indigo-600' : 'bg-slate-200'}`}
                     onClick={handleTogglePublic}
                     role="button"
                >
                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${trip.isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">Public Link</span>
              </div>
              {trip.isPublic && (
                <span className="text-xs text-emerald-600 font-medium">Active</span>
              )}
            </div>

            {trip.isPublic && (
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={`${window.location.origin}/share/${trip.shareId}`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/share/${trip.shareId}`);
                    // Could add toast here
                  }}
                  className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800"
                >
                  Copy
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-2">
              {trip.isPublic 
                ? "Anyone with the link can view this trip." 
                : "Enable to let friends view this trip without an account."}
            </p>
          </div>

          {/* Photo Album Sharing */}
          {trip.isPublic && (
            <div className={`w-full max-w-sm border rounded-xl p-4 mb-2 transition-colors ${
              trip.isPhotoAlbumPublic 
                ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200' 
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    trip.isPhotoAlbumPublic 
                      ? 'bg-gradient-to-br from-rose-500 to-orange-500' 
                      : 'bg-slate-200'
                  }`}>
                    <Camera className={`w-5 h-5 ${trip.isPhotoAlbumPublic ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Photo Album</h4>
                    <p className="text-xs text-slate-500">Share your trip photos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                      trip.isPhotoAlbumPublic ? 'bg-rose-500' : 'bg-slate-200'
                    }`}
                    onClick={handleTogglePhotoAlbum}
                    role="button"
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                      trip.isPhotoAlbumPublic ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>
              
              {trip.isPhotoAlbumPublic ? (
                <>
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={`${window.location.origin}/album/${trip.shareId}`}
                      className="flex-1 bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/album/${trip.shareId}`);
                      }}
                      className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-600 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  
                  <a
                    href={`/album/${trip.shareId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> Preview Album
                  </a>
                </>
              ) : (
                <p className="text-[10px] text-slate-400">
                  Enable to let others view your trip photos. Private by default.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {downloading ? (
              <span className="flex items-center gap-2">Generating...</span>
            ) : (
              <>
                <Download className="w-5 h-5" /> Download Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
