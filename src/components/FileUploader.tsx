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
      className="w-full flex-1 flex flex-col justify-start animate-fade-in"
      style={{ padding: '24px clamp(24px, 4vw, 64px) 48px' }}
    >
      
      {/* ── Page Heading ── */}
      <div className="mb-10">
        <h1
          className="font-semibold text-white mb-3 tracking-tight"
          style={{ fontSize: 'clamp(26px, 2.8vw, 36px)', lineHeight: 1.2 }}
        >
          {language === 'ar' ? 'رتّب ونظّف قائمة قنواتك' : 'Clean up your channel list'}
        </h1>
        <p
          className="leading-relaxed max-w-3xl"
          style={{ fontSize: 'clamp(14px, 1.2vw, 17px)', color: '#8D96A8' }}
        >
          {language === 'ar'
            ? 'انقل قائمة القنوات من شاشتك عبر الفلاشة، رتّب واحذف الترددات المكررة، ثم أعدها للشاشة.'
            : 'Bring a channel list over from your TV, reorder and remove duplicates, then send it back.'}
        </p>
      </div>

      {/* ── 3 Steps Row ── */}
      <div className="steps-row items-stretch">

        {/* ── Step 1: On your TV ── */}
        <div className="step-card justify-between p-6 sm:p-8">
          <div>
            <span className="badge-tv text-xs font-semibold px-3 py-1 mb-5">
              {language === 'ar' ? 'من الشاشة' : 'On your TV'}
            </span>

            <div className="flex items-center gap-3 mb-2.5">
              <span className="step-num w-7 h-7 text-xs font-bold">1</span>
              <span className="font-semibold text-base sm:text-lg text-[#F1F4F8]">
                {language === 'ar' ? 'تصدير القائمة' : 'Export list'}
              </span>
            </div>

            <p className="text-sm text-[#8D96A8] leading-relaxed mb-6">
              {language === 'ar' ? 'احفظ القائمة على الفلاشة من إعدادات الشاشة.' : 'Save it to USB from your TV settings.'}
            </p>
          </div>

          <div className="border-t border-[#232933] pt-4 mt-auto">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8D96A8] mb-3">
              <Route className="w-4 h-4 text-cyan-400" />
              <span>{language === 'ar' ? 'مسار القائمة في الشاشة' : 'Menu path on TV'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs leading-relaxed text-[#5B6472]">
              <span className="px-2 py-1 rounded bg-[#171D26] text-[#BAC4D6] font-medium whitespace-nowrap">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="px-2 py-1 rounded bg-[#171D26] text-[#BAC4D6] font-medium whitespace-nowrap">{language === 'ar' ? 'البث' : 'Broadcasting'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="px-2 py-1 rounded bg-[#171D26] text-[#BAC4D6] font-medium whitespace-nowrap">{language === 'ar' ? 'إعدادات الخبراء' : 'Expert settings'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="px-2 py-1 rounded bg-[#171D26] text-[#BAC4D6] font-medium whitespace-nowrap">{language === 'ar' ? 'نقل القنوات' : 'Transfer channel list'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="px-2 py-1 rounded bg-[#171D26] text-cyan-300 font-semibold whitespace-nowrap">{language === 'ar' ? 'تصدير إلى USB' : 'Export to USB'}</span>
            </div>
          </div>
        </div>

        {/* ── Chevron 1 ── */}
        <div className="hidden min-[901px]:flex items-center justify-center text-[#3A414D]">
          <ChevronRight className="w-6 h-6 rtl:rotate-180" />
        </div>

        {/* ── Step 2: Main In this app (Spacious Dropzone) ── */}
        <div className="step-card main justify-between p-6 sm:p-9 shadow-2xl">
          <div>
            <span className="badge-app text-xs font-semibold px-3 py-1 mb-5">
              {language === 'ar' ? 'في هذا التطبيق' : 'In this app'}
            </span>

            <div className="flex items-center gap-3 mb-4">
              <span className="step-num on w-7 h-7 text-xs font-bold">2</span>
              <span className="font-semibold text-lg sm:text-xl text-[#F1F4F8]">
                {language === 'ar' ? 'الترتيب والتنظيم' : 'Organize'}
              </span>
            </div>

            {/* Spacious Centered Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`clean-dropzone flex flex-col items-center justify-center text-center p-8 sm:p-12 mb-6 ${
                isDragging ? 'border-[#4C82FB] bg-[rgba(76,130,251,0.12)] scale-[1.01]' : ''
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".zip"
                className="hidden"
              />

              <UploadCloud className="w-12 h-12 text-[#4C82FB] mb-3.5" />
              
              <p className="font-semibold text-base sm:text-lg text-[#F1F4F8] mb-1">
                {language === 'ar' ? 'اسحب ملف Channel_list.zip هنا' : 'Drop channel_list.zip here'}
              </p>
              
              <p className="text-xs sm:text-sm text-[#8D96A8] mb-4">
                {language === 'ar' ? 'أو اختر الملف من الفلاشة' : 'or click to browse from USB drive'}
              </p>
              
              <button
                type="button"
                className="clean-browse-btn px-6 py-2.5 text-sm font-semibold rounded-xl hover:bg-[#1B212B] transition-all"
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                {isLoading
                  ? (language === 'ar' ? 'جاري فتح الملف...' : 'Reading files...')
                  : (language === 'ar' ? 'استعراض الملفات' : 'Browse files')}
              </button>
            </div>
          </div>

          {/* Auto-clean toggle & sample link */}
          <div className="flex flex-col gap-3 mt-auto border-t border-[#232933] pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm text-[#BAC4D6] font-medium">
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
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isLoading}
                className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'جرّب بمثال حقيقي (2,109 قناة)' : 'Or try with a real demo (2,109 channels)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Chevron 2 ── */}
        <div className="hidden min-[901px]:flex items-center justify-center text-[#3A414D]">
          <ChevronRight className="w-6 h-6 rtl:rotate-180" />
        </div>

        {/* ── Step 3: On your TV ── */}
        <div className="step-card justify-between p-6 sm:p-8">
          <div>
            <span className="badge-tv text-xs font-semibold px-3 py-1 mb-5">
              {language === 'ar' ? 'من الشاشة' : 'On your TV'}
            </span>

            <div className="flex items-center gap-3 mb-2.5">
              <span className="step-num w-7 h-7 text-xs font-bold">3</span>
              <span className="font-semibold text-base sm:text-lg text-[#F1F4F8]">
                {language === 'ar' ? 'استيراد القائمة' : 'Import list'}
              </span>
            </div>

            <p className="text-sm text-[#8D96A8] leading-relaxed mb-6">
              {language === 'ar' ? 'حمّل ملف الـ zip المحدث للشاشة.' : 'Load the updated zip back to your TV.'}
            </p>
          </div>

          <div className="border-t border-[#232933] pt-4 mt-auto">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8D96A8] mb-3">
              <Route className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'مسار الاستيراد في الشاشة' : 'Menu path on TV'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs leading-relaxed text-[#5B6472]">
              <span className="px-2 py-1 rounded bg-[#171D26] text-[#BAC4D6] font-medium whitespace-nowrap">{language === 'ar' ? 'قائمة الإعدادات' : 'Settings menu'}</span>
              <span className="text-[#3A414D]">›</span>
              <span className="px-2 py-1 rounded bg-[#171D26] text-emerald-300 font-semibold whitespace-nowrap">{language === 'ar' ? 'استيراد من USB' : 'Import from USB'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="mt-10 flex items-center gap-2 text-xs sm:text-sm text-[#8D96A8]">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>
          {language === 'ar'
            ? 'تتم المعالجة بالكامل داخل متصفحك محلياً. لا يتم رفع أي بيانات إلى أي خادم.'
            : 'Processed on your device. Nothing is uploaded to any server.'}
        </span>
      </div>

    </div>
  );
};
