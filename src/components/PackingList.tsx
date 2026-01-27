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
  Loader2,
  Wand2,
  CloudSun,
  AlertTriangle,
  Lightbulb,
  ThermometerSun,
  X,
  Check,
  Plus,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

interface PackingItem {
  id: number;
  task: string;
  category: string;
  completed: boolean;
}

interface AiPackingItem extends PackingItem {
  reason: string;
  priority: 'essential' | 'recommended' | 'optional';
  weatherRelated: boolean;
  isAiSuggested: boolean;
}

interface PackingTemplate {
  id: string;
  name: string;
  items: PackingItem[];
  createdAt: string;
}

interface WeatherDay {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

interface AiSuggestions {
  items: AiPackingItem[];
  tips: string[];
  warnings: string[];
  weatherSummary: string | null;
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

const PRIORITY_STYLES = {
  essential: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  recommended: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  optional: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600' }
};

export const PackingList: React.FC<PackingListProps> = ({ tripId, items, onItemToggle, onItemsUpdate }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.key)));
  const [templates, setTemplates] = useState<PackingTemplate[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // AI Packing Advisor states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestions | null>(null);
  const [selectedAiItems, setSelectedAiItems] = useState<Set<number>>(new Set());
  const [weatherForecast, setWeatherForecast] = useState<WeatherDay[] | null>(null);
  const [tripInfo, setTripInfo] = useState<{ destination: string; days: number; activities: string[] } | null>(null);
  const [applyMode, setApplyMode] = useState<'merge' | 'replace'>('merge');
  const [applying, setApplying] = useState(false);

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

  // AI Packing Advisor functions
  const handleOpenAiAdvisor = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    setAiSuggestions(null);
    setSelectedAiItems(new Set());
    
    try {
      const response = await api.getSmartPackingSuggestions(tripId);
      setAiSuggestions(response.suggestions);
      setTripInfo(response.tripInfo);
      setWeatherForecast(response.weather.available ? response.weather.forecast || null : null);
      
      // Pre-select essential and recommended items
      const preSelected = new Set<number>();
      response.suggestions.items.forEach(item => {
        if (item.priority === 'essential' || item.priority === 'recommended') {
          preSelected.add(item.id);
        }
      });
      setSelectedAiItems(preSelected);
    } catch (err) {
      console.error('Failed to get AI suggestions:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAiItemSelection = (itemId: number) => {
    setSelectedAiItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllAiItems = () => {
    if (!aiSuggestions) return;
    const allIds = new Set(aiSuggestions.items.map(item => item.id));
    setSelectedAiItems(allIds);
  };

  const deselectAllAiItems = () => {
    setSelectedAiItems(new Set());
  };

  const handleApplyAiSuggestions = async () => {
    if (!aiSuggestions || selectedAiItems.size === 0) return;
    
    setApplying(true);
    try {
      const selectedItems = aiSuggestions.items
        .filter(item => selectedAiItems.has(item.id))
        .map(item => ({ task: item.task, category: item.category }));
      
      const result = await api.applySmartPackingSuggestions(tripId, selectedItems, applyMode);
      
      if (onItemsUpdate && result.checklist) {
        onItemsUpdate(result.checklist);
      }
      
      setShowAiModal(false);
      setAiSuggestions(null);
    } catch (err) {
      console.error('Failed to apply AI suggestions:', err);
    } finally {
      setApplying(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const icons: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    };
    return icons[condition] || '🌤️';
  };

  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-4">
      {/* Header with overall progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <h3 className="font-semibold text-slate-900">Smart Packing List</h3>
        </div>
        
        {/* Buttons row - responsive grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* AI Optimize Button */}
          <button
            onClick={handleOpenAiAdvisor}
            className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Wand2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">AI</span>
          </button>
          
          {/* Templates Button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="w-full flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Templates</span>
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
          
          {/* Save Button */}
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Save</span>
          </button>
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

      {/* AI Packing Advisor Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Packing Advisor</h3>
                    <p className="text-sm text-white/80">
                      {tripInfo ? `${tripInfo.destination} • ${tripInfo.days} days` : 'Analyzing your trip...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-900">Analyzing Your Trip</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Checking weather, activities, and your preferences...
                    </p>
                  </div>
                </div>
              ) : aiSuggestions ? (
                <>
                  {/* Weather Forecast */}
                  {weatherForecast && weatherForecast.length > 0 && (
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CloudSun className="w-5 h-5 text-sky-600" />
                        <h4 className="font-semibold text-sky-900">Weather Forecast</h4>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {weatherForecast.slice(0, 5).map((day, i) => (
                          <div key={i} className="flex-shrink-0 bg-white/80 rounded-lg p-3 text-center min-w-[80px]">
                            <p className="text-xs text-slate-500">Day {i + 1}</p>
                            <p className="text-2xl my-1">{getWeatherIcon(day.condition)}</p>
                            <p className="font-semibold text-slate-900">{day.temp}°C</p>
                            <p className="text-xs text-slate-500">{day.condition}</p>
                          </div>
                        ))}
                      </div>
                      {aiSuggestions.weatherSummary && (
                        <p className="text-sm text-sky-800 mt-3 flex items-start gap-2">
                          <ThermometerSun className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {aiSuggestions.weatherSummary}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warnings */}
                  {aiSuggestions.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h4 className="font-semibold text-amber-900">Don't Forget!</h4>
                      </div>
                      <ul className="space-y-1">
                        {aiSuggestions.warnings.map((warning, i) => (
                          <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {aiSuggestions.tips.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-900">Packing Tips</h4>
                      </div>
                      <ul className="space-y-1">
                        {aiSuggestions.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">
                        Suggested Items ({selectedAiItems.size} of {aiSuggestions.items.length} selected)
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllAiItems}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={deselectAllAiItems}
                          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {aiSuggestions.items.map(item => {
                        const isSelected = selectedAiItems.has(item.id);
                        const priorityStyle = PRIORITY_STYLES[item.priority];
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleAiItemSelection(item.id)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                              isSelected 
                                ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' 
                                : `${priorityStyle.bg} ${priorityStyle.border} hover:ring-1 hover:ring-slate-200`
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected ? 'bg-indigo-600' : 'border-2 border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                  {item.task}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityStyle.badge}`}>
                                  {item.priority}
                                </span>
                                {item.weatherRelated && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                                    🌤️ weather
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{item.reason}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <p className="text-slate-500">Failed to load suggestions. Please try again.</p>
                  <button
                    onClick={handleOpenAiAdvisor}
                    className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {aiSuggestions && !aiLoading && (
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 sm:flex-1">
                    <span className="text-sm text-slate-600">Mode:</span>
                    <button
                      onClick={() => setApplyMode('merge')}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        applyMode === 'merge' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Merge
                    </button>
                    <button
                      onClick={() => setApplyMode('replace')}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        applyMode === 'replace' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                      Replace
                    </button>
                  </div>
                  <div className="flex gap-3 sm:justify-end">
                    <button
                      onClick={() => setShowAiModal(false)}
                      className="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyAiSuggestions}
                      disabled={selectedAiItems.size === 0 || applying}
                      className="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {applying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Apply {selectedAiItems.size} Items
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {applyMode === 'merge' 
                    ? 'Selected items will be added to your existing packing list.' 
                    : 'Your current packing list will be replaced with selected items.'}
                </p>
              </div>
            )}
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
