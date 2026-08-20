import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, ChevronRight, ChevronDown, Route, ShieldCheck } from 'lucide-react';
import { translations } from '../utils/i18n';

interface FileUploaderProps {
  onFileSelected: (file: File | Blob, filename: string) => void;
  isLoading: boolean;
  language: 'en' | 'ar';
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  isLoading,
  language,
}) => {
  const t = translations[language].uploader;
  const [isDragging, setIsDragging] = useState(false);
  const [autoCleanDuplicates, setAutoCleanDuplicates] = useState(true);
  const [isExportPathExpanded, setIsExportPathExpanded] = useState(true);
  const [isImportPathExpanded, setIsImportPathExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 960;
    const hasVisited = localStorage.getItem('channelEditor.hasVisited');
    const exportState = localStorage.getItem('channelEditor.menuPath.export');
    const importState = localStorage.getItem('channelEditor.menuPath.import');

    if (!hasVisited) {
      localStorage.setItem('channelEditor.hasVisited', 'true');
    }

    if (isMobile) {
      setIsExportPathExpanded(false);
      setIsImportPathExpanded(false);
    } else {
      if (!hasVisited) {
        setIsExportPathExpanded(true);
        setIsImportPathExpanded(true);
      } else {
        setIsExportPathExpanded(exportState === 'expanded');
        setIsImportPathExpanded(importState === 'expanded');
      }
    }
  }, []);

  const toggleExportPath = () => {
    const next = !isExportPathExpanded;
    setIsExportPathExpanded(next);
    localStorage.setItem('channelEditor.menuPath.export', next ? 'expanded' : 'collapsed');
    localStorage.setItem('channelEditor.hasVisited', 'true');
  };

  const toggleImportPath = () => {
    const next = !isImportPathExpanded;
    setIsImportPathExpanded(next);
    localStorage.setItem('channelEditor.menuPath.import', next ? 'expanded' : 'collapsed');
    localStorage.setItem('channelEditor.hasVisited', 'true');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      onFileSelected(file, file.name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onFileSelected(file, file.name);
    }
  };

  return (
    <div
      className="w-full flex-1 flex flex-col justify-start animate-fade-in"
      style={{ padding: '20px clamp(16px, 4vw, 48px) 48px' }}
    >
      
      {/* ── Page Heading ── */}
      <div className="mb-6 mt-1">
        <h1
          className="font-bold mb-2 tracking-tight"
          style={{ fontSize: 'clamp(24px, 2.6vw, 34px)', lineHeight: 1.25, color: 'var(--text-primary)' }}
        >
          {t.title}
        </h1>
        <p
          className="leading-relaxed max-w-3xl font-medium"
          style={{ fontSize: 'clamp(14px, 1.15vw, 16px)', color: 'var(--text-secondary)' }}
        >
          {t.subtitle}
        </p>
      </div>

      {/* ── 3 Steps Row ── */}
      <div className="steps-row items-stretch">

        {/* ── Step 1: On your TV ── */}
        <div className="step-card flex flex-col justify-start space-y-6">
          
          {/* Header & Description */}
          <div className="space-y-3">
            <span className="badge-tv text-xs font-semibold px-3 py-1">
              {t.badgeTv}
            </span>

            <div className="flex items-center gap-3 pt-1">
              <span className="step-num w-7 h-7 text-xs font-bold">1</span>
              <span className="font-bold text-lg sm:text-xl" style={{ color: 'var(--text-primary)' }}>
                {t.step1Title}
              </span>
            </div>

            <p className="text-sm leading-relaxed pt-1" style={{ color: 'var(--text-secondary)' }}>
              {t.step1Desc}
            </p>
          </div>

          {/* Dedicated Instruction Box */}
          <div className="step-path-box shadow-sm">
            <button 
              className="flex items-center gap-2 text-sm font-semibold w-full text-left rtl:text-right focus:outline-none rounded cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onClick={toggleExportPath}
              aria-expanded={isExportPathExpanded}
              aria-controls="export-path-list"
            >
              <Route className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className="flex-1">{t.howToGetThere}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isExportPathExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Step Pills */}
            <div 
              id="export-path-list"
              className={`overflow-hidden transition-all duration-300 ${isExportPathExpanded ? 'max-h-64 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              {t.step1Steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`step-path-item ${idx === 4 ? 'active' : ''}`}
                >
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chevron 1 ── */}
        <div className="hidden min-[961px]:flex items-center justify-center px-2 my-auto" style={{ color: 'var(--border-hover)' }}>
          <ChevronRight className="w-6 h-6 rtl:rotate-180" />
        </div>

        {/* ── Step 2: Main In this app ── */}
        <div className="step-card main flex flex-col">

          {/* Header */}
          <div className="mb-3">
            <span className="badge-app text-xs font-semibold px-3 py-1">
              {t.badgeApp}
            </span>
            <div className="flex items-center gap-3 pt-2">
              <span className="step-num on w-7 h-7 text-xs font-bold">2</span>
              <span className="font-bold text-lg sm:text-xl" style={{ color: 'var(--text-primary)' }}>
                {t.step2Title}
              </span>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`clean-dropzone grow pb-6 cursor-pointer transition-all ${
              isDragging ? 'border-[#4C82FB] bg-blue-500/10 scale-[1.01]' : ''
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".zip"
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1 mb-4">
              <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                {t.dropTitle}
              </p>
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t.dropSubtitle}
              </p>
            </div>

            <button
              type="button"
              className="clean-browse-btn"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {isLoading ? t.readingFiles : t.browseBtn}
            </button>
          </div>

          {/* Auto-clean toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t.autoCleanToggle}
              </span>
              <label className="clean-toggle">
                <input
                  type="checkbox"
                  checked={autoCleanDuplicates}
                  onChange={(e) => setAutoCleanDuplicates(e.target.checked)}
                  aria-label={t.autoCleanToggle}
                />
                <span className="track"></span>
                <span className="thumb"></span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Chevron 2 ── */}
        <div className="hidden min-[961px]:flex items-center justify-center px-2 my-auto" style={{ color: 'var(--border-hover)' }}>
          <ChevronRight className="w-6 h-6 rtl:rotate-180" />
        </div>

        {/* ── Step 3: On your TV ── */}
        <div className="step-card flex flex-col justify-start space-y-6">
          
          {/* Header & Description */}
          <div className="space-y-3">
            <span className="badge-tv text-xs font-semibold px-3 py-1">
              {t.badgeTv}
            </span>

            <div className="flex items-center gap-3 pt-1">
              <span className="step-num w-7 h-7 text-xs font-bold">3</span>
              <span className="font-bold text-lg sm:text-xl" style={{ color: 'var(--text-primary)' }}>
                {t.step3Title}
              </span>
            </div>

            <p className="text-sm leading-relaxed pt-1" style={{ color: 'var(--text-secondary)' }}>
              {t.step3Desc}
            </p>
          </div>

          {/* Dedicated Instruction Box */}
          <div className="step-path-box shadow-sm">
            <button 
              className="flex items-center gap-2 text-sm font-semibold w-full text-left rtl:text-right focus:outline-none rounded cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onClick={toggleImportPath}
              aria-expanded={isImportPathExpanded}
              aria-controls="import-path-list"
            >
              <Route className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="flex-1">{t.howToGetThere}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isImportPathExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Step Pills */}
            <div 
              id="import-path-list"
              className={`overflow-hidden transition-all duration-300 ${isImportPathExpanded ? 'max-h-64 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              {t.step3Steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`step-path-item ${idx === 4 ? 'active-import' : ''}`}
                >
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="mt-6 flex items-center gap-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>{t.secureBadge}</span>
      </div>

    </div>
  );
};
