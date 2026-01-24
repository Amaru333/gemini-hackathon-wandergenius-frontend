import React, { useState } from 'react';
import { X, Check, Users, DollarSign, Tag, FileText } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
}

interface AddExpenseModalProps {
  participants: Participant[];
  onAdd: (data: any) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

const CATEGORIES = [
  'Food & Dining',
  'transportation',
  'Accommodation',
  'Activities',
  'Shopping',
  'Entertainment',
  'Groceries',
  'Other'
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ participants, onAdd, onClose, isOpen }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food & Dining',
    paidById: '', // default to first person or "Me"
    splitType: 'equal', // equal, custom (simplified to equal for now)
    splitWithIds: [] as string[]
  });

  // Set defaults once participants load
  React.useEffect(() => {
    if (participants.length > 0 && !formData.paidById) {
      setFormData(prev => ({
        ...prev,
        paidById: participants[0].id,
        splitWithIds: participants.map(p => p.id) // Default split with everyone
      }));
    }
  }, [participants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || formData.splitWithIds.length === 0) return;

    try {
      setLoading(true);
      await onAdd({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onClose();
      // Reset form
      setFormData(prev => ({ ...prev, description: '', amount: '' }));
    } catch (err) {
      console.error('Failed to add expense', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSplitParticipant = (id: string) => {
    setFormData(prev => {
      const current = prev.splitWithIds;
      const exists = current.includes(id);
      
      if (exists) {
        return { ...prev, splitWithIds: current.filter(pid => pid !== id) };
      } else {
        return { ...prev, splitWithIds: [...current, id] };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Add Expense</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Amount & Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Expense Details</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-slate-400">$</div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-900 font-medium"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Dinner, Uber, etc."
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-900"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                      formData.category === cat
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Paid By</label>
              <select
                value={formData.paidById}
                onChange={e => setFormData({ ...formData, paidById: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-900 bg-white"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Split With */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Split With ({formData.splitWithIds.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {participants.map(p => {
                  const isSelected = formData.splitWithIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleSplitParticipant(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-500'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {p.name}
                    </button>
                  );
                })}
              </div>
              {formData.splitWithIds.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Select at least one person to split with</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.amount || !formData.description || formData.splitWithIds.length === 0}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Adding...</span>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" /> Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
