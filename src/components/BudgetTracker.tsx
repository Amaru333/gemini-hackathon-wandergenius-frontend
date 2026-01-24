import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  Plus, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Wallet,
  ArrowRight,
  Trash2,
  Loader2,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { AddExpenseModal } from './AddExpenseModal';

interface Participant {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paidById: string;
  paidBy: Participant;
  splitWithIds: string[];
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

interface BudgetData {
  id: string;
  totalBudget: number;
  currency: string;
  expenses: Expense[];
  participants: Participant[];
  totalSpent: number;
  remaining: number;
  debts: Debt[];
}

interface BudgetTrackerProps {
  tripId: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ tripId }) => {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'splits'>('overview');
  
  // Setup form state
  const [setupData, setSetupData] = useState({
    totalBudget: '',
    participants: '' // comma separated
  });

  const loadBudget = async () => {
    try {
      setLoading(true);
      const data = await api.getBudget(tripId);
      
      if (data.notSetup) {
        setBudget(null);
      } else {
        setBudget(data);
      }
    } catch (err) {
      console.error('Failed to load budget', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, [tripId]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.setupBudget(tripId, {
        totalBudget: parseFloat(setupData.totalBudget),
        currency: 'USD',
        participants: setupData.participants.split(',').map(n => n.trim()).filter(Boolean)
      });
      await loadBudget();
      setIsSetupModalOpen(false);
    } catch (err) {
      console.error('Setup failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (data: any) => {
    await api.addExpense(tripId, data);
    await loadBudget();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(tripId, expenseId);
      await loadBudget();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (loading && !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Budget Setup View
  if (!budget && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto mt-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Track Trip Expenses</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Set a budget, add friends, and effortlessly split costs. We'll verify who owes who.
        </p>
        
        {!isSetupModalOpen ? (
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Setup Budget
          </button>
        ) : (
          <form onSubmit={handleSetup} className="max-w-sm mx-auto text-left space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input
                  type="number"
                  required
                  value={setupData.totalBudget}
                  onChange={e => setSetupData({...setupData, totalBudget: e.target.value})}
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="2000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Add Friends (comma separated)</label>
              <input
                type="text"
                value={setupData.participants}
                onChange={e => setSetupData({...setupData, participants: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Alice, Bob, Charlie"
              />
              <p className="text-xs text-slate-400 mt-1">Don't include yourself, we add 'Me' automatically.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Start Tracking
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Prepare chart data
  const categoryData = budget?.expenses.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-sm font-medium text-slate-500 mb-1">Total Budget</div>
           <div className="text-2xl font-bold text-slate-900">${budget?.totalBudget.toLocaleString()}</div>
           <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
             <div 
               className="bg-emerald-500 h-full rounded-full transition-all duration-500"
               style={{ width: `${Math.min(100, (budget!.totalSpent / budget!.totalBudget) * 100)}%` }}
             />
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-sm font-medium text-slate-500 mb-1">Total Spent</div>
           <div className="text-2xl font-bold text-indigo-600">${budget?.totalSpent.toLocaleString()}</div>
           <div className="text-xs text-slate-400 mt-1">
             {((budget!.totalSpent / budget!.totalBudget) * 100).toFixed(1)}% of budget
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-sm font-medium text-slate-500 mb-1">Remaining</div>
           <div className={`text-2xl font-bold ${budget!.remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
             ${budget?.remaining.toLocaleString()}
           </div>
           <div className="text-xs text-slate-400 mt-1">
             Available to spend
           </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
        <div className="border-b border-slate-100 flex items-center justify-between px-6 py-4">
          <div className="flex gap-2 bg-slate-100/50 p-1 rounded-lg">
            {(['overview', 'expenses', 'splits'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Pie Chart */}
              <div className="h-[300px]">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Spending Breakdown</h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                    <span>No expenses yet</span>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {budget!.expenses.slice(0, 5).map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                           <CreditCard className="w-5 h-5" />
                         </div>
                         <div>
                           <div className="text-sm font-semibold text-slate-900">{expense.description}</div>
                           <div className="text-xs text-slate-500">
                             {expense.paidBy.name} • {new Date(expense.date).toLocaleDateString()}
                           </div>
                         </div>
                       </div>
                       <span className="font-semibold text-slate-900">-${expense.amount.toFixed(2)}</span>
                    </div>
                  ))}

                  {budget!.expenses.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                      No recent activity
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
             <div className="overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                     <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                     <th className="px-4 py-3 font-semibold text-slate-600">Paid By</th>
                     <th className="px-4 py-3 font-semibold text-slate-600">Amount</th>
                     <th className="px-4 py-3 font-semibold text-slate-600 w-10"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {budget!.expenses.map(expense => (
                     <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-4 py-3 font-medium text-slate-900">{expense.description}</td>
                       <td className="px-4 py-3">
                         <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                           {expense.category}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-slate-600">{expense.paidBy.name}</td>
                       <td className="px-4 py-3 font-medium text-slate-900">${expense.amount.toFixed(2)}</td>
                       <td className="px-4 py-3 text-right">
                         <button 
                           onClick={() => handleDeleteExpense(expense.id)}
                           className="text-slate-400 hover:text-red-500 transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {budget!.expenses.length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-12 text-center text-slate-400">
                         No expenses recorded yet.
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          )}

          {activeTab === 'splits' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-slate-900">Who owes who?</h3>
                <p className="text-slate-500 text-sm">Optimal way to settle all debts</p>
              </div>

              {budget!.debts.length > 0 ? (
                <div className="space-y-3">
                  {budget!.debts.map((debt, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-semibold text-sm">
                          {debt.from.charAt(0)}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-slate-900">{debt.from}</span>
                          <span className="text-slate-500"> owes </span>
                          <span className="font-semibold text-slate-900">{debt.to}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">${debt.amount.toFixed(2)}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-slate-900">All settled up!</h3>
                  <p className="text-slate-500 text-sm">No one owes anything right now.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        participants={budget!.participants}
        onAdd={handleAddExpense}
      />
    </div>
  );
};
