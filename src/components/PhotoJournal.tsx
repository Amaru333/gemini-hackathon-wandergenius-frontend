import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Plus, 
  X, 
  MapPin, 
  Calendar,
  Image as ImageIcon,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  Check,
  Share2
} from 'lucide-react';
import { api } from '../services/api';

interface TripPhoto {
  id: string;
  day: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  location: string | null;
  takenAt: string | null;
  sortOrder: number;
}

interface PhotoJournalProps {
  tripId: string;
  days: number;
  destinationName: string;
  isReadOnly?: boolean;
  onPhotoCountChange?: (count: number) => void;
}

export const PhotoJournal: React.FC<PhotoJournalProps> = ({ 
  tripId, 
  days, 
  destinationName,
  isReadOnly = false,
  onPhotoCountChange
}) => {
  const [photosByDay, setPhotosByDay] = useState<Record<number, TripPhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<TripPhoto | null>(null);
  
  // Upload form state
  const [uploadDay, setUploadDay] = useState(1);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadLocation, setUploadLocation] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [tripId]);

  useEffect(() => {
    const totalPhotos = Object.values(photosByDay).reduce((acc, photos) => acc + photos.length, 0);
    onPhotoCountChange?.(totalPhotos);
  }, [photosByDay, onPhotoCountChange]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await api.getTripPhotos(tripId);
      setPhotosByDay(data.photosByDay);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    // Create preview and prepare for upload
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadPreview(result);
      setUploadDay(activeDay);
      setIsUploadModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadPreview) return;

    try {
      setUploading(true);

      // Create thumbnail (resize to 300px width)
      const thumbnail = await createThumbnail(uploadPreview, 300);

      const photo = await api.addTripPhoto(tripId, {
        day: uploadDay,
        imageUrl: uploadPreview,
        thumbnailUrl: thumbnail,
        caption: uploadCaption || undefined,
        location: uploadLocation || undefined,
      });

      // Add to state
      setPhotosByDay(prev => ({
        ...prev,
        [uploadDay]: [...(prev[uploadDay] || []), photo as TripPhoto]
      }));

      // Reset form
      setIsUploadModalOpen(false);
      setUploadPreview(null);
      setUploadCaption('');
      setUploadLocation('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const createThumbnail = (dataUrl: string, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  const handleDeletePhoto = async (photoId: string, day: number) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await api.deleteTripPhoto(tripId, photoId);
      setPhotosByDay(prev => ({
        ...prev,
        [day]: prev[day].filter(p => p.id !== photoId)
      }));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return;

    try {
      await api.updateTripPhoto(tripId, editingPhoto.id, {
        caption: editingPhoto.caption || undefined,
        location: editingPhoto.location || undefined,
      });

      setPhotosByDay(prev => ({
        ...prev,
        [editingPhoto.day]: prev[editingPhoto.day].map(p => 
          p.id === editingPhoto.id ? editingPhoto : p
        )
      }));
      setEditingPhoto(null);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const currentDayPhotos = photosByDay[activeDay] || [];
  const totalPhotos = Object.values(photosByDay).reduce((acc, photos) => acc + photos.length, 0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(i => (i > 0 ? i - 1 : currentDayPhotos.length - 1));
    } else {
      setLightboxIndex(i => (i < currentDayPhotos.length - 1 ? i + 1 : 0));
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold">Photo Journal</h3>
          </div>
          <div className="text-sm opacity-90">
            {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 p-3 bg-slate-50 overflow-x-auto">
        {Array.from({ length: days }, (_, i) => i + 1).map(day => {
          const dayPhotoCount = (photosByDay[day] || []).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeDay === day
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              Day {day}
              {dayPhotoCount > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  activeDay === day 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  {dayPhotoCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Photo Grid */}
      <div className="p-4">
        {currentDayPhotos.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-4">No photos for Day {activeDay} yet</p>
            {!isReadOnly && (
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Add Photos
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentDayPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.caption || `Day ${photo.day} photo`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption && (
                      <p className="absolute bottom-2 left-2 right-2 text-white text-xs truncate">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                  {!isReadOnly && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingPhoto(photo); }}
                        className="p-1.5 bg-white/90 rounded-full text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id, photo.day); }}
                        className="p-1.5 bg-white/90 rounded-full text-slate-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {photo.location && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <MapPin className="w-3 h-3" />
                      {photo.location}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add Photo Button */}
              {!isReadOnly && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors">
                  <Plus className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-500">Add Photo</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">Add Photo</h3>
              <button
                onClick={() => { setIsUploadModalOpen(false); setUploadPreview(null); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Preview */}
              {uploadPreview && (
                <div className="rounded-lg overflow-hidden bg-slate-100 aspect-video">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Day Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" /> Day
                </label>
                <select
                  value={uploadDay}
                  onChange={(e) => setUploadDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  {Array.from({ length: days }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>Day {day}</option>
                  ))}
                </select>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Describe this moment..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" /> Location (optional)
                </label>
                <input
                  type="text"
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  placeholder="Where was this taken?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => { setIsUploadModalOpen(false); setUploadPreview(null); }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadPreview}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">Edit Photo</h3>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Thumbnail */}
              <div className="rounded-lg overflow-hidden bg-slate-100 aspect-video">
                <img
                  src={editingPhoto.thumbnailUrl || editingPhoto.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={editingPhoto.caption || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                  placeholder="Describe this moment..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" /> Location
                </label>
                <input
                  type="text"
                  value={editingPhoto.location || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, location: e.target.value })}
                  placeholder="Where was this taken?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => setEditingPhoto(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePhoto}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && currentDayPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          {currentDayPhotos.length > 1 && (
            <>
              <button
                onClick={() => navigateLightbox('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => navigateLightbox('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[80vh] mx-4">
            <img
              src={currentDayPhotos[lightboxIndex].imageUrl}
              alt={currentDayPhotos[lightboxIndex].caption || 'Trip photo'}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
            <div className="text-center mt-4">
              {currentDayPhotos[lightboxIndex].caption && (
                <p className="text-white text-lg mb-2">{currentDayPhotos[lightboxIndex].caption}</p>
              )}
              {currentDayPhotos[lightboxIndex].location && (
                <p className="text-white/70 text-sm flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentDayPhotos[lightboxIndex].location}
                </p>
              )}
              <p className="text-white/50 text-sm mt-2">
                {lightboxIndex + 1} / {currentDayPhotos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
