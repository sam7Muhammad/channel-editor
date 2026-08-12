import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Channel } from '../types/channel';
import { ChannelRow } from './ChannelRow';
import { translations } from '../utils/i18n';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  onNumberEdit: (srvId: string, newNumber: number) => void;
  language: 'en' | 'ar';
}

const SortableChannelRow = (props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.channel.srvId });

  const dndTransform = CSS.Translate.toString(transform);
  
  const mergedTransform = [
    props.style?.transform,
    dndTransform,
  ].filter(Boolean).join(' ');

  const style = {
    ...props.style,
    transform: mergedTransform,
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'shadow-2xl shadow-cyan-900/50' : ''}>
      <ChannelRow
        {...props}
        dragRef={setActivatorNodeRef}
        dragListeners={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

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
  onNumberEdit,
  language,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  const rowVirtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 20,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = channels.findIndex((c) => c.srvId === active.id);
      const newIndex = channels.findIndex((c) => c.srvId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center space-y-2">
        <p className="text-base font-bold">No channels match your filters</p>
        <p className="text-xs">Try adjusting your search query or filter chips</p>
      </div>
    );
  }

  const channelIds = channels.map((c) => c.srvId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
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
          <SortableContext items={channelIds} strategy={verticalListSortingStrategy}>
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
                  <SortableChannelRow
                    key={channel.srvId}
                    channel={channel}
                    index={virtualRow.index}
                    isSelected={selectedIds.has(channel.srvId)}
                    onToggleSelect={onToggleSelect}
                    onQuickMove={onQuickMove}
                    onToggleLock={onToggleLock}
                    onToggleHidden={onToggleHidden}
                    onToggleFavorite={onToggleFavorite}
                    onRename={onRename}
                    onNumberEdit={onNumberEdit}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
};
