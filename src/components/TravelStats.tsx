import React from 'react';
import { MapPin, Star, Users, Award, Plane, Calendar } from 'lucide-react';

interface TravelStatsProps {
  stats: {
    tripsCompleted: number;
    reviewsWritten: number;
    collaborations?: number;
    badgesEarned: number;
    destinationsVisited: number;
    destinations?: string[];
  };
  memberSince?: string;
  compact?: boolean;
}

export const TravelStats: React.FC<TravelStatsProps> = ({ stats, memberSince, compact = false }) => {
  const statItems = [
    { label: 'Trips', value: stats.tripsCompleted, icon: Plane, color: 'text-blue-600 bg-blue-50' },
    { label: 'Reviews', value: stats.reviewsWritten, icon: Star, color: 'text-amber-600 bg-amber-50' },
    { label: 'Destinations', value: stats.destinationsVisited, icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Badges', value: stats.badgesEarned, icon: Award, color: 'text-purple-600 bg-purple-50' },
  ];

  if (compact) {
    return (
      <div className="flex gap-4 flex-wrap">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-indigo-600" />
        Travel Stats
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="text-center p-4 bg-slate-50 rounded-xl">
            <div className={`w-12 h-12 mx-auto rounded-full ${color} flex items-center justify-center mb-2`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {memberSince && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          Member since {new Date(memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      )}

      {stats.destinations && stats.destinations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Places Visited</h4>
          <div className="flex flex-wrap gap-2">
            {stats.destinations.slice(0, 8).map((dest, i) => (
              <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                {dest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
