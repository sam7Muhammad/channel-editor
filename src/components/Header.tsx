import React, { useRef } from 'react';
import { Tv, SlidersHorizontal, Download, Star, Settings, RotateCcw, Moon, Sun, Languages, FolderOpen, HelpCircle } from 'lucide-react';
import { MetadataInfo } from '../types/channel';
import { translations } from '../utils/i18n';

interface HeaderProps {
  channelCount: number;
  metadata?: MetadataInfo;
  filename?: string;
  canUndo: boolean;
  onUndo: () => void;
  onGoHome?: () => void;
  onFileSelected?: (file: File, filename: string) => void;
  onOpenAiOrganize: () => void;
  onOpenFavorites: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  channelCount,
  metadata,
  filename,
  canUndo,
  onUndo,
  onGoHome,
  onFileSelected,
  onOpenAiOrganize,
  onOpenFavorites,
  onOpenSettings,
  onExport,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelected) {
      onFileSelected(file, file.name);
    }
    // Reset so same file can be chosen again
    if (e.target) e.target.value = '';
  };

  return (
    <header className="px-4 py-3 border-b w-full" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-page)' }}>
      <div className="w-full flex items-center justify-between">
      
      {/* Hidden File Input for Direct Browse */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".zip"
        className="hidden"
      />

      {/* ── Brand (Left) - Clickable to go home ── */}
      <button
        type="button"
        onClick={onGoHome}
        className="flex items-center gap-3.5 group text-left rtl:text-right cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
        title={t.returnHomeTooltip}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all shadow-sm">
          <Tv className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-base sm:text-lg tracking-tight group-hover:text-cyan-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {t.appTitle}
          </span>

          {filename && (
            <div
              className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-xl border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              <span className="font-bold truncate max-w-[220px]" style={{ color: 'var(--text-primary)' }}>
                {filename}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {channelCount} {language === 'ar' ? 'قناة' : 'channels'}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* ── Actions & Top Icons (Right) ── */}
      <div className="flex items-center gap-3">

        {/* When channels are loaded: Actions */}
        {channelCount > 0 && (
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={handleBrowseClick}
              className="btn btn-secondary btn-sm gap-2 font-semibold cursor-pointer"
              title={t.loadNewFile}
            >
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">{t.loadNewFile}</span>
            </button>

            {canUndo && (
              <button onClick={onUndo} title={t.undo} className="btn btn-secondary btn-sm cursor-pointer">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{t.undo}</span>
              </button>
            )}

            <button onClick={onOpenAiOrganize} className="btn btn-primary btn-sm font-bold shadow-sm flex items-center gap-1.5 cursor-pointer">
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t.aiOrganize}</span>
            </button>

            <button onClick={onOpenFavorites} className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="hidden md:inline">{t.favorites}</span>
            </button>

            <button onClick={onExport} className="btn btn-primary btn-sm font-bold flex items-center gap-1.5 cursor-pointer">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t.exportToUsb}</span>
            </button>
          </div>
        )}

        {/* Top Icons: Help, Settings, Theme Toggle, Language */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => alert(t.helpAlert)}
            className="icon-btn p-2"
            title={t.settingsModal.title}
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenSettings}
            className="icon-btn p-2"
            title="Settings & API Key"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleTheme}
            className="icon-btn p-2"
            title="Toggle theme (Dark / Light)"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
          </button>

          <button
            onClick={onToggleLanguage}
            className="icon-btn p-2"
            title="Change language (English / العربية)"
            aria-label="Language switch"
          >
            <Languages className="w-5 h-5" />
          </button>
        </div>

      </div>

    </div>
    </header>
  );
};
