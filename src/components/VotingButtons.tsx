import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface VotingButtonsProps {
  day: number;
  activityIndex: number;
  upVotes: number;
  downVotes: number;
  userVote: 'up' | 'down' | null;
  onVote: (day: number, activityIndex: number, vote: 'up' | 'down') => void;
  disabled?: boolean;
}

export const VotingButtons: React.FC<VotingButtonsProps> = ({
  day,
  activityIndex,
  upVotes,
  downVotes,
  userVote,
  onVote,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onVote(day, activityIndex, 'up')}
        disabled={disabled}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
          userVote === 'up'
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Vote up"
      >
        <ThumbsUp className="w-3 h-3" />
        <span>{upVotes}</span>
      </button>
      <button
        onClick={() => onVote(day, activityIndex, 'down')}
        disabled={disabled}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
          userVote === 'down'
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Vote down"
      >
        <ThumbsDown className="w-3 h-3" />
        <span>{downVotes}</span>
      </button>
    </div>
  );
};
