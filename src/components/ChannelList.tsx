import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Channel } from '../types/channel';
import { ChannelRow } from './ChannelRow';
import { translations } from '../utils/i18n';

interface ChannelListProps {
  channels: Channel[];
  selectedIds: Set<string>;
  onToggleSelect: (srvId: string, event: React.MouseEvent) => void;
  onQuickMove: (channel: Channel) => void;
  onToggleLock: (srvId: string) => void;
  onToggleHidden: (srvId: string) => void;
  onToggleFavorite: (srvId: string, favNumber: number) => void;
  onRename: (srvId: string, newName: string) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  language: 'en' | 'ar';
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedIds,
  onToggleSelect,
  onQuickMove,
  onToggleLock,
  onToggleHidden,
  onToggleFavorite,
  onRename,
  onReorder,
  language,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  const [draggedChannel, setDraggedChannel] = useState<Channel | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 20,
  });

  const handleDragStart = (e: React.DragEvent, channel: Channel) => {
    setDraggedChannel(channel);
    e.dataTransfer.setData('text/plain', channel.srvId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedChannel) return;

    const sourceIndex = channels.findIndex((c) => c.srvId === draggedChannel.srvId);
    if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
      onReorder(sourceIndex, targetIndex);
    }
    setDraggedChannel(null);
  };

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center space-y-2">
        <p className="text-base font-bold">No channels match your filters</p>
        <p className="text-xs">Try adjusting your search query or filter chips</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Table Column Headers */}
      <div
        className="flex items-center gap-3.5 px-5 py-3 border-b text-xs font-extrabold uppercase tracking-wider select-none"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="w-4"></div>
        <div className="w-4"></div>
        <div className="w-16 text-right pr-2 text-cyan-400">{t.orderCol}</div>
        <div className="w-4"></div>
        <div className="flex-1 min-w-[200px]">{t.nameCol}</div>
        <div className="hidden lg:block w-36">{t.freqCol}</div>
        <div className="hidden sm:block w-32">{t.signalCol}</div>
        <div className="w-32 text-center">{t.favorites} (1-5)</div>
        <div className="w-24 text-right pr-3">{t.statusCol}</div>
      </div>

      {/* Virtual Scroll Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto min-h-[550px] max-h-[calc(100vh-280px)]"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const channel = channels[virtualRow.index];
            if (!channel) return null;

            return (
              <div
                key={channel.srvId}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ChannelRow
                  channel={channel}
                  index={virtualRow.index}
                  isSelected={selectedIds.has(channel.srvId)}
                  onToggleSelect={onToggleSelect}
                  onQuickMove={onQuickMove}
                  onToggleLock={onToggleLock}
                  onToggleHidden={onToggleHidden}
                  onToggleFavorite={onToggleFavorite}
                  onRename={onRename}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
