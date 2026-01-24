import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, MapPin, Calendar, ChevronRight, Loader2, Trash2, Compass } from 'lucide-react';
import { api } from '../services/api';

interface TripSummary {
  id: string;
  startLocation: string;
  days: number;
  travelMode: string;
  createdAt: string;
}

export const HistoryPage: React.FC = () => {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await api.getTrips();
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    setDeleting(id);
    try {
      await api.deleteTrip(id);
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete trip:', err);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <History className="text-indigo-600 w-6 h-6" />
          </div>
          Trip History
        </h1>
        <p className="text-slate-600 mt-2">Your past travel plans and recommendations</p>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20 px-6 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="bg-white p-4 inline-block rounded-2xl shadow-sm mb-4">
            <Compass className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No trips yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Start planning your first adventure and it will appear here.
          </p>
          <Link
            to="/plan"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Plan Your First Trip
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {trip.startLocation}
                    </h3>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 capitalize">
                      {trip.travelMode}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {trip.days} days
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {formatDate(trip.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(trip.id)}
                    disabled={deleting === trip.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    {deleting === trip.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                  <Link
                    to={`/results/${trip.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    View
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
