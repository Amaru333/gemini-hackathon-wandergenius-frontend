import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Camera,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ArrowLeft,
  Share2,
  Image as ImageIcon,
  User
} from 'lucide-react';
import { api } from '../services/api';

interface TripPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  location: string | null;
  takenAt: string | null;
}

interface AlbumData {
  tripId: string;
  shareId: string;
  destinationName: string;
  startLocation: string;
  days: number;
  photoUrl: string | null;
  owner: { name: string };
  itinerary: any[];
  totalPhotos: number;
  photosByDay: Record<number, TripPhoto[]>;
}

export const PhotoAlbumPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<(TripPhoto & { day: number })[]>([]);
  const [viewMode, setViewMode] = useState<'by-day' | 'all'>('by-day');

  useEffect(() => {
    loadAlbum();
  }, [shareId]);

  useEffect(() => {
    if (album) {
      // Flatten all photos for "all photos" view
      const photos: (TripPhoto & { day: number })[] = [];
      for (let day = 1; day <= album.days; day++) {
        const dayPhotos = album.photosByDay[day] || [];
        dayPhotos.forEach(photo => photos.push({ ...photo, day }));
      }
      setAllPhotos(photos);
    }
  }, [album]);

  const loadAlbum = async () => {
    if (!shareId) return;

    try {
      setLoading(true);
      const data = await api.getPublicTripAlbum(shareId);
      setAlbum(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load album');
    } finally {
      setLoading(false);
    }
  };

  const currentDayPhotos = album?.photosByDay[activeDay] || [];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const photos = viewMode === 'by-day' ? currentDayPhotos : allPhotos;
    if (direction === 'prev') {
      setLightboxIndex(i => (i > 0 ? i - 1 : photos.length - 1));
    } else {
      setLightboxIndex(i => (i < photos.length - 1 ? i + 1 : 0));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${album?.destinationName} - Trip Photo Album`,
          text: `Check out the photos from this trip to ${album?.destinationName}!`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const getDayTitle = (day: number): string => {
    if (!album?.itinerary) return `Day ${day}`;
    const dayPlan = album.itinerary.find((d: any) => d.day === day);
    return dayPlan?.title || `Day ${day}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-rose-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading photo album...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Album Not Available</h2>
          <p className="text-slate-500 mb-6">
            {error || 'This photo album is private or doesn\'t exist. The trip owner needs to enable photo album sharing.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (album.totalPhotos === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="relative">
          {album.photoUrl && (
            <div className="absolute inset-0 h-64">
              <img src={album.photoUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-slate-900" />
            </div>
          )}
          <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-16">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">{album.destinationName}</h1>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" /> by {album.owner.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {album.days} days
              </span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="bg-slate-800/50 rounded-3xl p-12 text-center border border-slate-700">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Photos Yet</h2>
            <p className="text-slate-400">This trip album doesn't have any photos uploaded yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const displayPhotos = viewMode === 'by-day' ? currentDayPhotos : allPhotos;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative">
        {album.photoUrl && (
          <div className="absolute inset-0 h-80">
            <img src={album.photoUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-slate-900" />
          </div>
        )}
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-20">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
            >
              <Share2 className="w-4 h-4" /> Share Album
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-rose-400 font-medium">Photo Album</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{album.destinationName}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> by {album.owner.name}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> from {album.startLocation}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {album.days} days
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
              <Camera className="w-4 h-4" /> {album.totalPhotos} photos
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 pb-16">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-700 overflow-hidden">
          {/* View Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('by-day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'by-day'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                By Day
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All Photos
              </button>
            </div>
          </div>

          {/* Day tabs (only in by-day mode) */}
          {viewMode === 'by-day' && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-slate-800/50 border-b border-slate-700">
              {Array.from({ length: album.days }, (_, i) => i + 1).map(day => {
                const dayPhotoCount = (album.photosByDay[day] || []).length;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`relative px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeDay === day
                        ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="block text-xs opacity-70 mb-0.5">Day {day}</span>
                    <span className="block truncate max-w-[120px]">{getDayTitle(day)}</span>
                    {dayPhotoCount > 0 && (
                      <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                        activeDay === day
                          ? 'bg-white text-rose-500'
                          : 'bg-rose-500 text-white'
                      }`}>
                        {dayPhotoCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Photo Grid */}
          <div className="p-6">
            {displayPhotos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No photos for {viewMode === 'by-day' ? `Day ${activeDay}` : 'this trip'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-slate-700 cursor-pointer transform hover:scale-[1.02] transition-transform"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={photo.thumbnailUrl || photo.imageUrl}
                      alt={photo.caption || 'Trip photo'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      {viewMode === 'all' && 'day' in photo && (
                        <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                          Day {(photo as any).day}
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {photo.caption && (
                          <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
                        )}
                        {photo.location && (
                          <p className="text-white/70 text-xs flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {photo.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && displayPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {displayPhotos.length > 1 && (
            <>
              <button
                onClick={() => navigateLightbox('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => navigateLightbox('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-5xl max-h-[90vh] mx-4 flex flex-col items-center">
            <img
              src={displayPhotos[lightboxIndex].imageUrl}
              alt={displayPhotos[lightboxIndex].caption || 'Trip photo'}
              className="max-w-full max-h-[75vh] object-contain"
            />
            <div className="text-center mt-6 w-full max-w-lg">
              {viewMode === 'all' && 'day' in displayPhotos[lightboxIndex] && (
                <span className="inline-block bg-rose-500 text-white text-sm px-3 py-1 rounded-full mb-3">
                  Day {(displayPhotos[lightboxIndex] as any).day}
                </span>
              )}
              {displayPhotos[lightboxIndex].caption && (
                <p className="text-white text-xl mb-2">{displayPhotos[lightboxIndex].caption}</p>
              )}
              {displayPhotos[lightboxIndex].location && (
                <p className="text-white/70 flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {displayPhotos[lightboxIndex].location}
                </p>
              )}
              <p className="text-white/50 text-sm mt-4">
                {lightboxIndex + 1} / {displayPhotos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
