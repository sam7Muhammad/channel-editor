import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Channel, Satellite, ChannelFilter, MetadataInfo, AIOrganizeResult } from './types/channel';
import { SamsungDbManager } from './services/dbService';
import { SamsungZipService, ExtractedPackage } from './services/zipService';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { FilterBar } from './components/FilterBar';
import { ChannelList } from './components/ChannelList';
import { AIOrganizeModal } from './components/AIOrganizeModal';
import { FavoritesModal } from './components/FavoritesModal';
import { MoveToModal } from './components/MoveToModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportSuccessModal } from './components/ExportSuccessModal';
import { StorageService } from './services/storageService';
import { PREDEFINED_CATEGORIES } from './types/category';

export const App: React.FC = () => {
  // App State
  const [extractedPackage, setExtractedPackage] = useState<ExtractedPackage | null>(null);
  const [dbManager, setDbManager] = useState<SamsungDbManager | null>(null);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favoriteLists, setFavoriteLists] = useState<Map<number, string[]>>(new Map());
  const [metadata, setMetadata] = useState<MetadataInfo | undefined>();

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<Channel[][]>([]);

  // Theme & Language
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('channel_editor_theme') as 'dark' | 'light') || 'dark';
  });
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    return (localStorage.getItem('channel_editor_lang') as 'en' | 'ar') || 'en';
  });

  // Settings
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);
  const [isMoveToModalOpen, setIsMoveToModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportSuccessOpen, setIsExportSuccessOpen] = useState(false);
  const [moveToTarget, setMoveToTarget] = useState<Channel | null>(null);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<ChannelFilter>({
    searchQuery: '',
    typeFilter: 'all',
    encryptionFilter: 'all',
    visibilityFilter: 'all',
    favoriteFilter: 'all',
    categoryFilter: 'all',
    satelliteId: 'all',
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('channel_editor_theme', theme);
  }, [theme]);

  // Apply language to document
  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('channel_editor_lang', language);
  }, [language]);

  // Save Undo snapshot
  const saveUndoSnapshot = useCallback((currentChannels: Channel[]) => {
    setUndoStack((prev) => [...prev.slice(-20), JSON.parse(JSON.stringify(currentChannels))]);
  }, []);

  // Undo action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setChannels(prev);
  }, [undoStack]);

  // Close / go back to home screen
  const handleCloseFile = useCallback(() => {
    if (channels.length > 0) {
      const confirmLeave = window.confirm(
        language === 'ar'
          ? 'هل تريد العودة للصفحة الرئيسية؟ ستفقد التغييرات غير المحفوظة.'
          : 'Return to home screen? Any unsaved edits will be cleared.'
      );
      if (!confirmLeave) return;
    }
    StorageService.clearSession();
    setChannels([]);
    setSatellites([]);
    setMetadata(undefined);
    setExtractedPackage(null);
    setDbManager(null);
    setSelectedIds(new Set());
    setUndoStack([]);
  }, [channels.length, language]);

  // Load and Unpack ZIP
  const handleFileSelected = useCallback(async (file: File | Blob, filename: string, persist: boolean = true) => {
    setIsLoading(true);
    try {
      if (persist) {
        const buffer = await file.arrayBuffer();
        StorageService.saveSession(buffer, filename);
      }

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
  }, []);

  // Auto-restore session on refresh
  useEffect(() => {
    let mounted = true;
    (async () => {
      const cached = await StorageService.loadSession();
      if (cached && mounted && channels.length === 0) {
        handleFileSelected(new Blob([cached.buffer]), cached.filename, false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [channels.length, handleFileSelected]);

  // Reorder single channel
  const handleReorder = (sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return;

    saveUndoSnapshot(channels);

    setChannels((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(destinationIndex, 0, movedItem);

      // Re-assign major numbers sequentially starting from 1
      return updated.map((ch, idx) => ({
        ...ch,
        major: idx + 1,
      }));
    });
  };

  // Manual major number edit
  const handleNumberEdit = (srvId: string, newNumber: number) => {
    const targetIdx = channels.findIndex((c) => c.srvId === srvId);
    if (targetIdx === -1) return;

    const destIdx = Math.max(0, Math.min(channels.length - 1, newNumber - 1));
    handleReorder(targetIdx, destIdx);
  };

  // Inline rename
  const handleRename = (srvId: string, newName: string) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (c.srvId === srvId ? { ...c, srvName: newName } : c))
    );
  };

  // Assign category to single channel
  const handleAssignCategory = (srvId: string, category: string) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (c.srvId === srvId ? { ...c, category: category || undefined } : c))
    );
  };

  // Bulk assign category to selected channels
  const handleBulkAssignCategory = (categoryName: string) => {
    if (selectedIds.size === 0) return;
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => {
        if (selectedIds.has(c.srvId)) {
          return { ...c, category: categoryName ? categoryName : undefined };
        }
        return c;
      })
    );
  };

  // Toggle Lock
  const handleToggleLock = (srvId: string) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (c.srvId === srvId ? { ...c, lockMode: !c.lockMode } : c))
    );
  };

  // Toggle Hidden
  const handleToggleHidden = (srvId: string) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (c.srvId === srvId ? { ...c, hidden: !c.hidden } : c))
    );
  };

  // Toggle Favorite
  const handleToggleFavorite = (srvId: string, favNumber: number) => {
    saveUndoSnapshot(channels);

    setChannels((prev) =>
      prev.map((c) => {
        if (c.srvId !== srvId) return c;
        const exists = c.favs.includes(favNumber);
        const newFavs = exists ? c.favs.filter((f) => f !== favNumber) : [...c.favs, favNumber];
        return { ...c, favs: newFavs };
      })
    );

    setFavoriteLists((prev) => {
      const next = new Map(prev);
      const list = next.get(favNumber) ? [...next.get(favNumber)!] : [];
      const idx = list.indexOf(srvId);
      if (idx !== -1) {
        list.splice(idx, 1);
      } else {
        list.push(srvId);
      }
      next.set(favNumber, list);
      return next;
    });
  };

  // Bulk Lock
  const handleBulkLock = (lock: boolean) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (selectedIds.has(c.srvId) ? { ...c, lockMode: lock } : c))
    );
  };

  // Bulk Hide
  const handleBulkHide = (hide: boolean) => {
    saveUndoSnapshot(channels);
    setChannels((prev) =>
      prev.map((c) => (selectedIds.has(c.srvId) ? { ...c, hidden: hide } : c))
    );
  };

  // Bulk Favorite
  const handleBulkFavorite = (favNumber: number) => {
    saveUndoSnapshot(channels);

    setChannels((prev) =>
      prev.map((c) => {
        if (!selectedIds.has(c.srvId)) return c;
        if (!c.favs.includes(favNumber)) {
          return { ...c, favs: [...c.favs, favNumber] };
        }
        return c;
      })
    );

    setFavoriteLists((prev) => {
      const next = new Map(prev);
      const list = next.get(favNumber) ? [...next.get(favNumber)!] : [];
      selectedIds.forEach((srvId) => {
        if (!list.includes(srvId)) list.push(srvId);
      });
      next.set(favNumber, list);
      return next;
    });
  };

  // Bulk Move
  const handleConfirmMove = (destinationPosition: number) => {
    if (selectedIds.size === 0) return;

    saveUndoSnapshot(channels);

    setChannels((prev) => {
      const selectedChannels = prev.filter((c) => selectedIds.has(c.srvId));
      const remainingChannels = prev.filter((c) => !selectedIds.has(c.srvId));

      const targetIdx = Math.max(0, Math.min(remainingChannels.length, destinationPosition - 1));
      remainingChannels.splice(targetIdx, 0, ...selectedChannels);

      return remainingChannels.map((c, idx) => ({
        ...c,
        major: idx + 1,
      }));
    });

    setIsMoveToModalOpen(false);
    setMoveToTarget(null);
  };

  // Multi-select actions
  const handleToggleSelect = (srvId: string, event: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(srvId)) next.delete(srvId);
      else next.add(srvId);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const ids = new Set(filteredChannels.map((c) => c.srvId));
    setSelectedIds(ids);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Apply AI Categorization & Sorting results
  const handleApplyAIResults = (
    removedJunkIds: string[],
    hiddenDuplicateIds: string[],
    newCategoryOrder: { categoryName: string; srvIds: string[] }[]
  ) => {
    saveUndoSnapshot(channels);

    const junkSet = new Set(removedJunkIds);
    const hiddenDupeSet = new Set(hiddenDuplicateIds);
    const channelMap = new Map(channels.map((c) => [c.srvId, c]));

    const reorderedList: Channel[] = [];
    const usedIds = new Set<string>();

    // 1. Add categories in structured order
    newCategoryOrder.forEach((cat) => {
      cat.srvIds.forEach((srvId) => {
        const fullCh = channelMap.get(srvId);
        if (fullCh && !usedIds.has(srvId)) {
          reorderedList.push({
            ...fullCh,
            category: cat.categoryName,
            hidden: hiddenDupeSet.has(srvId) ? true : fullCh.hidden,
          });
          usedIds.add(srvId);
        }
      });
    });

    // 2. Add remaining non-junk channels
    channels.forEach((c) => {
      if (!usedIds.has(c.srvId) && !junkSet.has(c.srvId)) {
        reorderedList.push({
          ...c,
          hidden: hiddenDupeSet.has(c.srvId) ? true : c.hidden,
        });
        usedIds.add(c.srvId);
      }
    });

    // 3. Place junk / test feeds at bottom and hide them
    channels.forEach((c) => {
      if (junkSet.has(c.srvId) && !usedIds.has(c.srvId)) {
        reorderedList.push({
          ...c,
          hidden: true,
        });
        usedIds.add(c.srvId);
      }
    });

    // 4. Sequential major # re-indexing
    const finalChannels = reorderedList.map((ch, idx) => ({
      ...ch,
      major: idx + 1,
    }));

    setChannels(finalChannels);
    setIsAiModalOpen(false);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Distinct categories available in current list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    PREDEFINED_CATEGORIES.forEach((c) => set.add(c.name));
    channels.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      // Search query
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase().trim();
        const matchesName = c.srvName.toLowerCase().includes(q);
        const matchesMajor = c.major.toString() === q || `#${c.major}` === q;
        const matchesFreq = c.freq.toString().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMajor && !matchesFreq && !matchesCat) return false;
      }

      // Type
      if (filter.typeFilter === 'tv' && c.srvType === 2) return false;
      if (filter.typeFilter === 'radio' && c.srvType !== 2) return false;

      // Category filter
      if (filter.categoryFilter && filter.categoryFilter !== 'all') {
        if (filter.categoryFilter === 'uncategorized') {
          if (c.category) return false;
        } else {
          if ((c.category || '').toLowerCase() !== filter.categoryFilter.toLowerCase()) {
            return false;
          }
        }
      }

      // Encryption
      if (filter.encryptionFilter === 'fta' && c.scrambled) return false;
      if (filter.encryptionFilter === 'scrambled' && !c.scrambled) return false;

      // Visibility
      if (filter.visibilityFilter === 'visible' && c.hidden) return false;
      if (filter.visibilityFilter === 'hidden' && !c.hidden) return false;

      // Favorites
      if (filter.favoriteFilter !== 'all') {
        if (!c.favs.includes(filter.favoriteFilter as number)) return false;
      }

      return true;
    });
  }, [channels, filter]);

  // Export back to Samsung ZIP
  const handleExport = async () => {
    if (!dbManager || !extractedPackage) return;

    try {
      // 1. Save modified channels and favorites to SQLite
      dbManager.saveChannels(channels, favoriteLists);

      // 2. Export raw binary buffers
      const exported = dbManager.exportDatabases();

      // 3. Pack into Samsung ZIP archive
      const zipBlob = await SamsungZipService.createExportZip(
        exported.dvbs,
        exported.sat,
        exported.ipsrv,
        metadata?.rawXml,
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
    <div className="min-h-screen flex flex-col w-full selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      
      {/* ── Global Loading Overlay with Animated Spinner ── */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900/90 border border-slate-700/70 rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-sm text-center mx-4">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-5 shadow-lg shadow-cyan-500/25" />
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
              {language === 'ar' ? 'جاري تحميل ومعالجة القنوات...' : 'Loading Channel List...'}
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {language === 'ar' 
                ? 'فك ضغط الملف وقراءة قواعد بيانات SQLite وتحليل الإشارات' 
                : 'Unpacking archive, reading SQLite database & signal telemetry...'}
            </p>
          </div>
        </div>
      )}

      {/* Top Navigation Header */}
      <Header
        channelCount={channels.length}
        metadata={metadata}
        filename={extractedPackage?.filename}
        canUndo={undoStack.length > 0}
        onUndo={handleUndo}
        onGoHome={handleCloseFile}
        onFileSelected={handleFileSelected}
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
          <div className="flex-1 flex flex-col w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-6 space-y-4">
            {/* Filter & Multi-Select Toolbar + Channel List */}
            <div className="flex-1 flex flex-col rounded-3xl overflow-hidden glass border border-slate-800/80 shadow-2xl">
              <FilterBar
                filter={filter}
                onFilterChange={setFilter}
                satellites={satellites}
                categories={availableCategories}
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
                onBulkAssignCategory={handleBulkAssignCategory}
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
                onNumberEdit={handleNumberEdit}
                onAssignCategory={handleAssignCategory}
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
        onUpdateFavorites={(newLists) => {
          saveUndoSnapshot(channels);
          setFavoriteLists(newLists);

          // Sync channel favs array
          setChannels((prev) =>
            prev.map((c) => {
              const favs: number[] = [];
              newLists.forEach((srvIds, favNum) => {
                if (srvIds.includes(c.srvId)) favs.push(favNum);
              });
              return { ...c, favs };
            })
          );
        }}
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

      <ExportSuccessModal
        isOpen={isExportSuccessOpen}
        onClose={() => {
          setIsExportSuccessOpen(false);
          if (exportDownloadUrl) {
            URL.revokeObjectURL(exportDownloadUrl);
            setExportDownloadUrl(null);
          }
        }}
        downloadUrl={exportDownloadUrl}
        filename={extractedPackage?.filename || 'Channel_list.zip'}
        language={language}
      />
    </div>
  );
};
