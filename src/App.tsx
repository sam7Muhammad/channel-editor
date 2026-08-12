import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Channel, Satellite, ChannelFilter, MetadataInfo } from './types/channel';
import { SamsungDbManager } from './services/dbService';
import { SamsungZipService, ExtractedPackage } from './services/zipService';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { FilterBar } from './components/FilterBar';
import { ChannelList } from './components/ChannelList';
import { AIOrganizeModal } from './components/AIOrganizeModal';
import { FavoritesModal } from './components/FavoritesModal';
import { MoveToModal } from './components/MoveToModal';
import { ExportSuccessModal } from './components/ExportSuccessModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // Application State
  const [extractedPackage, setExtractedPackage] = useState<ExtractedPackage | null>(null);
  const [dbManager, setDbManager] = useState<SamsungDbManager | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [favoriteLists, setFavoriteLists] = useState<Map<number, string[]>>(new Map());
  const [metadata, setMetadata] = useState<MetadataInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Undo History
  const [undoStack, setUndoStack] = useState<Channel[][]>([]);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Filter & Search State
  const [filter, setFilter] = useState<ChannelFilter>({
    searchQuery: '',
    typeFilter: 'all',
    satelliteId: 'all',
    encryptionFilter: 'all',
    visibilityFilter: 'all',
    favoriteFilter: 'all',
    categoryFilter: 'all',
  });

  // Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [moveToTarget, setMoveToTarget] = useState<Channel | null>(null);
  const [isMoveToModalOpen, setIsMoveToModalOpen] = useState(false);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [isExportSuccessOpen, setIsExportSuccessOpen] = useState(false);

  // Settings & Theme State
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark';
  });
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    return (localStorage.getItem('app_lang') as 'en' | 'ar') || 'en';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('app_lang', language);
  }, [language]);

  const saveUndoSnapshot = useCallback((currentChannels: Channel[]) => {
    setUndoStack((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(currentChannels))]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setChannels(prev);
  }, [undoStack]);

  // Close / go back to home screen
  const handleCloseFile = useCallback(() => {
    setChannels([]);
    setSatellites([]);
    setMetadata(undefined);
    setExtractedPackage(null);
    setDbManager(null);
    setSelectedIds(new Set());
    setUndoStack([]);
  }, []);

  // Load and Unpack ZIP
  const handleFileSelected = async (file: File | Blob, filename: string) => {
    setIsLoading(true);
    try {
      const pkg = await SamsungZipService.extractZip(file, filename);
      const manager = new SamsungDbManager();
      await manager.loadDatabases({
        dvbs: pkg.dvbs,
        sat: pkg.sat,
        ipsrv: pkg.ipsrv,
      });

      const loadedSats = manager.getSatellites();
      const loadedChannels = manager.getChannels(loadedSats);

      // Extract favorite lists
      const favMap = new Map<number, string[]>();
      for (let i = 1; i <= 5; i++) favMap.set(i, []);
      loadedChannels.forEach((ch) => {
        ch.favs.forEach((favNum) => {
          if (favMap.has(favNum)) {
            favMap.get(favNum)!.push(ch.srvId);
          }
        });
      });

      setExtractedPackage(pkg);
      setDbManager(manager);
      setSatellites(loadedSats);
      setChannels(loadedChannels);
      setFavoriteLists(favMap);
      setMetadata(pkg.metadata);
      setUndoStack([]);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Error loading channel package:', err);
      alert(`Could not read Samsung Channel List:\n${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder single channel
  const handleReorder = (sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return;

    saveUndoSnapshot(channels);
    const updated = [...channels];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(destinationIndex, 0, moved);

    // Recompute sequential major order
    updated.forEach((ch, idx) => {
      ch.major = idx + 1;
    });

    setChannels(updated);
  };

  // Move single channel or selected to position #N
  const handleConfirmMove = (newPosition: number) => {
    saveUndoSnapshot(channels);
    const targetIdx = Math.max(0, Math.min(channels.length - 1, newPosition - 1));

    let updated = [...channels];

    if (moveToTarget) {
      // Single channel move
      const currIdx = updated.findIndex((c) => c.srvId === moveToTarget.srvId);
      if (currIdx !== -1) {
        const [item] = updated.splice(currIdx, 1);
        updated.splice(targetIdx, 0, item);
      }
    } else if (selectedIds.size > 0) {
      // Move selected block
      const selectedItems = updated.filter((c) => selectedIds.has(c.srvId));
      updated = updated.filter((c) => !selectedIds.has(c.srvId));
      updated.splice(targetIdx, 0, ...selectedItems);
    }

    // Reassign major sequential
    updated.forEach((ch, idx) => {
      ch.major = idx + 1;
    });

    setChannels(updated);
    setMoveToTarget(null);
  };

  // Channel row actions
  const handleToggleLock = (srvId: string) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (c.srvId === srvId ? { ...c, lockMode: !c.lockMode } : c))
    );
  };

  const handleToggleHidden = (srvId: string) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (c.srvId === srvId ? { ...c, hidden: !c.hidden } : c))
    );
  };

  const handleRename = (srvId: string, newName: string) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (c.srvId === srvId ? { ...c, srvName: newName } : c))
    );
  };

  const handleToggleFavorite = (srvId: string, favNumber: number) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => {
        if (c.srvId !== srvId) return c;
        const favs = c.favs.includes(favNumber)
          ? c.favs.filter((f) => f !== favNumber)
          : [...c.favs, favNumber];
        return { ...c, favs };
      })
    );

    // Update favorite lists state
    setFavoriteLists((prev) => {
      const next = new Map(prev);
      const list = next.get(favNumber) || [];
      if (list.includes(srvId)) {
        next.set(
          favNumber,
          list.filter((id) => id !== srvId)
        );
      } else {
        next.set(favNumber, [...list, srvId]);
      }
      return next;
    });
  };

  // Multi-select handling with Shift-Click
  const handleToggleSelect = (srvId: string, event: React.MouseEvent) => {
    const next = new Set(selectedIds);

    if (event.shiftKey && lastSelectedId) {
      const startIdx = channels.findIndex((c) => c.srvId === lastSelectedId);
      const endIdx = channels.findIndex((c) => c.srvId === srvId);
      if (startIdx !== -1 && endIdx !== -1) {
        const [low, high] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        for (let i = low; i <= high; i++) {
          next.add(channels[i].srvId);
        }
      }
    } else {
      if (next.has(srvId)) next.delete(srvId);
      else next.add(srvId);
      setLastSelectedId(srvId);
    }

    setSelectedIds(next);
  };

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      // Search query
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim();
        const matchesName = ch.srvName.toLowerCase().includes(q);
        const matchesNum = String(ch.major) === q;
        const matchesFreq = String(ch.freq).includes(q);
        if (!matchesName && !matchesNum && !matchesFreq) return false;
      }

      // Type filter
      if (filter.typeFilter === 'tv' && ch.srvType === 2) return false;
      if (filter.typeFilter === 'radio' && ch.srvType !== 2) return false;
      if (filter.typeFilter === 'data' && ch.srvType !== 12) return false;

      // Encryption
      if (filter.encryptionFilter === 'fta' && ch.scrambled) return false;
      if (filter.encryptionFilter === 'scrambled' && !ch.scrambled) return false;

      // Visibility
      if (filter.visibilityFilter === 'visible' && ch.hidden) return false;
      if (filter.visibilityFilter === 'hidden' && !ch.hidden) return false;

      // Favorite filter
      if (typeof filter.favoriteFilter === 'number') {
        if (!ch.favs.includes(filter.favoriteFilter)) return false;
      }

      // Satellite filter
      if (typeof filter.satelliteId === 'number') {
        if (ch.satId !== filter.satelliteId) return false;
      }

      return true;
    });
  }, [channels, filter]);

  // Bulk actions
  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredChannels.map((c) => c.srvId)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkLock = (lock: boolean) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (selectedIds.has(c.srvId) ? { ...c, lockMode: lock } : c))
    );
  };

  const handleBulkHide = (hide: boolean) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (selectedIds.has(c.srvId) ? { ...c, hidden: hide } : c))
    );
  };

  const handleBulkFavorite = (favNumber: number) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => {
        if (!selectedIds.has(c.srvId)) return c;
        const favs = c.favs.includes(favNumber) ? c.favs : [...c.favs, favNumber];
        return { ...c, favs };
      })
    );
    setFavoriteLists((prev) => {
      const next = new Map(prev);
      const list = new Set(next.get(favNumber) || []);
      selectedIds.forEach((id) => list.add(id));
      next.set(favNumber, Array.from(list));
      return next;
    });
  };

  // Apply AI Smart Organization
  const handleApplyAIResults = (
    removedJunkIds: string[],
    hiddenDuplicateIds: string[],
    newCategoryOrder: { categoryName: string; srvIds: string[] }[]
  ) => {
    saveUndoSnapshot(channels);

    const junkSet = new Set(removedJunkIds);
    const dupeSet = new Set(hiddenDuplicateIds);

    // 1. Build map of all channels
    const chMap = new Map<string, Channel>();
    channels.forEach((c) => {
      const isJunk = junkSet.has(c.srvId);
      const isDupeHide = dupeSet.has(c.srvId);
      chMap.set(c.srvId, {
        ...c,
        hidden: c.hidden || isJunk || isDupeHide,
        isJunk,
      });
    });

    // 2. Build the new categorized order
    const orderedList: Channel[] = [];
    const addedIds = new Set<string>();

    // Add in categorized order
    for (const cat of newCategoryOrder) {
      for (const srvId of cat.srvIds) {
        if (chMap.has(srvId) && !addedIds.has(srvId)) {
          const ch = chMap.get(srvId)!;
          orderedList.push({ ...ch, category: cat.categoryName });
          addedIds.add(srvId);
        }
      }
    }

    // Append any remaining channels
    channels.forEach((c) => {
      if (!addedIds.has(c.srvId)) {
        orderedList.push(chMap.get(c.srvId)!);
        addedIds.add(c.srvId);
      }
    });

    // 3. Reassign sequential major numbering
    orderedList.forEach((ch, idx) => {
      ch.major = idx + 1;
    });

    setChannels(orderedList);
  };

  // Export to TV USB ZIP
  const handleExport = async () => {
    if (!dbManager || !extractedPackage) return;

    try {
      // 1. Save updated channels & favorites in SQLite WASM
      dbManager.saveChannels(channels, favoriteLists);

      // 2. Export SQLite database binaries
      const { dvbs, sat, ipsrv } = dbManager.exportDatabases();

      // 3. Create ZIP archive
      const zipBlob = await SamsungZipService.createExportZip(
        dvbs,
        sat,
        ipsrv,
        extractedPackage.metadata?.rawXml,
        extractedPackage.otherFiles
      );

      // 4. Create download URL & open success modal
      const url = URL.createObjectURL(zipBlob);
      setExportDownloadUrl(url);
      setIsExportSuccessOpen(true);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message || err}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Header */}
      <Header
        channelCount={channels.length}
        metadata={metadata}
        filename={extractedPackage?.filename}
        canUndo={undoStack.length > 0}
        onUndo={handleUndo}
        onCloseFile={channels.length > 0 ? handleCloseFile : undefined}
        onOpenAiOrganize={() => setIsAiModalOpen(true)}
        onOpenFavorites={() => setIsFavModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExport={handleExport}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full min-h-[calc(100vh-80px)]">
        {channels.length === 0 ? (
          <FileUploader
            onFileSelected={handleFileSelected}
            isLoading={isLoading}
            language={language}
          />
        ) : (
          <div className="flex-1 flex flex-col w-full px-6 sm:px-10 lg:px-14 py-5 space-y-4">
            {/* Filter & Multi-Select Toolbar + Channel List */}
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden glass shadow-2xl">
              <FilterBar
                filter={filter}
                onFilterChange={setFilter}
                satellites={satellites}
                selectedCount={selectedIds.size}
                totalFilteredCount={filteredChannels.length}
                totalCount={channels.length}
                onSelectAll={handleSelectAllFiltered}
                onDeselectAll={handleDeselectAll}
                allSelected={
                  filteredChannels.length > 0 &&
                  filteredChannels.every((c) => selectedIds.has(c.srvId))
                }
                onBulkMove={() => {
                  setMoveToTarget(null);
                  setIsMoveToModalOpen(true);
                }}
                onBulkHide={handleBulkHide}
                onBulkLock={handleBulkLock}
                onBulkFavorite={handleBulkFavorite}
                language={language}
              />

              {/* Virtualized Channel List */}
              <ChannelList
                channels={filteredChannels}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onQuickMove={(ch) => {
                  setMoveToTarget(ch);
                  setIsMoveToModalOpen(true);
                }}
                onToggleLock={handleToggleLock}
                onToggleHidden={handleToggleHidden}
                onToggleFavorite={handleToggleFavorite}
                onRename={handleRename}
                onReorder={handleReorder}
                language={language}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AIOrganizeModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        channels={channels}
        apiKey={geminiApiKey}
        onSaveApiKey={(key) => {
          setGeminiApiKey(key);
          localStorage.setItem('gemini_api_key', key);
        }}
        onApplyAIResults={handleApplyAIResults}
        language={language}
      />

      <FavoritesModal
        isOpen={isFavModalOpen}
        onClose={() => setIsFavModalOpen(false)}
        channels={channels}
        favoriteLists={favoriteLists}
        onUpdateFavorites={setFavoriteLists}
        language={language}
      />

      <MoveToModal
        isOpen={isMoveToModalOpen}
        onClose={() => {
          setIsMoveToModalOpen(false);
          setMoveToTarget(null);
        }}
        targetChannel={moveToTarget}
        selectedCount={selectedIds.size}
        totalChannels={channels.length}
        onConfirmMove={handleConfirmMove}
        language={language}
      />

      <ExportSuccessModal
        isOpen={isExportSuccessOpen}
        onClose={() => setIsExportSuccessOpen(false)}
        downloadUrl={exportDownloadUrl}
        filename={extractedPackage?.filename || 'Channel_list_T-KTS2UABC-2740.1.zip'}
        language={language}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        apiKey={geminiApiKey}
        onSaveApiKey={(key) => {
          setGeminiApiKey(key);
          localStorage.setItem('gemini_api_key', key);
        }}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      />
    </div>
  );
};
