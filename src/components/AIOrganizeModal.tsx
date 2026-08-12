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
} from 'lucide-react';
import { Channel, AIOrganizeResult } from '../types/channel';
import { AIOrganizeService } from '../services/aiOrganizeService';

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
  // Wizard Step: 'options' -> 'analyzing' -> 'review'
  const [step, setStep] = useState<'options' | 'analyzing' | 'review'>('options');

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
  const [categoriesOrder, setCategoriesOrder] = useState<AIOrganizeResult['categories']>([]);

  if (!isOpen) return null;

  const toggleOption = (key: keyof AIOrganizeOptions) => {
    if (typeof options[key] === 'boolean') {
      setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const setPromptExample = (text: string) => {
    setOptions((prev) => ({
      ...prev,
      customPrompt: prev.customPrompt ? `${prev.customPrompt}. ${text}` : text,
    }));
  };

  const handleStartAnalysis = async () => {
    if (options.engineMode === 'ai' && (!apiKey || apiKey.trim() === '')) {
      alert(language === 'ar' ? 'الرجاء إضافة مفتاح API الخاص بـ Gemini في الإعدادات أولاً لاستخدام الذكاء الاصطناعي.' : 'Please add your Google Gemini API key in Settings first to use the AI engine.');
      return;
    }

    setStep('analyzing');
    setProgressMsg(language === 'ar' ? 'جاري تحليل القنوات والترددات...' : 'Analyzing channel frequencies and telemetry...');
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

      // Run AI / Rule-based organizer with custom prompt
      const results = await AIOrganizeService.organizeWithOptions(
        channels,
        options,
        apiKey,
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPercent(pct);
        }
      );

      setAiResults(results);

      // Junk / Placeholders
      if (options.removeJunk) {
        setSelectedJunkIds(new Set(results.junkSrvIds));
      } else {
        setSelectedJunkIds(new Set());
      }

      // Frequency Duplicates
      if (options.removeDuplicates) {
        const hideSet = new Set<string>();
        results.duplicateGroups.forEach((g) => {
          g.hideSrvIds.forEach((id) => hideSet.add(id));
        });
        setSelectedHideDupeIds(hideSet);
      } else {
        setSelectedHideDupeIds(new Set());
      }

      // Categories
      if (options.organizeCategories) {
        setCategoriesOrder(results.categories);
      } else {
        setCategoriesOrder([]);
      }

      setStep('review');
    } catch (err: any) {
      alert(`Organization error: ${err.message || err}`);
      setStep('options');
    }
  };

  const handleApply = () => {
    if (!aiResults) return;

    // Combine all hidden IDs (junk + duplicate frequencies + scrambled)
    const combinedJunk = Array.from(new Set([...selectedJunkIds, ...selectedScrambledIds]));
    const combinedDupeHide = Array.from(selectedHideDupeIds);

    const orderedCategories = categoriesOrder.map((c) => ({
      categoryName: c.categoryName,
      srvIds: c.srvIds.filter(
        (id) => !selectedJunkIds.has(id) && !selectedHideDupeIds.has(id) && !selectedScrambledIds.has(id)
      ),
    }));

    onApplyAIResults(combinedJunk, combinedDupeHide, orderedCategories);
    onClose();
  };

  const totalExcluded = selectedJunkIds.size + selectedHideDupeIds.size + selectedScrambledIds.size;
  const activeChannelsCount = Math.max(0, channels.length - totalExcluded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl glass rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[92vh]"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
      >
        {/* Modal Header */}
        <div
          className="p-6 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-bold tracking-tight">
                  {language === 'ar' ? 'المنظم الذكي للقنوات (AI Organizer)' : 'AI Smart Channel Organizer'}
                </h2>
                {apiKey && apiKey.trim() !== '' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    Gemini API Active
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1 shadow-sm">
                    <Zap className="w-3 h-3" />
                    Local Fast Engine
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'اكتب طلبك الخاص للذكاء الاصطناعي وحدد خيارات التنظيم'
                  : 'Chat with AI or customize optimization rules for your TV channels'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* ════════ STEP 1: OPTIONS & CUSTOM PROMPT ════════ */}
          {step === 'options' && (
            <div className="space-y-6">

              {/* 🧠 Engine Selection Toggle */}
              <div className="p-1 rounded-2xl bg-slate-900/50 border border-slate-800 flex shadow-inner">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, engineMode: 'ai' })}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    options.engineMode === 'ai'
                      ? 'bg-purple-600 shadow-lg text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${options.engineMode === 'ai' ? 'text-purple-200' : ''}`} />
                  {language === 'ar' ? 'Google Gemini AI' : 'Google Gemini AI'}
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, engineMode: 'local' })}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    options.engineMode === 'local'
                      ? 'bg-cyan-600 shadow-lg text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${options.engineMode === 'local' ? 'text-cyan-200' : ''}`} />
                  {language === 'ar' ? 'محرك محلي سريع' : 'Local Fast Engine'}
                </button>
              </div>

              {/* 💬 Custom AI Prompt Input Area (With Generous Padding & Comfortable Sizing) */}
              <div
                className="p-6 rounded-2xl border space-y-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sm sm:text-base flex items-center gap-2 text-cyan-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>{language === 'ar' ? 'اكتب تعليماتك للذكاء الاصطناعي (Custom Prompt):' : 'Chat / Custom Instructions for AI:'}</span>
                  </label>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/25">
                    Prompt
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={options.customPrompt}
                    onChange={(e) => setOptions({ ...options, customPrompt: e.target.value })}
                    rows={4}
                    placeholder={
                      language === 'ar'
                        ? 'مثال: أنشئ فئة English Movies واجعلها أولاً وضمنها قنوات mbc2 و mix، وأخفِ قنوات التسوق والإعلانات...'
                        : 'e.g. create English movies category and make it first and put mbc2 and mix, and hide all shopping channels...'
                    }
                    className="w-full rounded-2xl p-5 text-sm sm:text-base font-medium focus:outline-none transition-all leading-relaxed shadow-inner"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      boxSizing: 'border-box',
                      minHeight: '110px',
                    }}
                  />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-400">
                    {language === 'ar' ? 'أمثلة سريعة:' : 'Quick Prompts:'}
                  </span>
                  {[
                    { label: language === 'ar' ? '🎬 أفلام إنجليزية أولاً' : '🎬 English Movies First', text: language === 'ar' ? 'انشئ فئة English movies واجعلها أولاً وضمنها mbc2 و mix' : 'create English movies category and make it first and put mbc2 and mix' },
                    { label: language === 'ar' ? '👶 الأطفال والعائلة' : '👶 Kids & Family First', text: language === 'ar' ? 'اجعل قنوات الأطفال والكرتون في البداية بعد القرآن' : 'Put kids & cartoon channels right after religious channels' },
                    { label: language === 'ar' ? '⚽ تقديم قنوات الرياضة' : '⚽ Sports Focus', text: language === 'ar' ? 'ضع قنوات الرياضة (beIN, Alkass, OnTime) في المراكز العشرة الأولى' : 'Group all sports channels in the top 10' },
                    { label: language === 'ar' ? '🚫 إخفاء قنوات التسوق' : '🚫 Hide Shopping Feeds', text: language === 'ar' ? 'أخفِ جميع قنوات الإعلانات والتسوق التجارية' : 'Hide all commercial and shopping channels' },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPromptExample(chip.text)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 📋 Standard Checkboxes */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {language === 'ar' ? 'خيارات التنظيم والتنظيف:' : 'Optimization Rules:'}
                </div>

                {/* 1. Remove Duplicates & Keep Best Signal */}
                <label
                  onClick={() => toggleOption('removeDuplicates')}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    options.removeDuplicates
                      ? 'bg-blue-500/10 border-cyan-500/50 shadow-md'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ backgroundColor: options.removeDuplicates ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)' }}
                >
                  <input
                    type="checkbox"
                    checked={options.removeDuplicates}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span>{language === 'ar' ? 'إزالة الترددات المكررة (إبقاء أفضل جودة إشارة)' : 'Remove Duplicate Frequencies (Keep Best Signal Quality)'}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {language === 'ar'
                        ? 'يفحص القنوات المكررة عبر الترددات، ويختار التردد الأعلى جودة والأقل أخطاء تلقائياً.'
                        : 'Scans channels across all transponders, compares signal telemetry, and keeps only the highest quality copy.'}
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
                  style={{ backgroundColor: options.hideScrambled ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)' }}
                >
                  <input
                    type="checkbox"
                    checked={options.hideScrambled}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>{language === 'ar' ? 'إخفاء القنوات المشفرة والمدفوعة (Scrambled / Pay-TV)' : 'Hide Scrambled & Pay-TV Channels'}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {language === 'ar'
                        ? 'إخفاء القنوات المغلقة باشتراك أو تشفير حتى تبقى القنوات المفتوحة (FTA) فقط.'
                        : 'Automatically hides encrypted channels requiring a subscription or card module.'}
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
                  style={{ backgroundColor: options.organizeCategories ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)' }}
                >
                  <input
                    type="checkbox"
                    checked={options.organizeCategories}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>{language === 'ar' ? 'ترتيب القنوات حسب الفئات والموضوع' : 'Organize Channels by Thematic Categories'}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {language === 'ar'
                        ? 'ترتيب منطقي: القرآن ← الأطفال ← الأخبار ← السينما والأفلام ← المسلسلات ← الرياضة ← الوثائقيات.'
                        : 'Orders channels into logical blocks: Religious/Quran → Kids → News → Cinema → Drama → Sports → Documentaries.'}
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
                  style={{ backgroundColor: options.removeJunk ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)' }}
                >
                  <input
                    type="checkbox"
                    checked={options.removeJunk}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                      <Trash2 className="w-4 h-4 text-amber-400" />
                      <span>{language === 'ar' ? 'تنظيف القنوات التجريبية والمغلقة (Test Feeds & Inactive)' : 'Remove Inactive & Placeholder Channels'}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {language === 'ar'
                        ? 'حذف قنوات الاختبار ("Test", "Service ####", "Ch-####") وقنوات الإشارة الصفرية.'
                        : 'Hides dead placeholder feeds, nameless test channels, and 0% signal services.'}
                    </p>
                  </div>
                </label>

                {/* 5. HD Priority & Radio grouping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label
                    onClick={() => toggleOption('prioritizeHD')}
                    className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                  >
                    <input
                      type="checkbox"
                      checked={options.prioritizeHD}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-cyan-400" />
                      <span>{language === 'ar' ? 'تقديم قنوات HD على SD' : 'Prioritize HD over SD'}</span>
                    </div>
                  </label>

                  <label
                    onClick={() => toggleOption('groupRadioAtEnd')}
                    className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                  >
                    <input
                      type="checkbox"
                      checked={options.groupRadioAtEnd}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-amber-400" />
                      <span>{language === 'ar' ? 'تجميع إذاعات الراديو في النهاية' : 'Group Radio at the End'}</span>
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
                <h3 className="text-lg font-bold text-slate-200">{progressMsg}</h3>
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
                    <div className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                      <span>{language === 'ar' ? 'رد الذكاء الاصطناعي (AI Response):' : 'AI Organizer Confirmation:'}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {aiResults.aiResponse}
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Stats Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center space-y-1">
                  <div className="text-xs text-slate-400">{language === 'ar' ? 'القنوات النشطة' : 'Active Channels'}</div>
                  <div className="text-lg font-bold text-cyan-400">{activeChannelsCount}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                  <div className="text-xs text-slate-400">{language === 'ar' ? 'ترددات مكررة تم حلها' : 'Duplicates Resolved'}</div>
                  <div className="text-lg font-bold text-purple-400">{selectedHideDupeIds.size}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                  <div className="text-xs text-slate-400">{language === 'ar' ? 'قنوات مشفرة مخفية' : 'Scrambled Hidden'}</div>
                  <div className="text-lg font-bold text-rose-400">{selectedScrambledIds.size}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                  <div className="text-xs text-slate-400">{language === 'ar' ? 'قنوات تجريبية تم تنظيفها' : 'Test Feeds Cleaned'}</div>
                  <div className="text-lg font-bold text-amber-400">{selectedJunkIds.size}</div>
                </div>
              </div>

              {/* Categorization Preview */}
              {options.organizeCategories && categoriesOrder.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {language === 'ar' ? 'ترتيب المجموعات الجديد:' : 'New Category Order:'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {categoriesOrder.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm"
                        style={{
                          backgroundColor: idx === 0 ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-tertiary)',
                          borderColor: idx === 0 ? 'rgba(59, 130, 246, 0.5)' : 'var(--border-color)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{cat.categoryIcon || '📁'}</span>
                          <span className={idx === 0 ? 'text-cyan-300 font-bold' : ''}>
                            {idx + 1}. {cat.categoryName}
                          </span>
                        </div>
                        <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                          {cat.srvIds.length} ch
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
              <button
                onClick={onClose}
                className="btn btn-secondary text-sm font-semibold"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleStartAnalysis}
                className="btn btn-ai px-6 py-2.5 text-sm font-bold shadow-xl flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{language === 'ar' ? 'ابدأ التنظيم بالذكاء الاصطناعي' : 'Run Smart Organization'}</span>
              </button>
            </>
          ) : step === 'review' ? (
            <>
              <button
                onClick={() => setStep('options')}
                className="btn btn-secondary text-sm font-semibold"
              >
                {language === 'ar' ? '← تعديل الأوامر' : '← Change Prompt / Rules'}
              </button>

              <button
                onClick={handleApply}
                className="btn btn-primary px-8 py-2.5 text-sm font-bold shadow-xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{language === 'ar' ? 'تطبيق على قائمة القنوات' : 'Apply to Channel List'}</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
