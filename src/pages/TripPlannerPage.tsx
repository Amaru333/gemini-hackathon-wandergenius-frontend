import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  Plane, 
  Train, 
  Car, 
  Compass,
  AlertCircle,
  Map,
  Lightbulb,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { LocationMap } from '../components/LocationMap';
import { RecommendedTrips } from '../components/RecommendedTrips';

export const TripPlannerPage: React.FC = () => {
  const [startLocation, setStartLocation] = useState('');
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusOrTime, setRadiusOrTime] = useState('');
  const [days, setDays] = useState(3);
  const [travelMode, setTravelMode] = useState<'car' | 'train' | 'flight' | 'mixed'>('car');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasProfile, setHasProfile] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkProfile();
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await api.getTripSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const checkProfile = async () => {
    try {
      const profile = await api.getProfile();
      if (!profile.interests || profile.interests.length === 0) {
        setHasProfile(false);
      }
    } catch {
      setHasProfile(false);
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    setStartLocation(location.name);
    setStartCoords({ lat: location.lat, lng: location.lng });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.generateTrip({
        startLocation,
        radiusOrTime,
        days,
        travelMode,
        customInput: customInput.trim() || undefined,
        userLocation: startCoords ? { latitude: startCoords.lat, longitude: startCoords.lng } : undefined
      });
      // Store start coords for results page
      sessionStorage.setItem('tripStartCoords', JSON.stringify(startCoords));
      navigate(`/results/${result.tripId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (!hasProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-amber-50 rounded-[2rem] p-12 border border-amber-100">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile First</h2>
          <p className="text-slate-600 mb-6">
            We need to know your interests and preferences to generate personalized recommendations.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Set Up Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold uppercase text-xs tracking-widest transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Edit Profile
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="text-indigo-600 w-6 h-6" />
          </div>
          Trip Logistics
        </h1>
        <p className="text-slate-600 mt-2">Pick your starting point and configure your travel</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 space-y-8">
        {/* Map Section */}
        <section>
          <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
            <Map className="w-4 h-4" /> Starting Location
          </label>
          <p className="text-slate-500 text-sm mb-4">
            Search for a location, click on the map, or use your current location
          </p>
          <LocationMap onLocationSelect={handleLocationSelect} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Range / Radius */}
          <section>
            <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">
              Range / Radius
            </label>
            <input 
              type="text"
              placeholder="e.g. 300 miles or 5 hours"
              value={radiusOrTime}
              onChange={(e) => setRadiusOrTime(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800"
            />
          </section>

          {/* Duration */}
          <section>
            <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">
              Duration: {days} Days
            </label>
            <div className="flex items-center gap-6 px-2 pt-2">
              <input 
                type="range"
                min="1"
                max="14"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="flex-grow h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </section>
        </div>

        {/* Transit Preference */}
        <section>
          <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest">
            Transit Preference
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['car', 'train', 'flight', 'mixed'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setTravelMode(mode)}
                className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all font-bold ${
                  travelMode === mode 
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                }`}
              >
                {mode === 'car' && <Car className="w-5 h-5" />}
                {mode === 'train' && <Train className="w-5 h-5" />}
                {mode === 'flight' && <Plane className="w-5 h-5" />}
                {mode === 'mixed' && <Compass className="w-5 h-5" />}
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Custom Trip Description */}
        <section>
          <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Custom Trip Description (Optional)
          </label>
          <p className="text-slate-500 text-sm mb-3">
            Tell us what kind of trip you're looking for - your preferences, special requirements, or any specific experiences you want
          </p>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g., I want a relaxing beach vacation with great food, or I'm looking for an adventure trip with hiking and photography opportunities..."
            rows={4}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 resize-none"
          />
        </section>

        {/* Generate Button */}
        <div className="pt-6 flex justify-end">
          <button
            disabled={!startLocation || !radiusOrTime || loading}
            onClick={handleGenerate}
            className="flex items-center gap-3 bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-bold hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-2xl disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing Destinations...
              </>
            ) : (
              <>
                Explore Options
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Personalized Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] p-8 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Personalized Suggestions</h2>
              <p className="text-slate-600 text-sm">Based on your past trip reviews</p>
            </div>
          </div>

          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    // Pre-fill the custom input with suggestion details
                    setCustomInput(`${suggestion.description}\n\nKey aspects: ${suggestion.highlights.join(', ')}`);
                    // Scroll to custom input
                    document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                      document.querySelector('textarea')?.focus();
                    }, 300);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-lg">{suggestion.title}</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                      ~{suggestion.estimatedDays} days
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">{suggestion.description}</p>
                  <div className="space-y-2">
                    {suggestion.highlights.map((highlight: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs text-indigo-600 font-semibold">Click to use this suggestion →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Trips Section */}
      <RecommendedTrips userLocation={startCoords} />
    </div>
  );
};
