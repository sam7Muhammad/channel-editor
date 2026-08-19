import React from 'react';
import { Search, X, Lock, Unlock, Eye, EyeOff, ArrowUpDown, Layers } from 'lucide-react';
import { ChannelFilter, Satellite } from '../types/channel';
import { translations } from '../utils/i18n';
import { PREDEFINED_CATEGORIES } from '../types/category';

interface FilterBarProps {
  filter: ChannelFilter;
  onFilterChange: (filter: ChannelFilter) => void;
  satellites: Satellite[];
  categories: string[];
  selectedCount: number;
  totalFilteredCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  allSelected: boolean;
  onBulkMove: () => void;
  onBulkHide: (hide: boolean) => void;
  onBulkLock: (lock: boolean) => void;
  onBulkFavorite: (fav: number) => void;
  onBulkAssignCategory?: (categoryName: string) => void;
  language: 'en' | 'ar';
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  satellites,
  categories,
  selectedCount,
  totalFilteredCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  allSelected,
  onBulkMove,
  onBulkHide,
  onBulkLock,
  onBulkFavorite,
  onBulkAssignCategory,
  language,
}) => {
  const t = translations[language];

  const selectStyle = {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '7px 12px',
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties;

  return (
    <div className="p-4 sm:p-5 space-y-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>

      {/* ── Row 1: Full-width Search + Count ── */}
      <div className="flex items-center gap-3">
        {/* Search — takes all remaining space */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            placeholder={t.searchPlaceholder}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '9px 36px',
              fontSize: '14px',
              fontWeight: 500,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--border-active)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Channel count */}
        <span className="flex-shrink-0 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          <span className="text-cyan-400 font-bold">{totalFilteredCount}</span>
          <span> / {totalCount}</span>
        </span>
      </div>

      {/* ── Row 2: Filter chips ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type pill group */}
        <div
          className="flex items-center rounded-xl p-0.5 gap-0.5 flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
        >
          {(['all', 'tv', 'radio'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onFilterChange({ ...filter, typeFilter: type })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={
                filter.typeFilter === type
                  ? { background: 'var(--accent-blue)', color: '#fff' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {type === 'all' ? t.allTypes : type === 'tv' ? `📺 ${t.tvOnly}` : `📻 ${t.radioOnly}`}
            </button>
          ))}
        </div>

        {/* Categories Filter Dropdown */}
        <select
          style={{ ...selectStyle, color: '#c084fc' }}
          value={filter.categoryFilter}
          onChange={(e) => onFilterChange({ ...filter, categoryFilter: e.target.value })}
        >
          <option value="all">📂 {language === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
          {categories.length > 0 && (
            <option value="uncategorized">📁 {language === 'ar' ? 'بدون فئة' : 'Uncategorized'}</option>
          )}
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              📁 {cat}
            </option>
          ))}
        </select>

        {/* Encryption */}
        <select
          style={selectStyle}
          value={filter.encryptionFilter}
          onChange={(e) => onFilterChange({ ...filter, encryptionFilter: e.target.value as ChannelFilter['encryptionFilter'] })}
        >
          <option value="all">{t.allEncryption}</option>
          <option value="fta">🟢 {t.ftaOnly}</option>
          <option value="scrambled">🔐 {t.scrambledOnly}</option>
        </select>

        {/* Visibility */}
        <select
          style={selectStyle}
          value={filter.visibilityFilter}
          onChange={(e) => onFilterChange({ ...filter, visibilityFilter: e.target.value as ChannelFilter['visibilityFilter'] })}
        >
          <option value="all">{t.allVisibility}</option>
          <option value="visible">👁️ {t.visibleOnly}</option>
          <option value="hidden">🚫 {t.hiddenOnly}</option>
        </select>

        {/* Favorites */}
        <select
          style={{ ...selectStyle, color: 'var(--accent-amber)' }}
          value={filter.favoriteFilter}
          onChange={(e) => onFilterChange({ ...filter, favoriteFilter: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
        >
          <option value="all">⭐ All Favorites</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>⭐ Fav {n}</option>
          ))}
        </select>

        {/* Satellite */}
        {satellites.length > 1 && (
          <select
            style={selectStyle}
            value={filter.satelliteId}
            onChange={(e) => onFilterChange({ ...filter, satelliteId: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
          >
            <option value="all">🛰️ All Satellites</option>
            {satellites.map((s) => (
              <option key={s.satId} value={s.satId}>🛰️ {s.satName}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Row 3: Bulk actions (only when items selected) ── */}
      {selectedCount > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl animate-fade-in"
          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(59,130,246,0.18)', color: '#67e8f9', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              {selectedCount} {t.selectedCount}
            </span>
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              {allSelected ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button onClick={onBulkMove} className="btn btn-secondary btn-sm text-cyan-400 border-cyan-500/30">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{t.bulkMove}</span>
            </button>
            <button onClick={() => onBulkLock(true)} className="btn btn-secondary btn-sm">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t.bulkLock}</span>
            </button>
            <button onClick={() => onBulkLock(false)} className="btn btn-secondary btn-sm">
              <Unlock className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => onBulkHide(true)} className="btn btn-secondary btn-sm">
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{t.bulkHide}</span>
            </button>
            <button onClick={() => onBulkHide(false)} className="btn btn-secondary btn-sm">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <select
              onChange={(e) => { if (e.target.value) { onBulkFavorite(Number(e.target.value)); e.target.value = ''; } }}
              defaultValue=""
              style={{ ...selectStyle, padding: '5px 10px', fontSize: '12px', color: 'var(--accent-amber)' }}
            >
              <option value="" disabled>⭐ {t.bulkFav}…</option>
              {[1,2,3,4,5].map((n) => <option key={n} value={n}>⭐ Add to Fav {n}</option>)}
            </select>

            {/* Bulk Assign Category */}
            {onBulkAssignCategory && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkAssignCategory(e.target.value === '__none__' ? '' : e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                style={{ ...selectStyle, padding: '5px 10px', fontSize: '12px', color: '#c084fc' }}
              >
                <option value="" disabled>
                  📂 {language === 'ar' ? 'تعيين فئة...' : 'Assign Category...'}
                </option>
                <option value="__none__">🚫 {language === 'ar' ? 'إزالة الفئة' : 'Remove Category'}</option>
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {language === 'ar' ? cat.nameAr : cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
