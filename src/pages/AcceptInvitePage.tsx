import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User, Check, X, Loader2, LogIn } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvite();
    }
  }, [token]);

  const loadInvite = async () => {
    try {
      const data = await api.getInviteDetails(token!);
      setInvite(data);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invite');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Store invite token and redirect to login
      localStorage.setItem('pendingInvite', token!);
      navigate('/login');
      return;
    }

    setAccepting(true);
    try {
      const result = await api.acceptInvite(token!);
      navigate(`/itinerary/${result.tripId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite');
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    setDeclining(true);
    try {
      await api.declineInvite(token!);
      navigate('/history');
    } catch (err: any) {
      setError(err.message || 'Failed to decline invite');
      setDeclining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 rounded-xl p-8 border border-red-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Invalid Invite</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (invite?.status !== 'pending') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Invite Already {invite?.status === 'accepted' ? 'Accepted' : 'Processed'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            This invitation has already been {invite?.status}.
          </p>
          <button
            onClick={() => navigate('/history')}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            View Your Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Trip Preview */}
        {invite?.trip?.photoUrl && (
          <div className="h-40 relative">
            <img
              src={invite.trip.photoUrl}
              alt={invite.trip.destinationName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-xl font-bold">{invite?.trip?.destinationName}</h2>
            </div>
          </div>
        )}

        <div className="p-6">
          {!invite?.trip?.photoUrl && (
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {invite?.trip?.destinationName}
            </h2>
          )}

          <p className="text-slate-600 mb-6">
            <span className="font-medium">{invite?.trip?.ownerName}</span> invited you to collaborate on this trip.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>From {invite?.trip?.startLocation}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{invite?.trip?.days} days</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>
                Role: <span className="font-medium capitalize">{invite?.role}</span>
                {invite?.role === 'editor' && ' (can edit itinerary)'}
                {invite?.role === 'viewer' && ' (view only)'}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!user && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800">
                <LogIn className="w-4 h-4 inline mr-1" />
                Sign in or create an account to join this trip.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              disabled={declining}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {declining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {user ? 'Accept & Join' : 'Sign in to Join'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
