import React from 'react';
import { 
  Sprout, Plane, Globe, Star, Award, Users, Share2, Map,
  LucideIcon
} from 'lucide-react';

interface BadgeCardProps {
  badgeType: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, LucideIcon> = {
  Seedling: Sprout,
  Sprout: Sprout,
  Plane: Plane,
  Globe: Globe,
  Star: Star,
  Award: Award,
  Users: Users,
  Share2: Share2,
  Map: Map,
};

const colorMap: Record<string, string> = {
  first_trip: 'from-emerald-400 to-emerald-600',
  jet_setter: 'from-sky-400 to-blue-600',
  world_traveler: 'from-indigo-400 to-purple-600',
  critic: 'from-amber-400 to-orange-500',
  top_reviewer: 'from-rose-400 to-pink-600',
  team_player: 'from-cyan-400 to-teal-600',
  influencer: 'from-fuchsia-400 to-purple-600',
  explorer: 'from-lime-400 to-green-600',
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badgeType,
  name,
  description,
  icon,
  earnedAt,
  earned = true,
  size = 'md',
}) => {
  const IconComponent = iconMap[icon] || Star;
  const gradient = colorMap[badgeType] || 'from-slate-400 to-slate-600';
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center text-center ${earned ? '' : 'opacity-40 grayscale'}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${earned ? 'animate-pulse-slow' : ''}`}>
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
          <IconComponent className={`${iconSizes[size]} text-white`} />
        </div>
      </div>
      <h3 className="font-bold text-slate-900 mt-3 text-sm">{name}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-[120px]">{description}</p>
      {earnedAt && earned && (
        <span className="text-xs text-indigo-600 mt-2 font-medium">
          {new Date(earnedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};
