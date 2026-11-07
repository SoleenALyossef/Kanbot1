import { GripVertical } from 'lucide-react';
import { SortableItem, type GripProps } from '../../components/dnd';
import { LabelChips, PointsBadge, PriorityBadge, TypeIcon } from '../../components/ui/Badges';
import { Menu, type MenuItem } from '../../components/ui/Menu';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import type { Todo } from '../../types/api';
import { DueChip } from '../todos/TodoMeta';

interface TodoRowViewProps {
  todo: Todo;
  gripProps?: GripProps;
  dragDisabled?: boolean;
  menuItems?: MenuItem[];
  onOpen?: (todo: Todo) => void;
  overlay?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

/** Presentational row. Also used inside the DragOverlay (no menu, no handlers). */
export function TodoRowView({ todo, gripProps, dragDisabled = false, menuItems, onOpen, overlay = false, selected = false, onToggleSelect }: TodoRowViewProps) {
  const { t } = useI18n();
  return (
    <div className={cn('todo-row', overlay && 'todo-row-overlay', selected && 'is-selected')}>
      {overlay ? (
        <span className="grip" aria-hidden="true">
          <GripVertical size={16} />
        </span>
      ) : (
        <button
          type="button"
          className={cn('grip', dragDisabled && 'grip-hidden')}
          {...(dragDisabled ? { tabIndex: -1, 'aria-hidden': true } : gripProps)}
          aria-label={dragDisabled ? undefined : t('row.reorder', { key: todo.key })}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
      )}
      {!overlay && onToggleSelect ? (
        <input
          type="checkbox"
          className="row-check"
          checked={selected}
          onChange={() => onToggleSelect(todo.id)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label={t('row.select', { key: todo.key })}
        />
      ) : null}
      <TypeIcon type={todo.type} />
      <span className="todo-key" dir="ltr">{todo.key}</span>
      {overlay ? (
        <span className="todo-title">{todo.title}</span>
      ) : (
        <button type="button" className="todo-title" onClick={() => onOpen?.(todo)}>
          {todo.title}
        </button>
      )}
      <LabelChips labels={todo.labels} />
      <DueChip due={todo.dueDate} done={todo.status === 'done'} />
      <PriorityBadge priority={todo.priority} />
      <PointsBadge points={todo.storyPoints} />
      {!overlay && menuItems ? <Menu label={t('row.actionsFor', { key: todo.key })} items={menuItems} /> : <span className="menu-gap" />}
    </div>
  );
}

interface SortableTodoRowProps {
  todo: Todo;
  dragDisabled: boolean;
  menuItems: MenuItem[];
  onOpen: (todo: Todo) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

export function SortableTodoRow({ todo, dragDisabled, menuItems, onOpen, selected, onToggleSelect }: SortableTodoRowProps) {
  return (
    <SortableItem id={todo.id} disabled={dragDisabled} className="todo-item row-enter">
      {({ gripProps }) => (
        <TodoRowView todo={todo} gripProps={gripProps} dragDisabled={dragDisabled} menuItems={menuItems} onOpen={onOpen} selected={selected} onToggleSelect={onToggleSelect} />
      )}
    </SortableItem>
  );
}
