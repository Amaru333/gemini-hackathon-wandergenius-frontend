import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Loader2, AlertCircle, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { BadgeCard } from '../components/BadgeCard';
import { TravelStats } from '../components/TravelStats';

export const PublicProfilePage: React.FC = () => {
  const { shareableId } = useParams<{ shareableId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shareableId) {
      loadProfile();
    }
  }, [shareableId]);

  const loadProfile = async () => {
    try {
      const data = await api.getPublicProfile(shareableId!);
      setProfile(data);
    } catch (err) {
      setError('Profile not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 rounded-2xl p-12 border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600 mb-6">This profile doesn't exist or is no longer available.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          <User className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-slate-500 mt-2 flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          Member since {new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <TravelStats stats={profile.stats} compact={false} />

      {/* Badges */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            Earned Badges
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {profile.badges.map((badge: any) => (
              <BadgeCard
                key={badge.id}
                badgeType={badge.badgeType}
                name={badge.name}
                description={badge.description}
                icon={badge.icon}
                earnedAt={badge.earnedAt}
                size="md"
              />
            ))}
          </div>
        </div>
      )}

      {/* Public Trips */}
      {profile.publicTrips && profile.publicTrips.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Public Trips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.publicTrips.map((trip: any, idx: number) => (
              <Link
                key={idx}
                to={trip.shareId ? `/share/${trip.shareId}` : '#'}
                className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group"
              >
                {trip.photoUrl && (
                  <div className="h-32 bg-slate-100">
                    <img src={trip.photoUrl} alt={trip.destinationName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{trip.destinationName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <Calendar className="w-3 h-3" />
                    {trip.days} days
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-slate-500 mb-4">Want to create your own travel profile?</p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
};
