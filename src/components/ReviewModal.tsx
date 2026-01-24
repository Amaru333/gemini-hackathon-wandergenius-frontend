import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, MapPin, Sparkles, Star } from 'lucide-react';
import { StarRating } from './StarRating';
import { api } from '../services/api';

interface ReviewModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  tripId,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const [budgetRating, setBudgetRating] = useState(0);
  const [locationRating, setLocationRating] = useState(0);
  const [activitiesRating, setActivitiesRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadExistingReview();
    }
  }, [isOpen, tripId]);

  const loadExistingReview = async () => {
    setLoadingExisting(true);
    try {
      const review = await api.getUserReview(tripId);
      if (review) {
        setBudgetRating(review.budgetRating);
        setLocationRating(review.locationRating);
        setActivitiesRating(review.activitiesRating);
        setOverallRating(review.overallRating);
        setComment(review.comment || '');
      } else {
        // Reset for new review
        setBudgetRating(0);
        setLocationRating(0);
        setActivitiesRating(0);
        setOverallRating(0);
        setComment('');
      }
    } catch (err) {
      console.error('Failed to load existing review:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (budgetRating === 0 || locationRating === 0 || activitiesRating === 0 || overallRating === 0) {
      setError('Please rate all categories');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createReview(tripId, {
        budgetRating,
        locationRating,
        activitiesRating,
        overallRating,
        comment: comment.trim() || undefined,
      });
      onReviewSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { label: 'Budget Value', rating: budgetRating, setRating: setBudgetRating, icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Location Quality', rating: locationRating, setRating: setLocationRating, icon: MapPin, color: 'text-blue-600' },
    { label: 'Activities', rating: activitiesRating, setRating: setActivitiesRating, icon: Sparkles, color: 'text-purple-600' },
    { label: 'Overall Experience', rating: overallRating, setRating: setOverallRating, icon: Star, color: 'text-amber-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Rate Your Trip</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loadingExisting ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {categories.map(({ label, rating, setRating, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="font-medium text-slate-700">{label}</span>
                  </div>
                  <StarRating rating={rating} onRatingChange={setRating} size="md" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
