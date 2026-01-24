import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ChevronRight, Loader2, Check, AlertCircle, MapPin, Calendar, Trash2, Briefcase, Award, Share2, Copy } from 'lucide-react';
import { api } from '../services/api';
import { BadgeCard } from '../components/BadgeCard';
import { TravelStats } from '../components/TravelStats';

const INTERESTS_OPTIONS = ['Nature', 'History', 'Nightlife', 'Food', 'Adventure', 'Relaxation', 'Culture', 'Art', 'Shopping'];
const HOBBIES_OPTIONS = ['Hiking', 'Photography', 'Museums', 'Beaches', 'Road trips', 'Cycling', 'Surfing', 'Meditation'];

interface SavedTrip {
  id: string;
  destinationName: string;
  photoUrl: string | null;
  days: number;
  startLocation: string;
  createdAt: string;
}

export const ProfilePage: React.FC = () => {
  const [interests, setInterests] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState('budget');
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [badges, setBadges] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadSavedTrips();
    loadBadgesAndStats();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await api.getProfile();
      setInterests(profile.interests || []);
      setHobbies(profile.hobbies || []);
      setTravelStyle(profile.travelStyle || 'budget');
      setConstraints(profile.constraints || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedTrips = async () => {
    try {
      const trips = await api.getSavedTrips();
      setSavedTrips(trips);
    } catch (err) {
      console.error('Failed to load saved trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const loadBadgesAndStats = async () => {
    try {
      // Check for new badges first
      await api.checkBadges();
      // Then load badges and stats
      const [badgesData, statsData] = await Promise.all([
        api.getMyBadges(),
        api.getMyStats()
      ]);
      setBadges(badgesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load badges/stats:', err);
    }
  };

  const copyShareLink = () => {
    if (stats?.shareableId) {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${stats.shareableId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      await api.deleteSavedTrip(tripId);
      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
    setSaved(false);
  };

  const toggleHobby = (hobby: string) => {
    setHobbies(prev => 
      prev.includes(hobby) 
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateProfile({ interests, hobbies, travelStyle, constraints });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    await handleSave();
    navigate('/plan');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <User className="text-indigo-600 w-6 h-6" />
          </div>
          Discovery Profile
        </h1>
        <p className="text-slate-600 mt-2">Tell us about your travel preferences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Saved Trips Section */}
      {savedTrips.length > 0 && (
        <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            My Planned Trips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTrips.map(trip => (
              <div key={trip.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {trip.photoUrl && (
                  <div className="h-24 bg-slate-100">
                    <img src={trip.photoUrl} alt={trip.destinationName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">{trip.destinationName}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {trip.startLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {trip.days} days
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/itinerary/${trip.id}`}
                      className="flex-1 bg-slate-900 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      View Itinerary
                    </Link>
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges & Stats Section */}
      {stats && (
        <div className="mb-8 space-y-6">
          {/* Travel Stats */}
          <TravelStats stats={stats.stats} memberSince={stats.memberSince} />

          {/* Badges */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                My Badges ({badges.length})
              </h2>
              <button
                onClick={copyShareLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Share Profile'}
              </button>
            </div>
            {badges.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badgeType={badge.badgeType}
                    name={badge.name}
                    description={badge.description}
                    icon={badge.icon}
                    earnedAt={badge.earnedAt}
                    size="sm"
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">
                Complete trips and write reviews to earn badges!
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 space-y-10">
        {/* Interests */}
        <section>
          <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">
            Your Interests
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => toggleInterest(opt)}
                className={`px-5 py-2.5 rounded-2xl border-2 transition-all font-semibold ${
                  interests.includes(opt) 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        {/* Hobbies */}
        <section>
          <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">
            Your Hobbies
          </label>
          <div className="flex flex-wrap gap-2">
            {HOBBIES_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => toggleHobby(opt)}
                className={`px-5 py-2.5 rounded-2xl border-2 transition-all font-semibold ${
                  hobbies.includes(opt) 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-105' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Travel Style */}
          <section>
            <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">
              Travel Philosophy
            </label>
            <select 
              value={travelStyle}
              onChange={(e) => { setTravelStyle(e.target.value); setSaved(false); }}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 appearance-none"
            >
              <option value="budget">Value / Budget</option>
              <option value="luxury">Premium / Luxury</option>
              <option value="backpacking">Raw / Backpacking</option>
              <option value="family-friendly">Safe / Family Friendly</option>
              <option value="solo">Solo / Independent</option>
              <option value="couple">Intimate / Romantic</option>
            </select>
          </section>

          {/* Constraints */}
          <section>
            <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">
              Special Constraints
            </label>
            <input 
              type="text"
              placeholder="e.g. Vegetarian-friendly, Pet friendly, Wheelchair access"
              value={constraints}
              onChange={(e) => { setConstraints(e.target.value); setSaved(false); }}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800"
            />
          </section>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              saved
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {saved ? 'Saved!' : 'Save Profile'}
          </button>

          <button
            disabled={interests.length === 0}
            onClick={handleContinue}
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-bold hover:bg-indigo-600 disabled:opacity-30 transition-all shadow-xl active:scale-95"
          >
            Plan a Trip
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

