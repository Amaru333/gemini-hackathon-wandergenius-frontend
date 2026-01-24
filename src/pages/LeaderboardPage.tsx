import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Globe, Star, Loader2, Medal, Plane } from 'lucide-react';
import { api } from '../services/api';

type LeaderboardTab = 'trips' | 'states' | 'reviews';

interface LeaderboardEntry {
  userId: string;
  name: string;
  shareableId: string;
  value: number;
  rank: number;
  states?: string[];
  reviewCount?: number;
}

const RANK_COLORS = {
  1: 'from-amber-400 to-yellow-500',
  2: 'from-slate-300 to-slate-400',
  3: 'from-amber-600 to-amber-700',
} as const;

const RANK_BORDER = {
  1: 'border-amber-400 ring-amber-200',
  2: 'border-slate-400 ring-slate-200',
  3: 'border-amber-600 ring-amber-200',
} as const;

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('trips');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    mostTrips: LeaderboardEntry[];
    mostStates: LeaderboardEntry[];
    bestReviewed: LeaderboardEntry[];
  } | null>(null);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const result = await api.getLeaderboards();
      setData(result);
    } catch (err) {
      console.error('Failed to load leaderboards:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActiveData = (): LeaderboardEntry[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'trips':
        return data.mostTrips;
      case 'states':
        return data.mostStates;
      case 'reviews':
        return data.bestReviewed;
    }
  };

  const getValueLabel = (entry: LeaderboardEntry): string => {
    switch (activeTab) {
      case 'trips':
        return `${entry.value} trip${entry.value !== 1 ? 's' : ''}`;
      case 'states':
        return `${entry.value} state${entry.value !== 1 ? 's' : ''}`;
      case 'reviews':
        return `${entry.value.toFixed(1)} avg (${entry.reviewCount} review${entry.reviewCount !== 1 ? 's' : ''})`;
    }
  };

  const tabs = [
    { id: 'trips' as const, label: 'Most Trips', icon: Plane, color: 'text-blue-600 bg-blue-50' },
    { id: 'states' as const, label: 'Most States', icon: Globe, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'reviews' as const, label: 'Best Reviewed', icon: Star, color: 'text-amber-600 bg-amber-50' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const activeData = getActiveData();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-lg mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Leaderboards</h1>
        <p className="text-slate-600 mt-2">See who's leading the travel community</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-lg scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      {activeData.length === 0 ? (
        <div className="text-center py-20 px-6 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="bg-white p-4 inline-block rounded-2xl shadow-sm mb-4">
            <Trophy className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No rankings yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Be the first to climb the leaderboard by planning trips and exploring the world!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeData.map((entry) => {
            const isTopThree = entry.rank <= 3;
            const rankColor = RANK_COLORS[entry.rank as 1 | 2 | 3];
            const rankBorder = RANK_BORDER[entry.rank as 1 | 2 | 3];

            return (
              <Link
                key={entry.userId}
                to={`/profile/${entry.shareableId}`}
                className={`block bg-white rounded-2xl p-5 border transition-all hover:shadow-lg group ${
                  isTopThree ? `${rankBorder} ring-2 ring-opacity-30` : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                      isTopThree
                        ? `bg-gradient-to-br ${rankColor} text-white shadow-lg`
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isTopThree ? (
                      <Medal className="w-6 h-6" />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {entry.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {entry.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      {activeTab === 'trips' && <Plane className="w-4 h-4" />}
                      {activeTab === 'states' && <Globe className="w-4 h-4" />}
                      {activeTab === 'reviews' && <Star className="w-4 h-4" />}
                      <span>{getValueLabel(entry)}</span>
                    </div>
                    {/* States list for states tab */}
                    {activeTab === 'states' && entry.states && entry.states.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.states.map((state, i) => (
                          <span
                            key={i}
                            className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full"
                          >
                            {state}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-2xl font-bold ${
                        isTopThree ? 'text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      {activeTab === 'reviews' ? entry.value.toFixed(1) : entry.value}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                      {activeTab === 'trips' && 'trips'}
                      {activeTab === 'states' && 'states'}
                      {activeTab === 'reviews' && 'rating'}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-400 to-yellow-500"></div>
          <span>1st Place</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-300 to-slate-400"></div>
          <span>2nd Place</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-600 to-amber-700"></div>
          <span>3rd Place</span>
        </div>
      </div>
    </div>
  );
};
