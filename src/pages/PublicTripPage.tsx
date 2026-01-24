import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  MapPin, 
  Calendar,
  Clock,
  LayoutDashboard,
  CheckCircle2,
  Circle,
  Lightbulb,
  AlertTriangle,
  Download,
  LogIn,
  Star,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { WeatherCard } from '../components/WeatherCard';
import { useAuth } from '../contexts/AuthContext';
import { StarRating } from '../components/StarRating';

interface Activity {
  time: string;
  activity: string;
  description: string;
  location?: string;
}

interface ItineraryDay {
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

export const PublicTripPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState<any>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [importing, setImporting] = useState(false);
  const [reviews, setReviews] = useState<{
    reviews: any[];
    averages: { budgetRating: number; locationRating: number; activitiesRating: number; overallRating: number } | null;
    totalReviews: number;
  } | null>(null);

  const handleImportTrip = async () => {
    if (!shareId) return;
    
    // If not logged in, redirect to login with return URL
    if (!user) {
      navigate(`/login?redirect=/trip/shared/${shareId}`);
      return;
    }

    setImporting(true);
    try {
      const result = await api.importTrip(shareId);
      // Redirect to the newly created trip
      navigate(`/itinerary/${result.tripId}`);
    } catch (err: any) {
      console.error('Failed to import trip:', err);
      setError('Failed to import trip. Please try again.');
      setImporting(false);
    }
  };

  useEffect(() => {
    const loadTrip = async () => {
      if (!shareId) return;
      try {
        const data = await api.getPublicTrip(shareId);
        setTrip(data);
      } catch (err: any) {
        console.error('Failed to load shared trip', err);
        setError('This trip link is invalid or has been disabled.');
      } finally {
        setLoading(false);
      }
    };
    loadTrip();
  }, [shareId]);

  // Load reviews for the trip
  useEffect(() => {
    const loadReviews = async () => {
      if (!trip?.id) return;
      try {
        const data = await api.getReviews(trip.id);
        setReviews(data);
      } catch (err) {
        console.log('Could not load reviews:', err);
      }
    };
    loadReviews();
  }, [trip?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Trip Not Found</h1>
          <p className="text-slate-500 mb-6">{error || "We couldn't find the trip you're looking for."}</p>
          <Link to="/" className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors">
            Go to WanderGenius
          </Link>
        </div>
      </div>
    );
  }

  const itinerary: ItineraryDay[] = trip.itinerary || [];
  const currentDay = itinerary.find(d => d.day === activeDay);

  const getTimeIcon = (timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour < 12) return <LayoutDashboard className="w-4 h-4 text-emerald-600" />; // Morning (using generic icon for now)
    if (hour < 17) return <LayoutDashboard className="w-4 h-4 text-amber-500" />;   // Afternoon
    return <LayoutDashboard className="w-4 h-4 text-indigo-500" />;                 // Evening
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            WanderGenius
          </Link>
          <Link to="/register" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            Plan your own trip →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Trip Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          {trip.photoUrl && (
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img src={trip.photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-emerald-300 border border-white/10 mb-4">
                <CheckCircle2 className="w-3 h-3" /> Shared Trip
              </div>
              <h1 className="text-4xl font-bold mb-2">{trip.destinationName}</h1>
              <div className="flex flex-wrap gap-4 text-slate-300 text-sm">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Clock className="w-4 h-4 text-indigo-400" /> {trip.days} Days
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-rose-400" /> {trip.startLocation}
                </span>
              </div>
            </div>

            {/* Weather Widget (Read Only) */}
            {trip.destinationLat && trip.destinationLng && (
              <div className="w-full md:w-auto">
                 {/* Reusing WeatherCard but it handles its own internal state/api calls */}
                 <WeatherCard lat={trip.destinationLat} lng={trip.destinationLng} mode="compact" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Itinerary */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Trip Itinerary
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
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>

            {/* Day Details */}
            {currentDay && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Day {currentDay.day}: {currentDay.title}
                </h3>

                <div className="space-y-6">
                  {currentDay.activities?.map((activity, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          {getTimeIcon(activity.time)}
                        </div>
                        {i < currentDay.activities.length - 1 && (
                          <div className="w-px h-full bg-slate-100 my-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{activity.time}</span>
                          {activity.location && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {activity.location}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-slate-900">{activity.activity}</h4>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {currentDay.tips && (
                  <div className="mt-8 bg-amber-50 border border-amber-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-800 text-sm font-bold mb-1">
                      <Lightbulb className="w-4 h-4" /> Professional Tip
                    </div>
                    <p className="text-sm text-amber-700 italic">{currentDay.tips}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Budget Stats (Restricted) & CTA */}
          <div className="space-y-6">
            
            {/* Minimal Budget View */}
            {trip.budgetStats && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Trip Budget</h3>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-slate-600">Total Budget</span>
                  <span className="font-bold text-slate-900">${trip.budgetStats.total.toLocaleString()}</span>
                </div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-slate-600">Estimated Spend</span>
                  <span className="font-bold text-indigo-600">${trip.budgetStats.spent.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (trip.budgetStats.spent / trip.budgetStats.total) * 100)}%` }}
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center">
                        Detailed expenses are private to the trip owner.
                    </p>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {reviews && reviews.totalReviews > 0 && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Reviews ({reviews.totalReviews})
                </h3>
                
                {reviews.averages && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" /> Budget Value
                      </span>
                      <StarRating rating={Math.round(reviews.averages.budgetRating)} readonly size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" /> Location
                      </span>
                      <StarRating rating={Math.round(reviews.averages.locationRating)} readonly size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" /> Activities
                      </span>
                      <StarRating rating={Math.round(reviews.averages.activitiesRating)} readonly size="sm" />
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" /> Overall
                      </span>
                      <StarRating rating={Math.round(reviews.averages.overallRating)} readonly size="sm" showValue />
                    </div>
                  </div>
                )}

                {/* Individual reviews */}
                {reviews.reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-t border-slate-100 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{review.user?.name || 'Traveler'}</span>
                      <StarRating rating={review.overallRating} readonly size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-500 italic">"{review.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Import Trip Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg shadow-emerald-200">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Download className="w-5 h-5" /> Import This Trip
              </h3>
              <p className="text-emerald-100 text-sm mb-4">
                Love this itinerary? Import it to your account and customize it for your own adventure.
              </p>
              <button
                onClick={handleImportTrip}
                disabled={importing}
                className="w-full bg-white text-emerald-600 text-center py-2.5 rounded-lg font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : user ? (
                  <>
                    <Download className="w-4 h-4" />
                    Import to My Trips
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Login to Import
                  </>
                )}
              </button>
            </div>

            {/* CTA Card */}
            <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
              <h3 className="font-bold text-lg mb-2">Want something different?</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Create your own personalized travel itinerary with AI in seconds.
              </p>
              <Link to="/register" className="block w-full bg-white text-indigo-600 text-center py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
                Start Planning Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
