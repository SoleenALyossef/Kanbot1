import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, KanbanSquare, ListTodo } from 'lucide-react';
import { ApiError } from '../../api/client';
import { useCurrentProject } from '../../context/ProjectContext';
import { useTodoDetails } from '../../context/TodoDetailsContext';
import { useToast } from '../../context/ToastContext';
import { useBoard } from '../../hooks/useSprints';
import { useCountUp } from '../../hooks/useCountUp';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { STATUSES } from '../../lib/constants';
import { downloadText, sprintToMarkdown } from '../../lib/export';
import { percent } from '../../lib/format';
import { PointsBadge, PriorityBadge, StatusDot, TypeIcon } from '../../components/ui/Badges';
import { Button } from '../../components/ui/Button';
import { Confetti } from '../../components/ui/Confetti';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import NotFoundPage from '../layout/NotFoundPage';
import { SprintHeader } from '../board/SprintHeader';
import { SprintSummaryCard } from './SprintSummaryCard';

function Tile({ value, suffix = '', total, label, hint }: { value: number | null; suffix?: string; total?: number; label: string; hint?: string }) {
  const shown = useCountUp(value ?? 0);
  return (
    <div className="tile spot" data-spotlight>
      <span className="tile-value">
        {value === null ? '–' : `${shown}${total !== undefined ? `/${total}` : ''}${suffix}`}
      </span>
      <span className="tile-label">{label}</span>
      {hint ? <span className="tile-hint">{hint}</span> : null}
    </div>
  );
}

export default function SprintDetailPage() {
  const { t } = useI18n();
  const { formatRange } = useFormat();
  const toast = useToast();
  const project = useCurrentProject();
  const { sprintId } = useParams<{ sprintId: string }>();
  const location = useLocation();
  const query = useBoard(sprintId);
  const { openTodo } = useTodoDetails();
  const celebrate = (location.state as { celebrate?: boolean } | null)?.celebrate === true;

  if (query.isLoading) return <PageLoader />;
  const status = query.error instanceof ApiError ? query.error.status : 0;
  if (status === 404 || status === 400) return <NotFoundPage what="sprint" />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} title={t('sd.loadError')} />;

  const { sprint, columns } = query.data;
  if (sprint.projectId !== project.id) return <NotFoundPage what="sprint" />;

  const completed = sprint.status === 'completed' && sprint.completedStats;
  const stats = completed ? completed : sprint.stats;
  const empty = STATUSES.every((s) => (columns[s] ?? []).length === 0);

  function exportMarkdown() {
    downloadText(`${sprint.name.replace(/\s+/g, '-').toLowerCase()}.md`, sprintToMarkdown(sprint, columns, t, formatRange(sprint.startDate, sprint.endDate)), 'text/markdown');
    toast.success(t('export.done'));
  }

  return (
    <div className="page-wide">
      {celebrate ? <Confetti /> : null}
      <Link to={`/projects/${project.id}/sprints`} className="back-link">
        <ArrowLeft size={16} aria-hidden="true" className="flip-rtl" /> {t('sd.all')}
      </Link>

      <SprintHeader sprint={sprint} stats={stats} />
      {celebrate ? <p className="celebrate" role="status">{t('sd.celebrate')}</p> : null}

      <div className="tiles">
        <Tile value={stats.doneTodos} total={stats.totalTodos} label={t('sd.completed')} />
        <Tile value={stats.donePoints} total={stats.totalPoints} label={t('sd.points')} />
        <Tile value={completed ? completed.carriedOver : null} label={t('sd.carried')} hint={completed ? undefined : t('sd.carriedHint')} />
        <Tile value={percent(stats.donePoints, stats.totalPoints)} suffix="%" label={t('sd.completion')} hint={t('sd.byPoints')} />
      </div>

      <div className="detail-actions">
        {sprint.status === 'active' ? (
          <Link to={`/projects/${project.id}/board`} className="btn btn-primary">
            <KanbanSquare size={16} aria-hidden="true" />
            <span>{t('sd.openBoard')}</span>
          </Link>
        ) : null}
        {sprint.status === 'planned' ? (
          <Link to={`/projects/${project.id}/backlog`} className="btn btn-secondary">
            <ListTodo size={16} aria-hidden="true" />
            <span>{t('sd.planBacklog')}</span>
          </Link>
        ) : null}
        <Link to={`/projects/${project.id}/sprints/${sprint.id}/report`} className="btn btn-secondary">
          <FileText size={16} aria-hidden="true" />
          <span>{t('sd.report')}</span>
        </Link>
        <Button icon={Download} onClick={exportMarkdown}>
          {t('sd.export')}
        </Button>
      </div>

      {sprint.status !== 'planned' ? <SprintSummaryCard projectId={project.id} sprint={sprint} /> : null}

      <section className="detail-todos" aria-label={t('sd.todos')}>
        <h3 className="section-heading">{t('sd.todos')}</h3>
        {empty ? (
          <p className="muted">{t('sd.noTodos')}</p>
        ) : (
          STATUSES.map((s) =>
            (columns[s] ?? []).length ? (
              <div key={s} className="status-group">
                <h4 className="status-group-title">
                  <StatusDot status={s} /> {t(`status.${s}`)} <span className="column-count">{columns[s].length}</span>
                </h4>
                <ul className="todo-list">
                  {columns[s].map((todo) => (
                    <li key={todo.id} className="todo-item">
                      <div className="todo-row">
                        <TypeIcon type={todo.type} />
                        <span className="todo-key" dir="ltr">{todo.key}</span>
                        <button type="button" className="todo-title" onClick={() => openTodo(todo)}>
                          {todo.title}
                        </button>
                        <PriorityBadge priority={todo.priority} />
                        <PointsBadge points={todo.storyPoints} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )
        )}
      </section>
    </div>
  );
}
