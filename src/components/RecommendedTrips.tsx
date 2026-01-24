import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Calendar, ChevronRight, Loader2, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

interface RecommendedTrip {
  id: string;
  destinationName: string;
  photoUrl: string | null;
  days: number;
  shareId: string;
  distance: number | null;
  reviewCount: number;
  averageRating: {
    overall: number;
    budget: number;
    location: number;
    activities: number;
  };
}

interface RecommendedTripsProps {
  userLocation?: { lat: number; lng: number } | null;
}

export const RecommendedTrips: React.FC<RecommendedTripsProps> = ({ userLocation }) => {
  const [trips, setTrips] = useState<RecommendedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendedTrips();
  }, [userLocation]);

  const loadRecommendedTrips = async () => {
    try {
      const data = await api.getRecommendedTrips({
        limit: 6,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
      setTrips(data);
    } catch (err) {
      console.log('Could not load recommended trips:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (trips.length === 0) {
    return null; // Don't show section if no recommended trips
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        Top Rated Trips
        <span className="text-sm font-normal text-slate-500 ml-2">Based on traveler reviews</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            to={`/share/${trip.shareId}`}
            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all"
          >
            {/* Image */}
            <div className="relative h-36 bg-gradient-to-br from-indigo-100 to-purple-100">
              {trip.photoUrl && (
                <img
                  src={trip.photoUrl}
                  alt={trip.destinationName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-sm font-medium">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {trip.averageRating.overall.toFixed(1)}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {trip.destinationName}
              </h3>
              
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {trip.days} days
                </span>
                {trip.distance && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {trip.distance} mi
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {trip.reviewCount} review{trip.reviewCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(trip.averageRating.overall)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
