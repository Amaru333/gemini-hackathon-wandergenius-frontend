import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';

import { 
  ArrowLeft, 
  Loader2, 
  MapPin, 
  Clock, 
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Utensils,
  Sun,
  Sunset,
  Moon,
  Lightbulb,
  Trash2,
  Share2,
  Users,
  Star,
  DollarSign,
  Sparkles,
  Camera,
  Download,
  WifiOff
} from 'lucide-react';
import { api } from '../services/api';
import { WeatherCard } from '../components/WeatherCard';
import { BudgetTracker } from '../components/BudgetTracker';
import { ShareTripModal } from '../components/ShareTripModal';
import { VotingButtons } from '../components/VotingButtons';
import { InviteModal } from '../components/InviteModal';
import { ReviewModal } from '../components/ReviewModal';
import { StarRating } from '../components/StarRating';
import { PackingList } from '../components/PackingList';
import { PhotoJournal } from '../components/PhotoJournal';
import { SaveOfflineButton } from '../components/SaveOfflineButton';
import { useOffline } from '../contexts/OfflineContext';

interface Activity {
  time: string;
  activity: string;
  description: string;
  location?: string;
}

interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
  tips?: string;
}

interface ChecklistItem {
  id: number;
  task: string;
  category: string;
  completed: boolean;
}

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { isOnline, getOfflineTripById } = useOffline();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'photos'>('itinerary');
  const [photoCount, setPhotoCount] = useState(0);
  const [activeDay, setActiveDay] = useState(1);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [votes, setVotes] = useState<{ tallies: Record<string, { up: number; down: number }>; userVotes: Record<string, string> }>({ tallies: {}, userVotes: {} });
  const [reviews, setReviews] = useState<{
    reviews: Array<{
      id: string;
      budgetRating: number;
      locationRating: number;
      activitiesRating: number;
      overallRating: number;
      comment: string | null;
      createdAt: string;
      user: { id: string; name: string };
    }>;
    averages: { budgetRating: number; locationRating: number; activitiesRating: number; overallRating: number } | null;
    totalReviews: number;
  } | null>(null);

  // Check if we're generating a new itinerary or viewing a saved one
  const isNewItinerary = location.state?.generating;
  const generationData = location.state?.data;

  useEffect(() => {
    if (isNewItinerary && generationData) {
      generateNewItinerary();
    } else if (id) {
      loadSavedTrip(id);
    }
  }, [id, isNewItinerary, generationData]);

  const generateNewItinerary = async () => {
    try {
      setLoading(true);
      const result = await api.generateItinerary(generationData);
      setTrip({
        id: result.id,
        destinationName: result.destination,
        days: result.days,
        itinerary: result.itinerary,
        checklist: result.checklist,
        startLocation: generationData.startLocation,
        photoUrl: generationData.photoUrl
      });
      setChecklist(result.checklist);
    } catch (err: any) {
      setError(err.message || 'Failed to generate itinerary');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedTrip = async (tripId: string) => {
    try {
      // Try to load from API first
      const data = await api.getSavedTrip(tripId);
      setTrip(data);
      setChecklist(data.checklist || []);
      setIsOfflineMode(false);
      // Load votes for collaboration
      loadVotes(tripId);
    } catch (err: any) {
      // If offline or API fails, try to load from offline storage
      if (!isOnline || err.message?.includes('fetch') || err.message?.includes('network')) {
        const offlineTrip = getOfflineTripById(tripId);
        if (offlineTrip) {
          setTrip({
            id: offlineTrip.id,
            destinationName: offlineTrip.destinationName,
            destinationLat: offlineTrip.destinationLat,
            destinationLng: offlineTrip.destinationLng,
            photoUrl: offlineTrip.photoUrl,
            days: offlineTrip.days,
            startLocation: offlineTrip.startLocation,
            itinerary: offlineTrip.itinerary,
            checklist: offlineTrip.checklist,
            isPublic: offlineTrip.isPublic,
            shareId: offlineTrip.shareId,
          });
          setChecklist(offlineTrip.checklist || []);
          setIsOfflineMode(true);
          setLoading(false);
          return;
        }
      }
      setError(err.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const loadVotes = async (tripId: string) => {
    try {
      const voteData = await api.getVotes(tripId);
      setVotes(voteData);
    } catch (err) {
      // Voting is optional - don't show error
      console.log('Could not load votes:', err);
    }
  };

  const loadReviews = async (tripId: string) => {
    try {
      const data = await api.getReviews(tripId);
      setReviews({ reviews: data.reviews, averages: data.averages, totalReviews: data.totalReviews });
    } catch (err) {
      console.log('Could not load reviews:', err);
    }
  };

  // Load reviews when trip is loaded
  useEffect(() => {
    if (trip?.id) {
      loadReviews(trip.id);
    }
  }, [trip?.id]);

  const handleVote = async (day: number, activityIndex: number, vote: 'up' | 'down') => {
    if (!trip?.id) return;
    
    try {
      await api.voteOnActivity(trip.id, day, activityIndex, vote);
      loadVotes(trip.id);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const toggleChecklistItem = async (itemId: number) => {
    const item = checklist.find(i => i.id === itemId);
    if (!item || !trip?.id) return;

    const newCompleted = !item.completed;
    
    // Optimistic update
    setChecklist(prev => 
      prev.map(i => i.id === itemId ? { ...i, completed: newCompleted } : i)
    );

    try {
      await api.updateChecklist(trip.id, itemId, newCompleted);
    } catch (err) {
      // Revert on error
      setChecklist(prev => 
        prev.map(i => i.id === itemId ? { ...i, completed: !newCompleted } : i)
      );
    }
  };

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return <Sun className="w-4 h-4 text-amber-500" />;
    if (hour < 18) return <Sunset className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'booking': return 'text-blue-600 bg-blue-50';
      case 'packing': return 'text-emerald-600 bg-emerald-50';
      case 'planning': return 'text-purple-600 bg-purple-50';
      case 'admin': return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">
            {isNewItinerary ? 'Generating your personalized itinerary...' : 'Loading trip...'}
          </p>
          <p className="text-slate-400 text-xs mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 rounded-xl p-10 border border-red-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const itinerary: DayPlan[] = trip.itinerary || [];
  const currentDay = itinerary.find(d => d.day === activeDay) || itinerary[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/history"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Trip Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white mb-8 relative group">
        <div className="absolute top-6 right-6 z-10 flex gap-2">
           <button
             onClick={() => setIsReviewModalOpen(true)}
             className="flex items-center gap-2 bg-amber-500/90 hover:bg-amber-500 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
           >
             <Star className="w-4 h-4" /> Review
           </button>
           <button
             onClick={() => setIsInviteModalOpen(true)}
             className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
           >
             <Users className="w-4 h-4" /> Team
           </button>
           <button
             onClick={() => setIsShareModalOpen(true)}
             className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
           >
             <Share2 className="w-4 h-4" /> Share
           </button>
           {trip.id && (
             <SaveOfflineButton 
               trip={{
                 id: trip.id,
                 destinationName: trip.destinationName,
                 destinationLat: trip.destinationLat,
                 destinationLng: trip.destinationLng,
                 photoUrl: trip.photoUrl,
                 days: trip.days,
                 startLocation: trip.startLocation,
                 itinerary: trip.itinerary,
                 checklist: checklist,
                 isPublic: trip.isPublic,
                 shareId: trip.shareId,
               }}
               variant="button"
             />
           )}
        </div>
        {trip.photoUrl && (
          <div className="absolute inset-0 opacity-20 rounded-2xl overflow-hidden pointer-events-none">
            <img src={trip.photoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative">
          <h1 className="text-3xl font-bold mb-3">{trip.destinationName}</h1>
          <div className="flex flex-wrap gap-4 text-slate-300 text-sm">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> From {trip.startLocation}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {trip.days} days
            </span>
            {reviews && reviews.averages && reviews.totalReviews > 0 && (
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-medium">{reviews.averages.overallRating.toFixed(1)}</span>
                <span className="text-slate-400">({reviews.totalReviews} review{reviews.totalReviews !== 1 ? 's' : ''})</span>
              </span>
            )}
            {isOfflineMode && (
              <span className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1 rounded-full text-amber-300">
                <WifiOff className="w-4 h-4" />
                <span className="font-medium">Offline Mode</span>
              </span>
            )}
          </div>
          
          {/* Weather Card */}
          {(trip.destinationLat && trip.destinationLng) || (generationData?.lat && generationData?.lng) ? (
            <div className="mt-4">
              <WeatherCard 
                lat={trip.destinationLat || generationData?.lat} 
                lng={trip.destinationLng || generationData?.lng}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'itinerary'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Daily Plan
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'photos'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Camera className="w-4 h-4" />
          Photos
          {photoCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'photos' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
            }`}>
              {photoCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'budget'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Budget Tracker
        </button>
      </div>

      {activeTab === 'budget' ? (
        <BudgetTracker tripId={trip.id} />
      ) : activeTab === 'photos' ? (
        <div className="max-w-4xl">
          <PhotoJournal
            tripId={trip.id}
            days={trip.days}
            destinationName={trip.destinationName}
            onPhotoCountChange={setPhotoCount}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Itinerary Section */}
          <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Day-by-Day Itinerary
          </h2>

          {/* Day Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {itinerary.map(day => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeDay === day.day
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day {day.day}
              </button>
            ))}
          </div>

          {/* Current Day Content */}
          {currentDay && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Day {currentDay.day}: {currentDay.title}
              </h3>

              <div className="space-y-4">
                {currentDay.activities?.map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        {getTimeIcon(activity.time)}
                      </div>
                      {i < currentDay.activities.length - 1 && (
                        <div className="w-px h-full bg-slate-200 my-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">{activity.time}</span>
                          {activity.location && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {activity.location}
                            </span>
                          )}
                        </div>
                        <VotingButtons
                          day={currentDay.day}
                          activityIndex={i}
                          upVotes={votes.tallies[`${currentDay.day}-${i}`]?.up || 0}
                          downVotes={votes.tallies[`${currentDay.day}-${i}`]?.down || 0}
                          userVote={(votes.userVotes[`${currentDay.day}-${i}`] as 'up' | 'down') || null}
                          onVote={handleVote}
                        />
                      </div>
                      <h4 className="font-medium text-slate-900">{activity.activity}</h4>
                      <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {currentDay.tips && (
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800 text-sm font-medium mb-1">
                    <Lightbulb className="w-4 h-4" /> Tip
                  </div>
                  <p className="text-sm text-amber-700">{currentDay.tips}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Packing List Section */}
        <div>
          <PackingList
            tripId={trip.id}
            items={checklist}
            onItemToggle={toggleChecklistItem}
            onItemsUpdate={setChecklist}
          />
        </div>

        {/* Reviews Section */}
        {reviews && reviews.totalReviews > 0 && (
          <div className="lg:col-span-3 mt-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Trip Reviews ({reviews.totalReviews})
            </h2>
            
            {reviews.averages && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Average Ratings</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <div className="font-bold text-lg">{reviews.averages.budgetRating.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Budget Value</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="font-bold text-lg">{reviews.averages.locationRating.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Location</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Sparkles className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="font-bold text-lg">{reviews.averages.activitiesRating.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Activities</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <div className="font-bold text-lg">{reviews.averages.overallRating.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Overall</div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Reviews */}
            <div className="space-y-4">
              {reviews.reviews.map((review) => (
                <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(review.user?.name || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{review.user?.name || 'Traveler'}</div>
                        <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating rating={review.overallRating} readonly size="sm" />
                    </div>
                  </div>
                  
                  {review.comment && (
                    <p className="text-slate-600 italic">"{review.comment}"</p>
                  )}
                  
                  <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {review.budgetRating}/5</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {review.locationRating}/5</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {review.activitiesRating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      )}

      <ShareTripModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        trip={trip}
        onTogglePublic={async (isPublic) => {
          try {
            const result = await api.toggleShare(trip.id, isPublic);
            setTrip(prev => ({ ...prev, isPublic: result.isPublic, shareId: result.shareId }));
          } catch (err) {
            console.error('Failed to toggle share', err);
          }
        }}
        onTogglePhotoAlbum={async (isPhotoAlbumPublic) => {
          try {
            const result = await api.togglePhotoAlbumShare(trip.id, isPhotoAlbumPublic);
            setTrip(prev => ({ ...prev, isPhotoAlbumPublic: result.isPhotoAlbumPublic }));
          } catch (err) {
            console.error('Failed to toggle photo album share', err);
          }
        }}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tripId={trip.id}
        isOwner={trip.isOwner ?? true}
      />

      <ReviewModal
        tripId={trip.id}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={() => {
          loadReviews(trip.id);
        }}
      />
    </div>
  );
};
