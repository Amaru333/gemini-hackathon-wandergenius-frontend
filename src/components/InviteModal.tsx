import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, Users, UserPlus, Trash2, Crown, Eye, Edit3 } from 'lucide-react';
import { api } from '../services/api';

interface Collaborator {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteToken?: string;
  user?: { id: string; name: string; email: string };
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  isOwner: boolean;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, tripId, isOwner }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [owner, setOwner] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loadingCollabs, setLoadingCollabs] = useState(false);

  useEffect(() => {
    if (isOpen && tripId) {
      loadCollaborators();
    }
  }, [isOpen, tripId]);

  const loadCollaborators = async () => {
    setLoadingCollabs(true);
    try {
      const data = await api.getCollaborators(tripId);
      setCollaborators(data.collaborators);
      setOwner(data.owner);
    } catch (err) {
      console.error('Failed to load collaborators', err);
    } finally {
      setLoadingCollabs(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.inviteCollaborator(tripId, email.trim(), role);
      setSuccess(`Invitation sent to ${email}`);
      setInviteLink(result.inviteLink);
      setEmail('');
      loadCollaborators();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    if (!confirm('Remove this collaborator?')) return;
    try {
      await api.removeCollaborator(tripId, collaboratorId);
      loadCollaborators();
    } catch (err) {
      console.error('Failed to remove collaborator', err);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-4 h-4 text-amber-500" />;
    if (role === 'editor') return <Edit3 className="w-4 h-4 text-blue-500" />;
    return <Eye className="w-4 h-4 text-slate-400" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      declined: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Collaborators</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Invite Form (Owner only) */}
          {isOwner && (
            <form onSubmit={handleInvite} className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invite by email
              </label>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'editor' | 'viewer')}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">View only</option>
                </select>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg mb-3">
                  {success}
                </div>
              )}

              {inviteLink && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-2">Share this invite link:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Collaborators List */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Team Members</h3>
            
            {loadingCollabs ? (
              <div className="text-center py-6 text-slate-400 text-sm">Loading...</div>
            ) : (
              <div className="space-y-2">
                {/* Owner */}
                {owner && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                        <Crown className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {owner.name || owner.email}
                        </p>
                        <p className="text-xs text-slate-500">{owner.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Owner
                    </span>
                  </div>
                )}

                {/* Collaborators */}
                {collaborators.map(collab => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        {getRoleIcon(collab.role)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {collab.user?.name || collab.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{collab.role}</span>
                          {getStatusBadge(collab.status)}
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(collab.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {collaborators.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    No collaborators yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
