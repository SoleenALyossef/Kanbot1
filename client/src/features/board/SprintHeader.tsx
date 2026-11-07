import { CalendarDays, CheckCheck, Flag } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { useCountUp } from '../../hooks/useCountUp';
import { percent } from '../../lib/format';
import { SprintStatusBadge } from '../../components/ui/Badges';
import { ProgressBar } from '../../components/ui/Progress';
import type { Sprint } from '../../types/api';
import type { SprintHealth } from '../../lib/health';
import type { LiveStats } from '../sprints/CompleteSprintDialog';
import { HealthChip } from './HealthChip';

/** Name, goal, dates and live progress for a sprint (SPR-4). */
export function SprintHeader({ sprint, stats, health }: { sprint: Sprint; stats: LiveStats; health?: SprintHealth | null }) {
  const { t } = useI18n();
  const { formatRange, daysLeftLabel } = useFormat();
  const donePoints = useCountUp(stats.donePoints);
  const doneTodos = useCountUp(stats.doneTodos);
  return (
    <section className="sprint-header" aria-label={t('sh.progress', { name: sprint.name })}>
      <div className="sprint-header-main">
        <div className="sprint-header-title">
          <h2>{sprint.name}</h2>
          <SprintStatusBadge status={sprint.status} />
          {health ? <HealthChip health={health} /> : null}
        </div>
        {sprint.goal ? (
          <p className="sprint-goal">
            <Flag size={15} aria-hidden="true" /> {sprint.goal}
          </p>
        ) : null}
        <p className="sprint-dates">
          <CalendarDays size={15} aria-hidden="true" /> {formatRange(sprint.startDate, sprint.endDate)}
          {sprint.status === 'active' ? <span className="days-left">{daysLeftLabel(sprint.endDate)}</span> : null}
        </p>
      </div>
      <div className="sprint-progress">
        <div className="progress-row">
          <span className="progress-label">
            <CheckCheck size={15} aria-hidden="true" /> {t('sh.points')}
          </span>
          <ProgressBar value={percent(stats.donePoints, stats.totalPoints)} label={t('sh.pointsAria', { done: stats.donePoints, total: stats.totalPoints })} />
          <span className="progress-num">
            {donePoints}/{stats.totalPoints}
          </span>
        </div>
        <div className="progress-row">
          <span className="progress-label">
            <CheckCheck size={15} aria-hidden="true" /> {t('sh.todos')}
          </span>
          <ProgressBar value={percent(stats.doneTodos, stats.totalTodos)} tone="done" label={t('sh.todosAria', { done: stats.doneTodos, total: stats.totalTodos })} />
          <span className="progress-num">
            {doneTodos}/{stats.totalTodos}
          </span>
        </div>
      </div>
    </section>
  );
}
