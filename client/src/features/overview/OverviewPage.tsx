import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useCurrentProject } from '../../context/ProjectContext';
import { useTodoDetails } from '../../context/TodoDetailsContext';
import { useBoard, useSprints } from '../../hooks/useSprints';
import { useTodos } from '../../hooks/useTodos';
import { useCountUp } from '../../hooks/useCountUp';
import { useAssistant } from '../../context/AssistantContext';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { PRIORITIES, STATUSES } from '../../lib/constants';
import { daysLeft, percent, todayISO } from '../../lib/format';
import { sprintHealth } from '../../lib/health';
import { flattenColumns, pointsOf, sumPoints } from '../../lib/todoMoves';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, SprintStatusBadge, TypeIcon } from '../../components/ui/Badges';
import { ErrorState, Skeleton } from '../../components/ui/Feedback';
import { ProgressBar } from '../../components/ui/Progress';
import { HealthChip } from '../board/HealthChip';
import { DueChip } from '../todos/TodoMeta';
import type { Todo, TodoStatus } from '../../types/api';
import { Donut } from './Donut';
import { GettingStarted, type Step } from './GettingStarted';

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const shown = useCountUp(value);
  return (
    <div className={`stat ${tone ?? ''}`} data-spotlight>
      <span className="stat-value">{shown}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function OverviewPage() {
  const { t } = useI18n();
  const { timeAgo } = useFormat();
  const project = useCurrentProject();
  const { openTodo } = useTodoDetails();
  const assistant = useAssistant();
  const todosQuery = useTodos(project.id, {});
  const sprintsQuery = useSprints(project.id);
  const activeId = project.stats.activeSprint?.id;
  const board = useBoard(activeId);

  const todos = useMemo(() => todosQuery.data?.todos ?? [], [todosQuery.data]);
  const sprints = useMemo(() => sprintsQuery.data?.sprints ?? [], [sprintsQuery.data]);

  const counts = useMemo(() => {
    const c: Record<TodoStatus, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    todos.forEach((x) => {
      c[x.status] += 1;
    });
    return c;
  }, [todos]);

  const open = todos.filter((x) => x.status !== 'done');
  const byPriority = PRIORITIES.map((p) => ({ p, n: open.filter((x) => x.priority === p).length }));
  const maxPrio = Math.max(1, ...byPriority.map((x) => x.n));
  const pointsDone = sumPoints(todos.filter((x) => x.status === 'done'));
  const pointsSprints = sumPoints(open.filter((x) => x.sprintId !== null));
  const pointsBacklog = sumPoints(open.filter((x) => x.sprintId === null));
  const completion = percent(counts.done, todos.length);

  const dueSoon = open
    .filter((x): x is Todo & { dueDate: string } => !!x.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const recent = [...todos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  const sprintTodos = useMemo(() => (board.data ? flattenColumns(board.data.columns) : []), [board.data]);
  const health = board.data ? sprintHealth(board.data.sprint, sprintTodos, todayISO()) : null;
  const sprintDone = sprintTodos.filter((x) => x.status === 'done');
  const sprintPct = percent(sumPoints(sprintDone), sprintTodos.reduce((n, x) => n + pointsOf(x), 0));

  const steps: Step[] = [
    { key: 'ov.step.todos', done: todos.length > 0 },
    { key: 'ov.step.estimate', done: todos.some((x) => x.storyPoints !== null) },
    { key: 'ov.step.sprint', done: sprints.length > 0 },
    { key: 'ov.step.start', done: sprints.some((s) => s.status === 'active' || s.status === 'completed') },
    { key: 'ov.step.complete', done: sprints.some((s) => s.status === 'completed') },
  ];

  if (todosQuery.isLoading || sprintsQuery.isLoading) return <Skeleton lines={5} height={90} />;
  const error = todosQuery.error ?? sprintsQuery.error;
  if (error) return <ErrorState error={error} title={t('backlog.loadError')} onRetry={() => { void todosQuery.refetch(); void sprintsQuery.refetch(); }} />;

  return (
    <div className="page-wide overview">
      <div className="page-head">
        <div>
          <h2 className="page-title">{t('nav.overview')}</h2>
          <p className="page-sub">{t('ov.sub', { name: project.name })}</p>
        </div>
      </div>

      <div className="stats stagger">
        <Stat label={t('ov.todos')} value={todos.length} />
        <Stat label={t('ov.pointsDone')} value={pointsDone} tone="stat-done" />
        <Stat label={t('ov.pointsSprints')} value={pointsSprints} tone="stat-sprint" />
        <Stat label={t('ov.pointsBacklog')} value={pointsBacklog} />
      </div>

      <div className="overview-grid">
        <section className="panel" aria-label={t('ov.byStatus')}>
          <header className="panel-head">
            <h3>{t('ov.byStatus')}</h3>
            <span className="muted">{t('sd.completion')} {completion}%</span>
          </header>
          <div className="donut-row">
            <Donut counts={counts} />
            <ul className="legend">
              {STATUSES.map((s) => (
                <li key={s}>
                  <span className={`status-dot status-${s}`} aria-hidden="true" />
                  <span>{t(`status.${s}`)}</span>
                  <strong>{counts[s]}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel" aria-label={t('ov.byPriority')}>
          <header className="panel-head">
            <h3>{t('ov.byPriority')}</h3>
          </header>
          <ul className="hbars">
            {byPriority.map(({ p, n }, i) => (
              <li key={p}>
                <PriorityBadge priority={p} />
                <span className="hbar-track">
                  <span className={`hbar hbar-${p}`} style={{ width: `${(n / maxPrio) * 100}%`, animationDelay: `${i * 90}ms` }} />
                </span>
                <strong>{n}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel panel-sprint" aria-label={t('ov.activeSprint')}>
          <header className="panel-head">
            <h3>{t('ov.activeSprint')}</h3>
            {board.data ? <SprintStatusBadge status={board.data.sprint.status} /> : null}
          </header>
          {board.data ? (
            <>
              <div className="sprint-line">
                <strong>{board.data.sprint.name}</strong>
                {health ? <HealthChip health={health} /> : null}
              </div>
              {board.data.sprint.goal ? <p className="muted">{board.data.sprint.goal}</p> : null}
              <ProgressBar value={sprintPct} label={t('sh.pointsAria', { done: sumPoints(sprintDone), total: sprintTodos.reduce((n, x) => n + pointsOf(x), 0) })} />
              <p className="muted">
                {(() => {
                  const n = daysLeft(board.data.sprint.endDate);
                  return n === null ? '' : `${n < 0 ? 0 : n}d · ${sprintPct}%`;
                })()}
              </p>
              <Link to={`/projects/${project.id}/board`} className="btn btn-primary btn-sm">
                <Rocket size={15} aria-hidden="true" />
                <span>{t('sd.openBoard')}</span>
              </Link>
            </>
          ) : (
            <>
              <p className="muted">{t('ov.noActive')}</p>
              <Link to={`/projects/${project.id}/backlog`} className="btn btn-secondary btn-sm">
                <span>{t('ov.startOne')}</span>
              </Link>
              <Button size="sm" variant="ai" onClick={assistant.openPlan}>
                {t('backlog.plan')}
              </Button>
            </>
          )}
        </section>

        <GettingStarted steps={steps} />

        <section className="panel" aria-label={t('ov.dueSoon')}>
          <header className="panel-head">
            <h3>{t('ov.dueSoon')}</h3>
          </header>
          {dueSoon.length === 0 ? (
            <p className="muted">{t('ov.noDue')}</p>
          ) : (
            <ul className="mini-list">
              {dueSoon.map((x) => (
                <li key={x.id}>
                  <TypeIcon type={x.type} size={15} />
                  <button type="button" className="mini-title" onClick={() => openTodo(x)}>
                    {x.title}
                  </button>
                  <DueChip due={x.dueDate} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-label={t('ov.recent')}>
          <header className="panel-head">
            <h3>{t('ov.recent')}</h3>
          </header>
          {recent.length === 0 ? (
            <p className="muted">{t('ov.empty')}</p>
          ) : (
            <ul className="mini-list">
              {recent.map((x, i) => (
                <li key={x.id} style={{ '--i': i } as CSSProperties} className="row-enter">
                  <TypeIcon type={x.type} size={15} />
                  <button type="button" className="mini-title" onClick={() => openTodo(x)}>
                    {x.title}
                  </button>
                  <span className="muted mini-time">{timeAgo(x.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
