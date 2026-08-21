import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Trash2,
  Copy,
  Layers,
  CheckCircle2,
  Lock,
  Radio,
  Tv,
  MessageSquare,
  Zap,
  Bot,
  ArrowUp,
  ArrowDown,
  Plus,
  Sliders,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Channel, AIOrganizeResult } from '../types/channel';
import { AIOrganizeService } from '../services/aiOrganizeService';
import {
  CategoryDefinition,
  PREDEFINED_CATEGORIES,
  CATEGORY_PRESETS,
} from '../types/category';
import { translations } from '../utils/i18n';

export interface AIOrganizeOptions {
  removeDuplicates: boolean;
  hideScrambled: boolean;
  organizeCategories: boolean;
  removeJunk: boolean;
  prioritizeHD: boolean;
  groupRadioAtEnd: boolean;
  renumberSequential: boolean;
  customPrompt: string;
  engineMode: 'ai' | 'local';
  activeCategories?: CategoryDefinition[];
  language?: 'en' | 'ar';
}

interface AIOrganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onApplyAIResults: (
    removedJunkIds: string[],
    hiddenDuplicateIds: string[],
    newCategoryOrder: { categoryName: string; srvIds: string[] }[]
  ) => void;
  language: 'en' | 'ar';
}

export const AIOrganizeModal: React.FC<AIOrganizeModalProps> = ({
  isOpen,
  onClose,
  channels,
  apiKey,
  onSaveApiKey,
  onApplyAIResults,
  language,
}) => {
  const t = translations[language];
  const aim = t.aiModal;

  // Wizard Step: 'options' -> 'analyzing' -> 'review'
  const [step, setStep] = useState<'options' | 'analyzing' | 'review'>('options');

  // Active Category list & Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('english_first');
  const [categoryList, setCategoryList] = useState<CategoryDefinition[]>(() => {
    const preset = CATEGORY_PRESETS.find((p) => p.id === 'english_first');
    if (!preset) return PREDEFINED_CATEGORIES;
    const map = new Map(PREDEFINED_CATEGORIES.map((c) => [c.id, c]));
    const ordered: CategoryDefinition[] = [];
    preset.categoryIds.forEach((id) => {
      if (map.has(id)) ordered.push(map.get(id)!);
    });
    // Add any remaining
    PREDEFINED_CATEGORIES.forEach((c) => {
      if (!preset.categoryIds.includes(c.id)) ordered.push(c);
    });
    return ordered;
  });

  const [isCategoryCustomizerOpen, setIsCategoryCustomizerOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatKeywords, setNewCatKeywords] = useState('');

  // Checkbox configuration + Custom Prompt
  const [options, setOptions] = useState<AIOrganizeOptions>({
    removeDuplicates: true,
    hideScrambled: true,
    organizeCategories: true,
    removeJunk: true,
    prioritizeHD: true,
    groupRadioAtEnd: true,
    renumberSequential: true,
    customPrompt: '',
    engineMode: apiKey && apiKey.trim() !== '' ? 'ai' : 'local',
  });

  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [aiResults, setAiResults] = useState<AIOrganizeResult | null>(null);

  // User selections in review
  const [selectedJunkIds, setSelectedJunkIds] = useState<Set<string>>(new Set());
  const [selectedHideDupeIds, setSelectedHideDupeIds] = useState<Set<string>>(new Set());
  const [selectedScrambledIds, setSelectedScrambledIds] = useState<Set<string>>(new Set());
  const [categoriesOrder, setCategoriesOrder] = useState<
    { categoryName: string; categoryIcon?: string; srvIds: string[] }[]
  >([]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = CATEGORY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const map = new Map(categoryList.map((c) => [c.id, c]));
    const ordered: CategoryDefinition[] = [];

    // Order active categories according to preset
    preset.categoryIds.forEach((id) => {
      const cat = map.get(id);
      if (cat) {
        ordered.push({ ...cat, enabled: true });
        map.delete(id);
      }
    });

    // Append remaining custom or non-preset categories
    map.forEach((cat) => {
      ordered.push(cat);
    });

    setCategoryList(ordered);
  };

  const handleToggleCategory = (id: string) => {
    setCategoryList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categoryList.length) return;
    const next = [...categoryList];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setCategoryList(next);
  };

  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;
    const customId = `custom_${Date.now()}`;
    const keywordsRegex = new RegExp(
      newCatKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .join('|') || newCatName.trim(),
      'i'
    );

    const newDef: CategoryDefinition = {
      id: customId,
      name: newCatName.trim(),
      nameAr: newCatName.trim(),
      icon: newCatIcon || '📁',
      keywords: keywordsRegex,
      enabled: true,
      isCustom: true,
    };

    setCategoryList((prev) => [newDef, ...prev]);
    setNewCatName('');
    setNewCatKeywords('');
    setIsAddingCategory(false);
  };

  const handleRemoveCategory = (id: string) => {
    setCategoryList((prev) => prev.filter((c) => c.id !== id));
  };

  const handleStartAnalysis = async () => {
    if (options.engineMode === 'ai' && (!apiKey || apiKey.trim() === '')) {
      alert(
        language === 'ar'
          ? 'الرجاء إضافة مفتاح API الخاص بـ Gemini في الإعدادات أولاً لاستخدام الذكاء الاصطناعي.'
          : 'Please add your Google Gemini API key in Settings first to use the AI engine.'
      );
      return;
    }

    setStep('analyzing');
    setProgressMsg(aim.analyzingProgress);
    setProgressPercent(15);

    try {
      // Find scrambled channels if option is enabled
      const scrambledIds = new Set<string>();
      if (options.hideScrambled) {
        channels.forEach((c) => {
          if (c.scrambled) scrambledIds.add(c.srvId);
        });
      }
      setSelectedScrambledIds(scrambledIds);

      // Run AI / Rule-based organizer with configured category order & custom prompt
      const results = await AIOrganizeService.organizeWithOptions(
        channels,
        {
          ...options,
          activeCategories: categoryList.filter((c) => c.enabled),
          language,
        },
        apiKey,
        (msg: string, pct: number) => {
          setProgressMsg(msg);
          setProgressPercent(pct);
        }
      );

      setAiResults(results);

      // Populate review state with AI recommendations
      if (options.removeJunk) {
        setSelectedJunkIds(new Set(results.junkSrvIds || []));
      } else {
        setSelectedJunkIds(new Set());
      }

      if (options.removeDuplicates) {
        const dupeHideIds = new Set<string>();
        (results.duplicateGroups || []).forEach((group) => {
          (group.hideSrvIds || []).forEach((id) => dupeHideIds.add(id));
        });
        setSelectedHideDupeIds(dupeHideIds);
      } else {
        setSelectedHideDupeIds(new Set());
      }

      if (options.organizeCategories) {
        // Map category names to active language
        const catMap = new Map<string, string>();
        PREDEFINED_CATEGORIES.forEach((pc) => {
          catMap.set(pc.name.toLowerCase().trim(), language === 'ar' ? pc.nameAr : pc.name);
          catMap.set(pc.nameAr.toLowerCase().trim(), language === 'ar' ? pc.nameAr : pc.name);
        });
        catMap.set('regional & general', language === 'ar' ? 'قنوات عامة وإقليمية' : 'Regional & General');
        catMap.set('قنوات عامة وإقليمية', language === 'ar' ? 'قنوات عامة وإقليمية' : 'Regional & General');

        setCategoriesOrder(
          (results.categories || []).map((c) => {
            const mappedName = catMap.get(c.categoryName.toLowerCase().trim()) || c.categoryName;
            return {
              categoryName: mappedName,
              categoryIcon: c.categoryIcon,
              srvIds: c.srvIds || [],
            };
          })
        );
      } else {
        setCategoriesOrder([]);
      }

      setStep('review');
    } catch (err: any) {
      alert(`Error during smart organization: ${err.message || err}`);
      setStep('options');
    }
  };

  const handleApply = () => {
    onApplyAIResults(
      Array.from(selectedJunkIds),
      Array.from(selectedHideDupeIds),
      categoriesOrder
    );
  };

  const toggleOption = (key: keyof AIOrganizeOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setPromptExample = (exampleText: string) => {
    setOptions((prev) => ({
      ...prev,
      customPrompt: prev.customPrompt ? `${prev.customPrompt}\n${exampleText}` : exampleText,
    }));
  };

  // Channel counts for stats
  const activeChannelsCount =
    channels.length - selectedJunkIds.size - selectedHideDupeIds.size - selectedScrambledIds.size;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-700/80 shadow-2xl overflow-hidden animate-fade-in my-auto">
        {/* Modal Header */}
        <div
          className="p-5 sm:p-6 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 flex-shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {aim.title}
                </h2>
                {apiKey && apiKey.trim() !== '' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold border border-purple-500/30 flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    {language === 'ar' ? 'ذكاء Gemini مفعّل' : 'Gemini API Active'}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1 shadow-sm">
                    <Zap className="w-3 h-3" />
                    {language === 'ar' ? 'المحرك المحلي السريع' : 'Local Fast Engine'}
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {aim.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* ════════ STEP 1: OPTIONS & CATEGORY PRESETS ════════ */}
          {step === 'options' && (
            <div className="space-y-6">
              {/* 🧠 Engine Selection Toggle */}
              <div className="p-1 rounded-2xl bg-slate-900/50 border border-slate-800 flex shadow-inner">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, engineMode: 'ai' })}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                    options.engineMode === 'ai'
                      ? 'bg-purple-600 shadow-lg text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${options.engineMode === 'ai' ? 'text-purple-200' : ''}`} />
                  {aim.geminiAi}
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, engineMode: 'local' })}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                    options.engineMode === 'local'
                      ? 'bg-cyan-600 shadow-lg text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${options.engineMode === 'local' ? 'text-cyan-200' : ''}`} />
                  {aim.localEngine}
                </button>
              </div>

              {/* 📂 PREDEFINED CATEGORY PRESETS */}
              <div
                className="p-6 rounded-2xl border space-y-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-cyan-500">
                    <Layers className="w-5 h-5" />
                    <span>{aim.predefinedPresets}</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-semibold border border-cyan-500/25">
                    {categoryList.filter((c) => c.enabled).length} {aim.activeCategoriesCount}
                  </span>
                </div>

                {/* Preset Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORY_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500/15 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                            : 'border-slate-700/60 hover:border-slate-600 bg-slate-900/30'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm flex items-center justify-between w-full" style={{ color: 'var(--text-primary)' }}>
                          <span>{language === 'ar' ? preset.nameAr : preset.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {language === 'ar' ? preset.descriptionAr : preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Category Reordering & Customizer Accordion */}
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryCustomizerOpen(!isCategoryCustomizerOpen)}
                    className="flex items-center justify-between w-full text-xs font-bold text-cyan-600 dark:text-cyan-300 hover:opacity-80 py-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      {aim.customizeAccordion}
                    </span>
                    {isCategoryCustomizerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isCategoryCustomizerOpen && (
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1 animate-fade-in">
                      {categoryList.map((cat, idx) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                          style={{
                            backgroundColor: cat.enabled ? 'var(--bg-card)' : 'var(--bg-page)',
                            borderColor: 'var(--border-color)',
                            opacity: cat.enabled ? 1 : 0.6,
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={cat.enabled}
                              onChange={() => handleToggleCategory(cat.id)}
                              className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                            />
                            <span className="text-base">{cat.icon}</span>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {language === 'ar' ? cat.nameAr : cat.name}
                            </span>
                            <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>#{idx + 1}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveCategory(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-cyan-500 disabled:opacity-20 transition-colors cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCategory(idx, 'down')}
                              disabled={idx === categoryList.length - 1}
                              className="p-1 text-slate-400 hover:text-cyan-500 disabled:opacity-20 transition-colors cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {cat.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(cat.id)}
                                className="p-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add Custom Category Button */}
                      {!isAddingCategory ? (
                        <button
                          type="button"
                          onClick={() => setIsAddingCategory(true)}
                          className="w-full py-2 rounded-xl border border-dashed border-cyan-500/40 text-cyan-500 hover:bg-cyan-500/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors mt-2 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{aim.addCustomCategory}</span>
                        </button>
                      ) : (
                        <div className="p-3 rounded-xl border border-cyan-500/40 space-y-2 mt-2" style={{ backgroundColor: 'var(--bg-card)' }}>
                          <div className="text-xs font-bold text-cyan-500">
                            {aim.newCategoryLabel}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newCatIcon}
                              onChange={(e) => setNewCatIcon(e.target.value)}
                              placeholder="Icon"
                              className="w-12 text-center p-1.5 rounded-lg border text-xs font-bold"
                              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            />
                            <input
                              type="text"
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              placeholder={aim.categoryNamePlaceholder}
                              className="flex-1 p-1.5 rounded-lg border text-xs font-semibold"
                              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            />
                          </div>
                          <input
                            type="text"
                            value={newCatKeywords}
                            onChange={(e) => setNewCatKeywords(e.target.value)}
                            placeholder={aim.keywordsPlaceholder}
                            className="w-full p-1.5 rounded-lg border text-xs"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsAddingCategory(false)}
                              className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                              {t.cancel}
                            </button>
                            <button
                              type="button"
                              onClick={handleAddCustomCategory}
                              className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white cursor-pointer"
                            >
                              {aim.saveCategory}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 💬 Custom AI Prompt Input Area */}
              <div
                className="p-6 rounded-2xl border space-y-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sm sm:text-base flex items-center gap-2 text-cyan-500">
                    <MessageSquare className="w-4 h-4" />
                    <span>{aim.customInstructionsTitle}</span>
                  </label>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-semibold border border-cyan-500/25">
                    {aim.optional}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={options.customPrompt}
                    onChange={(e) => setOptions({ ...options, customPrompt: e.target.value })}
                    rows={3}
                    placeholder={aim.customInstructionsPlaceholder}
                    className="w-full rounded-2xl p-4 text-sm font-medium focus:outline-none transition-all leading-relaxed shadow-inner"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      boxSizing: 'border-box',
                      minHeight: '80px',
                    }}
                  />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {aim.quickPromptsTitle}
                  </span>
                  {[
                    {
                      label: aim.quickEnglish,
                      text: aim.quickEnglishPrompt,
                    },
                    {
                      label: aim.quickKids,
                      text: aim.quickKidsPrompt,
                    },
                    {
                      label: aim.quickSports,
                      text: aim.quickSportsPrompt,
                    },
                    {
                      label: aim.quickShopping,
                      text: aim.quickShoppingPrompt,
                    },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPromptExample(chip.text)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 📋 Standard Checkboxes */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {aim.cleanupRulesTitle}
                </div>

                {/* 1. Remove Duplicates & Keep Best Signal */}
                <label
                  onClick={() => toggleOption('removeDuplicates')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    options.removeDuplicates
                      ? 'bg-blue-500/10 border-cyan-500/50 shadow-md'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    backgroundColor: options.removeDuplicates ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={options.removeDuplicates}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      <Copy className="w-4 h-4 text-cyan-500" />
                      <span>{aim.removeDupesTitle}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {aim.removeDupesDesc}
                    </p>
                  </div>
                </label>

                {/* 2. Hide Encrypted / Scrambled Pay-TV */}
                <label
                  onClick={() => toggleOption('hideScrambled')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    options.hideScrambled
                      ? 'bg-blue-500/10 border-cyan-500/50 shadow-md'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    backgroundColor: options.hideScrambled ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={options.hideScrambled}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>{aim.hideScrambledTitle}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {aim.hideScrambledDesc}
                    </p>
                  </div>
                </label>

                {/* 3. Organize by Category */}
                <label
                  onClick={() => toggleOption('organizeCategories')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    options.organizeCategories
                      ? 'bg-blue-500/10 border-cyan-500/50 shadow-md'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    backgroundColor: options.organizeCategories ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={options.organizeCategories}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>{aim.organizeCategoriesTitle}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {aim.organizeCategoriesDesc}
                    </p>
                  </div>
                </label>

                {/* 4. Remove Inactive / Test / Placeholder Channels */}
                <label
                  onClick={() => toggleOption('removeJunk')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    options.removeJunk
                      ? 'bg-blue-500/10 border-cyan-500/50 shadow-md'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    backgroundColor: options.removeJunk ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={options.removeJunk}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      <Trash2 className="w-4 h-4 text-amber-400" />
                      <span>{aim.removeJunkTitle}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {aim.removeJunkDesc}
                    </p>
                  </div>
                </label>

                {/* 5. HD Priority & Radio grouping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label
                    onClick={() => toggleOption('prioritizeHD')}
                    className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <input
                      type="checkbox"
                      checked={options.prioritizeHD}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-cyan-500" />
                      <span>{aim.prioritizeHd}</span>
                    </div>
                  </label>

                  <label
                    onClick={() => toggleOption('groupRadioAtEnd')}
                    className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <input
                      type="checkbox"
                      checked={options.groupRadioAtEnd}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-amber-400" />
                      <span>{aim.groupRadioEnd}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 2: ANALYZING SPINNER ════════ */}
          {step === 'analyzing' && (
            <div className="py-16 text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto"></div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{progressMsg}</h3>
                <div className="w-64 h-2 bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 3: RESULTS PREVIEW & AI CONFIRMATION MESSAGE ════════ */}
          {step === 'review' && aiResults && (
            <div className="space-y-6 animate-fade-in">
              {/* 🤖 AI Text Confirmation Chat Box */}
              {aiResults.aiResponse && (
                <div
                  className="p-5 rounded-2xl border flex items-start gap-4 shadow-lg animate-fade-in"
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    borderColor: 'rgba(6, 182, 212, 0.35)',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-sm text-cyan-500 flex items-center gap-2">
                      <span>{aim.aiResponseTitle}</span>
                    </div>
                    <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
                      {aiResults.aiResponse}
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Stats Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center space-y-1">
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{aim.activeChannelsStat}</div>
                  <div className="text-lg font-bold text-cyan-500">{activeChannelsCount}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{aim.dupesResolvedStat}</div>
                  <div className="text-lg font-bold text-purple-400">{selectedHideDupeIds.size}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{aim.scrambledHiddenStat}</div>
                  <div className="text-lg font-bold text-rose-400">{selectedScrambledIds.size}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{aim.junkCleanedStat}</div>
                  <div className="text-lg font-bold text-amber-400">{selectedJunkIds.size}</div>
                </div>
              </div>

              {/* Categorization Preview */}
              {options.organizeCategories && categoriesOrder.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    {aim.newCategoryOrderTitle}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {categoriesOrder.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm"
                        style={{
                          backgroundColor: idx === 0 ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                          borderColor: idx === 0 ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-color)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{cat.categoryIcon || '📁'}</span>
                          <span className={idx === 0 ? 'text-blue-500 font-bold' : ''} style={{ color: idx === 0 ? undefined : 'var(--text-primary)' }}>
                            {idx + 1}. {cat.categoryName}
                          </span>
                        </div>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                          {cat.srvIds.length} {aim.channelsUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="p-5 border-t flex items-center justify-between gap-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
        >
          {step === 'options' ? (
            <>
              <button onClick={onClose} className="btn btn-secondary text-sm font-semibold cursor-pointer">
                {t.cancel}
              </button>

              <button
                onClick={handleStartAnalysis}
                className="btn btn-ai px-6 py-2.5 text-sm font-bold shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{aim.runOrganizeBtn}</span>
              </button>
            </>
          ) : step === 'review' ? (
            <>
              <button
                onClick={() => setStep('options')}
                className="btn btn-secondary text-sm font-semibold cursor-pointer"
              >
                {aim.changePresetBtn}
              </button>

              <button
                onClick={handleApply}
                className="btn btn-primary px-8 py-2.5 text-sm font-bold shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{aim.applyToChannelListBtn}</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
