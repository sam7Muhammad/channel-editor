import React, { useState } from 'react';
import {
  GripVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Star,
  Edit2,
  Check,
  X,
  Radio,
  Tv,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { Channel } from '../types/channel';
import { formatFrequency } from '../utils/samsungEncoder';
import { PREDEFINED_CATEGORIES } from '../types/category';

interface ChannelRowProps {
  channel: Channel;
  index: number;
  isSelected: boolean;
  onToggleSelect: (srvId: string, event: React.MouseEvent) => void;
  onQuickMove: (channel: Channel) => void;
  onToggleLock: (srvId: string) => void;
  onToggleHidden: (srvId: string) => void;
  onToggleFavorite: (srvId: string, favNumber: number) => void;
  onRename: (srvId: string, newName: string) => void;
  onNumberEdit: (srvId: string, newNumber: number) => void;
  onAssignCategory?: (srvId: string, category: string) => void;
  dragRef?: (node: HTMLElement | null) => void;
  dragListeners?: Record<string, any>;
}

export const ChannelRow: React.FC<ChannelRowProps> = ({
  channel,
  index,
  isSelected,
  onToggleSelect,
  onQuickMove,
  onToggleLock,
  onToggleHidden,
  onToggleFavorite,
  onRename,
  onNumberEdit,
  onAssignCategory,
  dragRef,
  dragListeners,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(channel.srvName);
  
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [editNumber, setEditNumber] = useState(channel.major.toString());

  const handleSaveRename = () => {
    if (editName.trim() && editName !== channel.srvName) {
      onRename(channel.srvId, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') {
      setEditName(channel.srvName);
      setIsEditing(false);
    }
  };

  const handleSaveNumber = () => {
    const parsed = parseInt(editNumber, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed !== channel.major) {
      onNumberEdit(channel.srvId, parsed);
    } else {
      setEditNumber(channel.major.toString());
    }
    setIsEditingNumber(false);
  };

  const handleKeyDownNumber = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveNumber();
    if (e.key === 'Escape') {
      setEditNumber(channel.major.toString());
      setIsEditingNumber(false);
    }
  };

  // Signal color coding
  let signalClass = 'signal-good';
  if (channel.sigQa >= 70 && channel.bitErr === 0) signalClass = 'signal-great';
  else if (channel.sigQa < 40 || channel.bitErr > 200) signalClass = 'signal-poor';
  else if (channel.sigQa < 55) signalClass = 'signal-mid';

  const matchedPredef = PREDEFINED_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (channel.category || '').toLowerCase()
  );

  return (
    <div
      className={`group flex items-center gap-3.5 px-5 py-3 border-b transition-colors text-sm ${
        isSelected
          ? 'bg-blue-500/15 border-l-4 border-l-cyan-400'
          : channel.hidden
          ? 'opacity-40 hover:opacity-80'
          : 'hover:bg-slate-500/10'
      }`}
      style={{ borderColor: 'var(--border-color)' }}
    >
      {/* Drag Handle */}
      <div
        ref={dragRef}
        {...dragListeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-cyan-400 p-1 outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded"
        title="Drag to reorder channel position"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Select Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => {}}
        onClick={(e) => onToggleSelect(channel.srvId, e)}
        className="w-4.5 h-4.5 rounded border-slate-600 cursor-pointer"
      />

      {/* Major Order # Badge */}
      <div className="w-16 flex-shrink-0 pr-2 flex justify-end">
        {isEditingNumber ? (
          <input
            type="number"
            value={editNumber}
            onChange={(e) => setEditNumber(e.target.value)}
            onKeyDown={handleKeyDownNumber}
            onBlur={handleSaveNumber}
            autoFocus
            min={1}
            className="w-full max-w-[60px] bg-slate-800 text-cyan-400 font-mono font-bold text-sm px-1.5 py-0.5 rounded text-right focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        ) : (
          <div 
            onClick={() => {
              setEditNumber(channel.major.toString());
              setIsEditingNumber(true);
            }}
            className="font-mono font-bold text-sm sm:text-base text-cyan-400 cursor-pointer hover:bg-slate-700/50 rounded px-1.5 py-0.5"
            title="Click to edit channel number"
          >
            #{channel.major}
          </div>
        )}
      </div>

      {/* Type Icon */}
      <div className="text-slate-400 flex-shrink-0" title={channel.typeLabel}>
        {channel.srvType === 2 ? (
          <Radio className="w-5 h-5 text-amber-400" />
        ) : (
          <Tv
            className={`w-5 h-5 ${
              channel.srvType === 25 ? 'text-cyan-400' : 'text-slate-400'
            }`}
          />
        )}
      </div>

      {/* Channel Name (with Inline Edit) */}
      <div className="flex-1 min-w-[200px] flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="rounded-lg px-3 py-1.5 text-sm w-full font-semibold focus:outline-none"
            />
            <button
              onClick={handleSaveRename}
              className="p-1.5 text-emerald-400 hover:text-emerald-300"
            >
              <Check className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => {
                setEditName(channel.srvName);
                setIsEditing(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 group/name flex-1 flex-wrap">
            <span
              onDoubleClick={() => setIsEditing(true)}
              className="font-bold hover:text-cyan-400 cursor-text select-text text-sm sm:text-base"
            >
              {channel.srvName}
            </span>

            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover/name:opacity-100 p-1 text-slate-400 hover:text-cyan-400 transition-opacity"
              title="Click to rename"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Badges */}
            {channel.srvType === 25 && (
              <span className="badge badge-hd text-[10px]">HD</span>
            )}
            {channel.scrambled && (
              <span className="badge badge-scrambled text-[10px]" title="Encrypted Stream">
                🔐 PAY
              </span>
            )}
            {channel.isDuplicate && (
              <span className="badge badge-fav text-[10px]" title="Same channel on multiple frequencies">
                DUPE
              </span>
            )}
            {channel.isJunk && (
              <span className="badge text-[10px] bg-rose-500/20 text-rose-300 border-rose-500/30" title="Detected as test or placeholder feed">
                TEST
              </span>
            )}

            {/* Category Badge / Quick assign */}
            {channel.category ? (
              <span
                className="badge text-[11px] bg-purple-500/20 text-purple-300 border-purple-500/30 flex items-center gap-1.5 font-semibold cursor-pointer hover:bg-purple-500/30 transition-colors py-0.5 px-2"
                title={`Assigned Category: ${channel.category} (Click to change)`}
                onClick={() => {
                  if (onAssignCategory) {
                    const nextCat = prompt('Change category for this channel:', channel.category);
                    if (nextCat !== null) onAssignCategory(channel.srvId, nextCat.trim());
                  }
                }}
              >
                <span className="text-xs">{matchedPredef?.icon || '📁'}</span>
                <span>{channel.category}</span>
              </span>
            ) : onAssignCategory ? (
              <button
                onClick={() => {
                  const cat = prompt('Assign category for this channel:');
                  if (cat && cat.trim()) onAssignCategory(channel.srvId, cat.trim());
                }}
                className="opacity-0 group-hover/name:opacity-100 p-0.5 text-[10px] text-slate-400 hover:text-purple-300 transition-opacity flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-purple-500/10"
                title="Assign category"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>+Cat</span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Frequency */}
      <div className="hidden lg:block w-36 text-xs text-slate-400 font-mono">
        {formatFrequency(channel.freq)}
      </div>

      {/* Signal Quality Meter */}
      <div className="hidden sm:flex items-center gap-2 w-32">
        <div className="signal-meter" title={`Quality: ${channel.sigQa}%, Bit Error: ${channel.bitErr}`}>
          <div
            className={`signal-fill ${signalClass}`}
            style={{ width: `${Math.min(100, Math.max(10, channel.sigQa))}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          {channel.sigQa}%
        </span>
      </div>

      {/* Favorites Star Badges */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((favNum) => {
          const isFav = channel.favs.includes(favNum);
          return (
            <button
              key={favNum}
              onClick={() => onToggleFavorite(channel.srvId, favNum)}
              title={isFav ? `Remove from Fav ${favNum}` : `Add to Fav ${favNum}`}
              className={`p-1.5 rounded-lg transition-colors ${
                isFav
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-400/40 hover:text-slate-400'
              }`}
            >
              <Star
                className={`w-5 h-5 ${isFav ? 'fill-amber-400' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {/* Lock & Visibility Toggles */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggleLock(channel.srvId)}
          title={channel.lockMode ? 'Locked with PIN (Click to unlock)' : 'Unlocked (Click to lock)'}
          className={`p-2 rounded-xl transition-colors ${
            channel.lockMode
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
          }`}
        >
          {channel.lockMode ? <Lock className="w-4.5 h-4.5" /> : <Unlock className="w-4.5 h-4.5" />}
        </button>

        <button
          onClick={() => onToggleHidden(channel.srvId)}
          title={channel.hidden ? 'Hidden on TV (Click to show)' : 'Visible (Click to hide)'}
          className={`p-2 rounded-xl transition-colors ${
            channel.hidden
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
          }`}
        >
          {channel.hidden ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
        </button>

        {/* Quick Move Button */}
        <button
          onClick={() => onQuickMove(channel)}
          title="Move to specific position number"
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
        >
          <ArrowUpDown className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};
