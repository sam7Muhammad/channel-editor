import React, { useRef, useState } from 'react';
import { UploadCloud, ChevronRight, Route, ShieldCheck, Sparkles } from 'lucide-react';
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
  const t = translations[language];
  const [isDragging, setIsDragging] = useState(false);
  const [autoCleanDuplicates, setAutoCleanDuplicates] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleLoadSample = async () => {
    try {
      const res = await fetch('/sample_channel_list.zip');
      if (!res.ok) throw new Error('Failed to load sample file');
      const blob = await res.blob();
      onFileSelected(blob, 'Channel_list_T-KTS2UABC-2740.1.zip');
    } catch {
      alert('Could not load sample file. Please select your ZIP file manually.');
    }
  };

  return (
    <div
      className="w-full flex-1 flex flex-col animate-fade-in"
      style={{ padding: '0 clamp(24px, 4vw, 64px) 40px' }}
    >
      
      {/* ── Page Heading (Starts cleanly below topbar) ── */}
      <div className="mb-9 mt-2">
        <h1
          className="font-medium text-white mb-2 tracking-tight"
          style={{ fontSize: 'clamp(22px, 2.4vw, 30px)' }}
        >
          {language === 'ar' ? 'رتّب ونظّف قائمة قنواتك' : 'Clean up your channel list'}
        </h1>
        <p
          className="text-sm max-w-2xl leading-relaxed"
          style={{ color: '#8D96A8' }}
        >
          {language === 'ar'
            ? 'انقل قائمة القنوات من شاشتك عبر الفلاشة، رتّب واحذف الترددات المكررة، ثم أعدها للشاشة.'
            : 'Bring a channel list over from your TV, reorder and remove duplicates, then send it back.'}
        </p>
      </div>

      {/* ── 3 Steps Row (Spans full viewport width with fluid columns) ── */}
      <div className="steps-row">

        {/* ── Step 1: On your TV ── */}
        <div className="step-card">
          <span className="badge-tv">
            {language === 'ar' ? 'من الشاشة' : 'On your TV'}
          </span>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="step-num">1</span>
            <span className="font-medium text-[15px] text-[#F1F4F8]">
              {language === 'ar' ? 'تصدير القائمة' : 'Export list'}
            </span>
          </div>

          <p className="text-[13px] text-[#5B6472] mb-4 leading-relaxed">
            {language === 'ar' ? 'احفظ القائمة على الفلاشة من الإعدادات.' : 'Save it to USB from settings.'}
          </p>

          <div className="border-t border-[#232933] pt-3 mt-auto">
            <div className="flex items-center gap-1.5 text-xs text-[#8D96A8] mb-2 font-medium">
              <Route className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'مسار القائمة' : 'Menu path'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 font-mono text-[11.5px] leading-relaxed text-[#5B6472]">
              <span className="whitespace-nowrap">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="whitespace-nowrap">{language === 'ar' ? 'البث' : 'Broadcasting'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="whitespace-nowrap">{language === 'ar' ? 'إعدادات الخبراء' : 'Expert settings'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="whitespace-nowrap">{language === 'ar' ? 'نقل قائمة القنوات' : 'Transfer channel list'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="whitespace-nowrap">{language === 'ar' ? 'تصدير إلى USB' : 'Export to USB'}</span>
            </div>
          </div>
        </div>

        {/* ── Chevron 1 ── */}
        <div className="hidden min-[901px]:flex items-center justify-center text-[#3A414D]">
          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
        </div>

        {/* ── Step 2: Main In this app (Centered Dropzone) ── */}
        <div className="step-card main">
          <span className="badge-app">
            {language === 'ar' ? 'في هذا التطبيق' : 'In this app'}
          </span>

          <div className="flex items-center gap-2 mb-3">
            <span className="step-num on">2</span>
            <span className="font-medium text-[17px] text-[#F1F4F8]">
              {language === 'ar' ? 'الترتيب والتنظيم' : 'Organize'}
            </span>
          </div>

          {/* Centered Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`clean-dropzone flex flex-col items-center justify-center text-center ${
              isDragging ? 'border-[#4C82FB] bg-[rgba(76,130,251,0.08)]' : ''
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".zip"
              className="hidden"
            />

            <UploadCloud className="w-9 h-9 text-[#4C82FB] mb-3" />
            
            <p className="font-medium text-[15px] text-[#F1F4F8] mb-1">
              {language === 'ar' ? 'اسحب ملف Channel_list.zip هنا' : 'Drop channel_list.zip'}
            </p>
            
            <p className="text-xs text-[#5B6472] mb-3.5">
              {language === 'ar' ? 'أو' : 'or'}
            </p>
            
            <button
              type="button"
              className="clean-browse-btn"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {isLoading
                ? (language === 'ar' ? 'جاري الفتح...' : 'Reading files...')
                : (language === 'ar' ? 'استعراض الملفات' : 'Browse files')}
            </button>
          </div>

          {/* Auto-clean toggle & sample link */}
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-[#8D96A8] font-normal">
                {language === 'ar' ? 'تنظيف الترددات المكررة تلقائياً' : 'Auto-clean duplicates'}
              </span>
              <label className="clean-toggle">
                <input
                  type="checkbox"
                  checked={autoCleanDuplicates}
                  onChange={(e) => setAutoCleanDuplicates(e.target.checked)}
                  aria-label="Auto-clean duplicates"
                />
                <span className="track"></span>
                <span className="thumb"></span>
              </label>
            </div>

            {/* Quick Demo link */}
            <div className="pt-1.5 text-center">
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isLoading}
                className="text-[11.5px] font-semibold text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>{language === 'ar' ? 'أو جرّب بقائمة تجريبية (2,109 قناة)' : 'Or try with sample TV channel list (2,109 channels)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Chevron 2 ── */}
        <div className="hidden min-[901px]:flex items-center justify-center text-[#3A414D]">
          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
        </div>

        {/* ── Step 3: On your TV ── */}
        <div className="step-card">
          <span className="badge-tv">
            {language === 'ar' ? 'من الشاشة' : 'On your TV'}
          </span>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="step-num">3</span>
            <span className="font-medium text-[15px] text-[#F1F4F8]">
              {language === 'ar' ? 'استيراد القائمة' : 'Import list'}
            </span>
          </div>

          <p className="text-[13px] text-[#5B6472] mb-4 leading-relaxed">
            {language === 'ar' ? 'حمّل ملف الـ zip المحدث للشاشة.' : 'Load the updated zip back.'}
          </p>

          <div className="border-t border-[#232933] pt-3 mt-auto">
            <div className="flex items-center gap-1.5 text-xs text-[#8D96A8] mb-2 font-medium">
              <Route className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'مسار القائمة' : 'Menu path'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 font-mono text-[11.5px] leading-relaxed text-[#5B6472]">
              <span className="whitespace-nowrap">{language === 'ar' ? 'قائمة الإعدادات' : 'Settings menu'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="whitespace-nowrap">{language === 'ar' ? 'استيراد من USB' : 'Import from USB'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="mt-7 flex items-center gap-2 text-xs text-[#5B6472]">
        <ShieldCheck className="w-4 h-4" />
        <span>
          {language === 'ar'
            ? 'تتم المعالجة بالكامل داخل متصفحك محلياً. لا يتم رفع أي بيانات.'
            : 'Processed on your device. Nothing is uploaded.'}
        </span>
      </div>

    </div>
  );
};
