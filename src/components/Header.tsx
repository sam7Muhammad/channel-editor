import React from 'react';
import { Tv, Sparkles, Download, Star, Settings, RotateCcw, Moon, Sun, Languages, FolderOpen, HelpCircle } from 'lucide-react';
import { MetadataInfo } from '../types/channel';
import { translations } from '../utils/i18n';

interface HeaderProps {
  channelCount: number;
  metadata?: MetadataInfo;
  filename?: string;
  canUndo: boolean;
  onUndo: () => void;
  onCloseFile?: () => void;
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
  onCloseFile,
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

  return (
    <header className="px-6 sm:px-12 lg:px-20 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-page)' }}>
      
      {/* ── Brand (Left) ── */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500">
          <Tv className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-sm sm:text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Channel editor
          </span>

          {filename && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono pl-2 ml-2 border-l" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              <span className="text-cyan-400 font-medium truncate max-w-[220px]">{filename}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{channelCount} channels</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Actions & Top Icons (Right) ── */}
      <div className="flex items-center gap-3">

        {/* When channels are loaded: Actions */}
        {channelCount > 0 && (
          <div className="flex items-center gap-2 mr-2">
            {onCloseFile && (
              <button
                onClick={onCloseFile}
                className="btn btn-secondary btn-sm gap-1.5"
                title="Load another channel list"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Load New File</span>
              </button>
            )}

            {canUndo && (
              <button onClick={onUndo} title={t.undo} className="btn btn-secondary btn-sm">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{t.undo}</span>
              </button>
            )}

            <button onClick={onOpenAiOrganize} className="btn btn-ai btn-sm font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.aiOrganize}</span>
            </button>

            <button onClick={onOpenFavorites} className="btn btn-secondary btn-sm">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="hidden md:inline">{t.favorites}</span>
            </button>

            <button onClick={onExport} className="btn btn-primary btn-sm font-bold">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.exportToUsb}</span>
            </button>
          </div>
        )}

        {/* Top Icons: Help, Settings, Theme Toggle, Language */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => alert(language === 'ar' ? 'قم بتصدير ملف القنوات من الشاشة عبر الفلاشة، ارفعه هنا لترتيبه، ثم أعد تصديره واستيراده على التلفزيون.' : 'Export your channel list from your TV via USB, upload it here to reorder and clean duplicates, then save it back to USB.')}
            className="icon-btn"
            title="Help & Guide"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="icon-btn"
            title="Settings & API Key"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            className="icon-btn"
            title="Toggle theme (Dark / Light)"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-500" />
            )}
          </button>

          <button
            onClick={onToggleLanguage}
            className="icon-btn"
            title="Change language (English / العربية)"
            aria-label="Language switch"
          >
            <Languages className="w-4 h-4" />
          </button>
        </div>

      </div>

    </header>
  );
};
