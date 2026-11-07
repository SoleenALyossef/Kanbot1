import { ArrowDown, ArrowUp, Bookmark, Bug, CheckSquare, Flame, Minus, type LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import type { SprintStatus, StoryPoints, TodoPriority, TodoStatus, TodoType } from '../../types/api';

const PRIORITY_ICON: Record<TodoPriority, LucideIcon> = { low: ArrowDown, medium: Minus, high: ArrowUp, urgent: Flame };
const TYPE_ICON: Record<TodoType, LucideIcon> = { task: CheckSquare, story: Bookmark, bug: Bug };

/** Priority is never colour-only: it always has an icon and a text label. */
export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const { t } = useI18n();
  const Icon = PRIORITY_ICON[priority];
  const label = t(`priority.${priority}`);
  return (
    <span className={cn('badge', `prio prio-${priority}`)} title={t('badge.priority', { label })}>
      <Icon size={13} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function TypeIcon({ type, size = 16 }: { type: TodoType; size?: number }) {
  const { t } = useI18n();
  const Icon = TYPE_ICON[type];
  return (
    <span className={cn('type-icon', `type-${type}`)} title={t(`type.${type}`)}>
      <Icon size={size} aria-hidden="true" />
      <span className="sr-only">{t(`type.${type}`)}</span>
    </span>
  );
}

export function PointsBadge({ points }: { points: StoryPoints | null }) {
  const { t } = useI18n();
  const text = points === null ? t('badge.notEstimated') : t('badge.points', { n: points });
  return (
    <span className={cn('points', points === null && 'points-empty')} title={text}>
      <span aria-hidden="true">{points ?? '–'}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: TodoStatus }) {
  return <span className={cn('status-dot', `status-${status}`)} aria-hidden="true" />;
}

export function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const { t } = useI18n();
  return <span className={cn('pill sprint-pill', `sprint-${status}`)}>{t(`sprint.${status}`)}</span>;
}

export function LabelChips({ labels, max = 3 }: { labels: string[]; max?: number }) {
  if (!labels.length) return null;
  const shown = labels.slice(0, max);
  const extra = labels.length - shown.length;
  return (
    <span className="labels">
      {shown.map((l) => (
        <span key={l} className="label-chip">
          {l}
        </span>
      ))}
      {extra > 0 ? <span className="label-chip label-more">+{extra}</span> : null}
    </span>
  );
}
