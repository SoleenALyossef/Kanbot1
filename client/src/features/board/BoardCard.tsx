import { ExternalLink, GripVertical } from 'lucide-react';
import { SortableItem, type GripProps } from '../../components/dnd';
import { LabelChips, PointsBadge, PriorityBadge, TypeIcon } from '../../components/ui/Badges';
import { Menu, type MenuItem } from '../../components/ui/Menu';
import { useI18n } from '../../i18n';
import { STATUSES } from '../../lib/constants';
import { cn } from '../../lib/cn';
import type { Todo, TodoStatus } from '../../types/api';
import { DueChip } from '../todos/TodoMeta';

interface CardViewProps {
  todo: Todo;
  gripProps?: GripProps;
  menuItems?: MenuItem[];
  onOpen?: (todo: Todo) => void;
  overlay?: boolean;
}

export function CardView({ todo, gripProps, menuItems, onOpen, overlay = false }: CardViewProps) {
  const { t } = useI18n();
  return (
    <div className={cn('card', `card-prio-${todo.priority}`, overlay && 'card-overlay')}>
      <div className="card-top">
        <TypeIcon type={todo.type} size={15} />
        <span className="todo-key" dir="ltr">{todo.key}</span>
        <span className="card-top-spacer" />
        {overlay ? null : (
          <>
            <button type="button" className="grip grip-card" {...gripProps} aria-label={t('card.move', { key: todo.key })}>
              <GripVertical size={15} aria-hidden="true" />
            </button>
            {menuItems ? <Menu label={t('row.actionsFor', { key: todo.key })} items={menuItems} /> : null}
          </>
        )}
      </div>
      {overlay ? (
        <span className="card-title">{todo.title}</span>
      ) : (
        <button type="button" className="card-title" onClick={() => onOpen?.(todo)}>
          {todo.title}
        </button>
      )}
      <LabelChips labels={todo.labels} max={2} />
      <div className="card-foot">
        <PriorityBadge priority={todo.priority} />
        <DueChip due={todo.dueDate} done={todo.status === 'done'} />
        <span className="card-foot-spacer" />
        <PointsBadge points={todo.storyPoints} />
      </div>
    </div>
  );
}

interface SortableCardProps {
  todo: Todo;
  onOpen: (todo: Todo) => void;
  onMoveToStatus: (todo: Todo, status: TodoStatus) => void;
}

export function SortableCard({ todo, onOpen, onMoveToStatus }: SortableCardProps) {
  const { t } = useI18n();
  const menuItems: MenuItem[] = [
    { label: t('row.open'), icon: ExternalLink, onSelect: () => onOpen(todo) },
    { separator: true },
    { heading: t('card.moveTo') },
    ...STATUSES.filter((s) => s !== todo.status).map<MenuItem>((s) => ({ label: t(`status.${s}`), onSelect: () => onMoveToStatus(todo, s) })),
  ];
  return (
    <SortableItem id={todo.id} className="card-item">
      {({ gripProps }) => <CardView todo={todo} gripProps={gripProps} menuItems={menuItems} onOpen={onOpen} />}
    </SortableItem>
  );
}
