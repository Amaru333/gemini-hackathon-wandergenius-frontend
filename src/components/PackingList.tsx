import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Shirt,
  Droplet,
  FileText,
  Backpack,
  ChevronDown,
  ChevronRight,
  Save,
  FolderOpen,
  Trash2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface PackingItem {
  id: number;
  task: string;
  category: string;
  completed: boolean;
}

interface PackingTemplate {
  id: string;
  name: string;
  items: PackingItem[];
  createdAt: string;
}

interface PackingListProps {
  tripId: string;
  items: PackingItem[];
  onItemToggle: (itemId: number) => void;
  onItemsUpdate?: (items: PackingItem[]) => void;
}

const CATEGORIES = [
  { key: 'clothing', label: 'Clothing', icon: Shirt, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { key: 'toiletries', label: 'Toiletries', icon: Droplet, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { key: 'documents', label: 'Documents', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'gear', label: 'Gear', icon: Backpack, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
];

export const PackingList: React.FC<PackingListProps> = ({ tripId, items, onItemToggle, onItemsUpdate }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.key)));
  const [templates, setTemplates] = useState<PackingTemplate[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getPackingTemplates();
      setTemplates(data);
    } catch (err) {
      console.log('Could not load templates:', err);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const categoryItems = getItemsByCategory(category);
    if (categoryItems.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = categoryItems.filter(i => i.completed).length;
    return { completed, total: categoryItems.length, percent: Math.round((completed / categoryItems.length) * 100) };
  };

  const getOverallProgress = () => {
    if (items.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = items.filter(i => i.completed).length;
    return { completed, total: items.length, percent: Math.round((completed / items.length) * 100) };
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    
    setSaving(true);
    try {
      await api.savePackingTemplate(templateName.trim(), items);
      setTemplateName('');
      setShowSaveModal(false);
      loadTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (template: PackingTemplate) => {
    setLoading(true);
    try {
      const result = await api.applyPackingTemplate(tripId, template.id);
      if (onItemsUpdate && result.checklist) {
        onItemsUpdate(result.checklist);
      }
      setShowTemplateDropdown(false);
    } catch (err) {
      console.error('Failed to apply template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    try {
      await api.deletePackingTemplate(templateId);
      loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-4">
      {/* Header with overall progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <h3 className="font-semibold text-slate-900 whitespace-nowrap">Smart Packing List</h3>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </button>
              
              {showTemplateDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase">Saved Templates</p>
                  </div>
                  {templates.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400 text-center">No templates saved yet</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleApplyTemplate(template)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                        >
                          <span className="text-sm text-slate-700">{template.name}</span>
                          <button
                            onClick={(e) => handleDeleteTemplate(e, template.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${overallProgress.percent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600 min-w-[60px] text-right">
            {overallProgress.completed} / {overallProgress.total}
          </span>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      )}

      {/* Categories */}
      {!loading && CATEGORIES.map(category => {
        const categoryItems = getItemsByCategory(category.key);
        if (categoryItems.length === 0) return null;
        
        const progress = getCategoryProgress(category.key);
        const isExpanded = expandedCategories.has(category.key);
        const Icon = category.icon;

        return (
          <div key={category.key} className={`bg-white border rounded-xl overflow-hidden ${category.borderColor}`}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.key)}
              className={`w-full flex items-center justify-between p-4 ${category.bgColor} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/80 ${category.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className={`font-semibold ${category.color}`}>{category.label}</h4>
                  <p className="text-xs text-slate-500">{progress.completed} of {progress.total} packed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${category.color.replace('text-', 'bg-')} transition-all duration-300`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Category items */}
            {isExpanded && (
              <div className="p-2 space-y-1">
                {categoryItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onItemToggle(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      item.completed 
                        ? 'bg-emerald-50 hover:bg-emerald-100' 
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                      {item.task}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Save as Template</h3>
            <p className="text-sm text-slate-500 mb-4">
              Save this packing list as a reusable template for future trips.
            </p>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name (e.g., Beach Vacation)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Template'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showTemplateDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowTemplateDropdown(false)} 
        />
      )}
    </div>
  );
};
