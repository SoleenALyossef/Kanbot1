import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Pencil, Play, Trash2 } from 'lucide-react';
import { SortableList } from '../../components/dnd';
import { SprintStatusBadge } from '../../components/ui/Badges';
import { Button } from '../../components/ui/Button';
import { Menu } from '../../components/ui/Menu';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import type { Sprint } from '../../types/api';

interface Props {
  sprint: Sprint;
  itemIds: string[];
  count: number;
  points: number;
  blockedBy: Sprint | null;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
}

/** A collapsible planned sprint above the backlog (SPR-1 … SPR-3). */
export function SprintSection({ sprint, itemIds, count, points, blockedBy, onStart, onEdit, onDelete, children }: Props) {
  const { t, tp } = useI18n();
  const { formatRange } = useFormat();
  const [open, setOpen] = useState(true);
  const bodyId = `sprint-body-${sprint.id}`;

  return (
    <section className="list-section sprint-section" aria-label={sprint.name}>
      <header className="section-head">
        <button type="button" className="collapse" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={bodyId} aria-label={open ? t('ss.collapse', { name: sprint.name }) : t('ss.expand', { name: sprint.name })}>
          {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" className="flip-rtl" />}
        </button>
        <div className="section-title">
          <h3>{sprint.name}</h3>
          <SprintStatusBadge status={sprint.status} />
          <span className="muted">{formatRange(sprint.startDate, sprint.endDate)}</span>
        </div>
        <div className="section-stats">
          {tp('count.todos', count)} · {t('common.pts', { n: points })}
        </div>
        <Button size="sm" variant="primary" icon={Play} onClick={onStart} disabled={!!blockedBy} title={blockedBy ? t('ss.blocked', { name: blockedBy.name }) : undefined}>
          {t('ss.start')}
        </Button>
        <Menu
          label={t('projects.actionsFor', { name: sprint.name })}
          items={[
            { label: t('ss.edit'), icon: Pencil, onSelect: onEdit },
            { separator: true },
            { label: t('ss.delete'), icon: Trash2, danger: true, onSelect: onDelete },
          ]}
        />
      </header>
      {open ? (
        <div id={bodyId}>
          {sprint.goal ? <p className="section-goal">{t('ss.goal', { goal: sprint.goal })}</p> : null}
          {blockedBy ? <p className="section-note">{t('ss.blockedNote', { name: blockedBy.name })}</p> : null}
          <SortableList id={sprint.id} itemIds={itemIds} className="todo-list" aria-label={t('ss.todosIn', { name: sprint.name })}>
            {children}
            {itemIds.length === 0 ? <li className="list-placeholder">{t('ss.dropHere', { name: sprint.name })}</li> : null}
          </SortableList>
        </div>
      ) : null}
    </section>
  );
}
