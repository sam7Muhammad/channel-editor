import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, Tv } from 'lucide-react';
import { translations } from '../utils/i18n';

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string | null;
  filename: string;
  language: 'en' | 'ar';
}

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
  isOpen,
  onClose,
  downloadUrl,
  filename,
  language,
}) => {
  const t = translations[language].exportSuccessModal;

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen || !downloadUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-lg border border-emerald-500/30 shadow-2xl overflow-hidden p-6 space-y-6 animate-fade-in text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {t.title}
          </h2>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
            {filename}
          </p>
        </div>

        {/* Big Download Button */}
        <a
          href={downloadUrl}
          download={filename}
          className="btn btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span>{t.downloadBtn}</span>
        </a>

        {/* 4-Step TV Import Guide */}
        <div className="rounded-xl p-4 text-left rtl:text-right border space-y-3" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
          <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-wider flex items-center gap-2">
            <Tv className="w-4 h-4" />
            <span>{t.howToImportTitle}</span>
          </h4>

          <ol className="space-y-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-[11px] flex-shrink-0">
                1
              </span>
              <span>{t.step1}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-[11px] flex-shrink-0">
                2
              </span>
              <span>{t.step2}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-[11px] flex-shrink-0">
                3
              </span>
              <span>{t.step3}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-[11px] flex-shrink-0">
                4
              </span>
              <span>{t.step4}</span>
            </li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="btn btn-secondary w-full text-xs font-bold cursor-pointer"
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
};
