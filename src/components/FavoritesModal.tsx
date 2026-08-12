import React, { useState } from 'react';
import { Star, X, Trash2, GripVertical, Tv, Radio } from 'lucide-react';
import { Channel } from '../types/channel';
import { translations } from '../utils/i18n';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  favoriteLists: Map<number, string[]>;
  onUpdateFavorites: (newLists: Map<number, string[]>) => void;
  language: 'en' | 'ar';
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  channels,
  favoriteLists,
  onUpdateFavorites,
  language,
}) => {
  const t = translations[language];
  const [activeFav, setActiveFav] = useState<number>(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const channelMap = new Map<string, Channel>();
  channels.forEach((c) => channelMap.set(c.srvId, c));

  const currentList = favoriteLists.get(activeFav) || [];

  const handleRemoveFromFav = (srvId: string) => {
    const updated = new Map(favoriteLists);
    const list = (updated.get(activeFav) || []).filter((id) => id !== srvId);
    updated.set(activeFav, list);
    onUpdateFavorites(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const list = [...currentList];
    const [moved] = list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, moved);

    const updated = new Map(favoriteLists);
    updated.set(activeFav, list);
    onUpdateFavorites(updated);
    setDraggedIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-700/80 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {t.favorites} Manager
              </h2>
              <p className="text-xs text-slate-400">
                Samsung TVs support up to 5 custom Favorites lists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Favorite Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4">
          {[1, 2, 3, 4, 5].map((num) => {
            const count = (favoriteLists.get(num) || []).length;
            return (
              <button
                key={num}
                onClick={() => setActiveFav(num)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                  activeFav === num
                    ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${activeFav === num ? 'fill-amber-400' : ''}`} />
                <span>Fav {num}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Channels in active list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              {t.emptyFavList}
            </div>
          ) : (
            currentList.map((srvId, idx) => {
              const ch = channelMap.get(srvId);
              if (!ch) return null;

              return (
                <div
                  key={srvId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="glass rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3 text-xs group hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab text-slate-600 group-hover:text-slate-400">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-xs w-6">
                      #{idx + 1}
                    </span>
                    {ch.srvType === 2 ? (
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Tv className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="font-bold text-white text-sm">
                      {ch.srvName}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      (TV #{ch.major})
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveFromFav(srvId)}
                    title="Remove from this favorites list"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button onClick={onClose} className="btn btn-primary text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
