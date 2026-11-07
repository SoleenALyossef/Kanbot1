import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/cn';
import type { Todo } from '../types/api';

type Lists = Record<string, Todo[]>;
type IdLists = Record<string, string[]>;

const toIds = (lists: Lists): IdLists => Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, v.map((x) => x.id)]));

export interface DropInfo {
  todoId: string;
  container: string;
  index: number;
  orderedIds: string[];
}

interface UseSortableListsOptions {
  /** { [containerId]: Todo[] } already sorted. */
  lists: Lists;
  /** Called after a drop that changed something. `index` is the final index in the target container. */
  onMove: (drop: DropInfo) => void;
  renderOverlay: (todo: Todo) => ReactNode;
}

/**
 * Multi-container sortable lists (backlog + planned sprints, or the board columns).
 * Render the lists from `ids`, and wrap them with `wrap(children)`.
 */
export function useSortableLists({ lists, onMove, renderOverlay }: UseSortableListsOptions) {
  const signature = JSON.stringify(toIds(lists));
  const [ids, setIds] = useState<IdLists>(() => toIds(lists));
  const [activeId, setActiveId] = useState<string | null>(null);
  const origin = useRef<{ container: string | undefined; index: number }>({ container: undefined, index: -1 });

  // Re-sync with server data whenever it changes and nothing is being dragged.
  useEffect(() => {
    if (activeId === null) setIds(JSON.parse(signature) as IdLists);
  }, [signature, activeId]);

  const todosById = useMemo(() => {
    const map = new Map<string, Todo>();
    Object.values(lists).forEach((list) => list.forEach((x) => map.set(x.id, x)));
    return map;
  }, [lists]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  );

  const findContainer = (id: UniqueIdentifier, state: IdLists = ids): string | undefined =>
    String(id) in state ? String(id) : Object.keys(state).find((key) => state[key]?.includes(String(id)));

  function handleDragStart({ active }: DragStartEvent) {
    const container = findContainer(active.id);
    origin.current = { container, index: container ? (ids[container]?.indexOf(String(active.id)) ?? -1) : -1 };
    setActiveId(String(active.id));
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;
    setIds((prev) => {
      const target = prev[to] ?? [];
      let index: number;
      if (String(over.id) in prev) {
        index = target.length;
      } else {
        const overIndex = target.indexOf(String(over.id));
        const translated = active.rect.current.translated;
        const below = !!translated && translated.top > over.rect.top + over.rect.height / 2;
        index = overIndex + (below ? 1 : 0);
      }
      return {
        ...prev,
        [from]: (prev[from] ?? []).filter((id) => id !== String(active.id)),
        [to]: [...target.slice(0, index), String(active.id), ...target.slice(index)],
      };
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const activeKey = String(active.id);
    const container = findContainer(active.id);
    let next = ids;
    if (over && container) {
      const overContainer = findContainer(over.id);
      if (overContainer === container) {
        const list = ids[container] ?? [];
        const oldIndex = list.indexOf(activeKey);
        const newIndex = String(over.id) in ids ? list.length - 1 : list.indexOf(String(over.id));
        if (oldIndex !== newIndex && newIndex >= 0) next = { ...ids, [container]: arrayMove(list, oldIndex, newIndex) };
      }
    }
    setActiveId(null);
    if (!over || !container) {
      setIds(JSON.parse(signature) as IdLists);
      return;
    }
    const finalList = next[container] ?? [];
    const index = finalList.indexOf(activeKey);
    setIds(next);
    if (container !== origin.current.container || index !== origin.current.index) {
      onMove({ todoId: activeKey, container, index, orderedIds: finalList });
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setIds(JSON.parse(signature) as IdLists);
  }

  const activeTodo = activeId ? todosById.get(activeId) : undefined;

  const wrap = (children: ReactNode) => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 180 }}>{activeTodo ? renderOverlay(activeTodo) : null}</DragOverlay>
    </DndContext>
  );

  return { ids, todosById, activeId, wrap };
}

interface SortableListProps {
  id: string;
  itemIds: string[];
  className?: string;
  children: ReactNode;
  as?: ElementType;
  'aria-label'?: string;
}

/** A droppable list (works even when empty). */
export function SortableList({ id, itemIds, className, children, as: Tag = 'ul', ...rest }: SortableListProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
      <Tag ref={setNodeRef} className={cn(className, isOver && 'is-over')} {...rest}>
        {children}
      </Tag>
    </SortableContext>
  );
}

export interface GripProps {
  [key: string]: unknown;
  tabIndex: number;
}

interface SortableItemProps {
  id: string;
  disabled?: boolean;
  className?: string;
  as?: ElementType;
  children: (a: { gripProps: GripProps; isDragging: boolean }) => ReactNode;
}

/**
 * Wraps one sortable item. Pointer dragging works anywhere on the item;
 * keyboard dragging (Space) lives on the grip handle so Enter can still open the todo.
 */
export function SortableItem({ id, disabled = false, className, children, as: Tag = 'li' }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const { onKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<string, unknown>;
  const style = { transform: CSS.Transform.toString(transform), transition };
  const gripProps: GripProps = { ...attributes, onKeyDown, tabIndex: disabled ? -1 : 0 };
  return (
    <Tag ref={setNodeRef} style={style} className={cn(className, isDragging && 'is-dragging')} {...pointerListeners}>
      {children({ gripProps, isDragging })}
    </Tag>
  );
}
