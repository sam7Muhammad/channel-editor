import React, { useState } from 'react';
import { Settings, X, Key, Moon, Sun, Languages } from 'lucide-react';
import { translations } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
}) => {
  const t = translations[language];
  const st = t.settingsModal;
  const [keyInput, setKeyInput] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-md border border-slate-700/80 shadow-2xl p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {st.title}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gemini API Key */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            <Key className="w-3.5 h-3.5 text-purple-400" />
            <span>{st.apiSectionTitle}</span>
          </label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={st.apiKeyPlaceholder}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            style={{ color: 'var(--text-primary)' }}
          />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {st.apiSectionDesc}
          </p>
        </div>

        {/* Theme & Language Toggles */}
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>{st.langTitle}</span>
            </span>
            <button
              onClick={onToggleLanguage}
              className="btn btn-secondary btn-sm text-xs font-bold"
            >
              {language === 'en' ? '🇺🇸 English' : '🇸🇦 العربية'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{st.themeTitle}</span>
            </span>
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary btn-sm text-xs"
            >
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn btn-secondary text-xs">
            {t.cancel}
          </button>
          <button onClick={handleSave} className="btn btn-primary text-xs font-bold">
            {st.saveKey}
          </button>
        </div>
      </div>
    </div>
  );
};
