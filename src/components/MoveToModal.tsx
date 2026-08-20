import React, { useState } from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { Channel } from '../types/channel';
import { translations } from '../utils/i18n';

interface MoveToModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetChannel?: Channel | null;
  selectedCount: number;
  totalChannels: number;
  onConfirmMove: (newPosition: number) => void;
  language: 'en' | 'ar';
}

export const MoveToModal: React.FC<MoveToModalProps> = ({
  isOpen,
  onClose,
  targetChannel,
  selectedCount,
  totalChannels,
  onConfirmMove,
  language,
}) => {
  const t = translations[language];
  const mt = t.moveToModal;
  const [positionInput, setPositionInput] = useState<string>(
    targetChannel ? String(targetChannel.major) : '1'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pos = parseInt(positionInput, 10);
    if (!isNaN(pos) && pos >= 1 && pos <= totalChannels) {
      onConfirmMove(pos);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-sm border border-slate-700/80 shadow-2xl p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {mt.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {targetChannel ? (
            <>
              {language === 'ar' ? 'نقل القناة ' : 'Move '}
              <span className="text-cyan-400 font-bold">"{targetChannel.srvName}"</span>
              {language === 'ar' ? ' إلى الموضع الجديد:' : ' to new position:'}
            </>
          ) : (
            <>
              {language === 'ar' ? 'نقل ' : 'Move '}
              <span className="text-cyan-400 font-bold">{selectedCount} {t.selectedCount}</span>
              {language === 'ar' ? ' إلى الموضع رقم:' : ' starting at position:'}
            </>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono mb-1" style={{ color: 'var(--text-secondary)' }}>
              {mt.destinationLabel} (1 - {totalChannels})
            </label>
            <input
              type="number"
              min="1"
              max={totalChannels}
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              autoFocus
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-lg font-bold text-center focus:outline-none focus:border-cyan-500"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs cursor-pointer"
            >
              {mt.cancelBtn}
            </button>
            <button type="submit" className="btn btn-primary text-xs font-bold cursor-pointer">
              {mt.confirmBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
