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
      style={{ padding: '16px clamp(24px, 4vw, 64px) 48px' }}
    >
      
      {/* ── Page Heading ── */}
      <div className="mb-4 mt-2">
        <h1
          className="font-bold text-white mb-2.5 tracking-tight"
          style={{ fontSize: 'clamp(24px, 2.6vw, 34px)', lineHeight: 1.25 }}
        >
          {language === 'ar' ? 'رتّب ونظّف قائمة قنواتك' : 'Clean up your channel list'}
        </h1>
        <p
          className="leading-relaxed max-w-3xl"
          style={{ fontSize: 'clamp(14px, 1.15vw, 16px)', color: '#8D96A8' }}
        >
          {language === 'ar'
            ? 'انقل قائمة القنوات من شاشتك عبر الفلاشة، رتّب واحذف الترددات المكررة، ثم أعدها للشاشة.'
            : 'Bring a channel list over from your TV, reorder and remove duplicates, then send it back.'}
        </p>
      </div>

      {/* ── 3 Steps Row ── */}
      <div className="steps-row items-stretch">

        {/* ── Step 1: On your TV ── */}
        <div className="step-card flex flex-col justify-start space-y-7">
          
          {/* Header & Description */}
          <div className="space-y-4">
            <span className="badge-tv text-xs font-semibold px-3 py-1">
              {language === 'ar' ? 'من الشاشة' : 'On your TV'}
            </span>

            <div className="flex items-center gap-3 pt-1">
              <span className="step-num w-7 h-7 text-xs font-bold">1</span>
              <span className="font-semibold text-xl text-[#F1F4F8]">
                {language === 'ar' ? 'تصدير القائمة' : 'Export list'}
              </span>
            </div>

            <p className="text-sm text-[#8D96A8] leading-relaxed pt-2">
              {language === 'ar'
                ? 'احفظ القائمة على الفلاشة من إعدادات البث في التلفزيون.'
                : 'Plug in a USB drive and export your channel list from TV settings.'}
            </p>
          </div>

          {/* Dedicated Padded Instruction Box */}
          <div className="step-path-box shadow-inner">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#BAC4D6] mb-3">
              <Route className="w-4 h-4 text-cyan-400" />
              <span>{language === 'ar' ? 'مسار القائمة في الشاشة:' : 'TV Menu Path:'}</span>
            </div>

            {/* Spacious Step Pills */}
            <div>
              {[
                language === 'ar' ? '1. الإعدادات (Settings)' : '1. Settings',
                language === 'ar' ? '2. البث (Broadcasting)' : '2. Broadcasting',
                language === 'ar' ? '3. إعدادات الخبراء (Expert Settings)' : '3. Expert Settings',
                language === 'ar' ? '4. نقل قائمة القنوات' : '4. Transfer Channel List',
                language === 'ar' ? '5. تصدير إلى USB' : '5. Export to USB',
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`step-path-item ${idx === 4 ? 'active' : ''}`}
                >
                  <span>{step}</span>
                  {idx < 4 && <ChevronRight className="w-4 h-4 text-[#5B6472] rtl:rotate-180" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chevron 1 ── */}
        <div className="hidden min-[961px]:flex items-center justify-center text-[#3A414D] px-2 my-auto">
          <ChevronRight className="w-6 h-6 rtl:rotate-180" />
        </div>

        {/* ── Step 2: Main In this app (Spacious Dropzone) ── */}
        <div className="step-card main flex flex-col justify-start space-y-7">
          <div className="space-y-4">
            <div>
              <span className="badge-app text-xs font-semibold px-3 py-1">
                {language === 'ar' ? 'في هذا التطبيق' : 'In this app'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="step-num on w-7 h-7 text-xs font-bold">2</span>
              <span className="font-semibold text-xl text-[#F1F4F8]">
                {language === 'ar' ? 'الترتيب والتنظيم الذكي' : 'Organize Channels'}
              </span>
            </div>

            {/* Spacious Dropzone with generous top and bottom breathing room */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`clean-dropzone flex flex-col items-center justify-center text-center p-9 sm:p-14 mt-6 mb-2 space-y-4 cursor-pointer transition-all ${
                isDragging ? 'border-[#4C82FB] bg-[rgba(76,130,251,0.14)] scale-[1.01]' : 'hover:border-[#4C82FB]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".zip"
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-[#4C82FB] shadow-inner mb-1">
                <UploadCloud className="w-8 h-8" />
              </div>
              
              <div className="space-y-1.5">
                <p className="font-bold text-base sm:text-lg text-[#F1F4F8]">
                  {language === 'ar' ? 'اسحب وأفلت ملف Channel_list.zip هنا' : 'Drop channel_list.zip here'}
                </p>
                <p className="text-xs sm:text-sm text-[#8D96A8]">
                  {language === 'ar' ? 'أو اضغط لاختيار الملف من الفلاشة' : 'or click anywhere to browse from your USB'}
                </p>
              </div>
              
              <button
                type="button"
                className="clean-browse-btn px-7 py-3 text-sm font-semibold rounded-xl mt-3 hover:bg-[#1B212B] transition-all"
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

          {/* Auto-clean toggle with ample space above & below */}
          <div className="border-t border-[#232933] pt-7 pb-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[#BAC4D6] font-medium">
                {language === 'ar' ? 'تنظيف الترددات المكررة تلقائياً' : 'Auto-clean duplicate frequencies'}
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
          </div>
        </div>

        {/* ── Chevron 2 ── */}
        <div className="hidden min-[961px]:flex items-center justify-center text-[#3A414D] px-2 my-auto">
          <ChevronRight className="w-6 h-6 rtl:rotate-180" />
        </div>

        {/* ── Step 3: On your TV ── */}
        <div className="step-card flex flex-col justify-start space-y-7">
          
          {/* Header & Description */}
          <div className="space-y-4">
            <span className="badge-tv text-xs font-semibold px-3 py-1">
              {language === 'ar' ? 'من الشاشة' : 'On your TV'}
            </span>

            <div className="flex items-center gap-3 pt-1">
              <span className="step-num w-7 h-7 text-xs font-bold">3</span>
              <span className="font-semibold text-xl text-[#F1F4F8]">
                {language === 'ar' ? 'استيراد للشاشة' : 'Import to TV'}
              </span>
            </div>

            <p className="text-sm text-[#8D96A8] leading-relaxed pt-2">
              {language === 'ar'
                ? 'ضع الفلاشة في التلفزيون واستورد القائمة الجديدة المنظمة.'
                : 'Plug the USB back into your TV and import the clean channel list.'}
            </p>
          </div>

          {/* Dedicated Padded Instruction Box */}
          <div className="step-path-box shadow-inner">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#BAC4D6] mb-3">
              <Route className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'مسار الاستيراد في الشاشة:' : 'TV Menu Path:'}</span>
            </div>

            {/* Spacious Step Pills */}
            <div>
              {[
                language === 'ar' ? '1. الإعدادات (Settings)' : '1. Settings',
                language === 'ar' ? '2. البث (Broadcasting)' : '2. Broadcasting',
                language === 'ar' ? '3. إعدادات الخبراء (Expert Settings)' : '3. Expert Settings',
                language === 'ar' ? '4. نقل قائمة القنوات' : '4. Transfer Channel List',
                language === 'ar' ? '5. استيراد من USB' : '5. Import from USB',
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`step-path-item ${idx === 4 ? 'active-import' : ''}`}
                >
                  <span>{step}</span>
                  {idx < 4 && <ChevronRight className="w-4 h-4 text-[#5B6472] rtl:rotate-180" />}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="mt-8 flex items-center gap-2 text-xs sm:text-sm text-[#8D96A8]">
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
