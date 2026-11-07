import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, LineChart, ListTodo, Sparkles } from 'lucide-react';
import { useCurrentProject } from '../../context/ProjectContext';
import { useTodoDetails } from '../../context/TodoDetailsContext';
import { useBoard, useSprints } from '../../hooks/useSprints';
import { useMoveTodo } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { END_OF_LIST, STATUSES } from '../../lib/constants';
import { sprintHealth } from '../../lib/health';
import { todayISO } from '../../lib/format';
import { sumPoints } from '../../lib/todoMoves';
import { SortableList, useSortableLists } from '../../components/dnd';
import { StatusDot } from '../../components/ui/Badges';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/Feedback';
import { CompleteSprintDialog } from '../sprints/CompleteSprintDialog';
import { SprintSummaryCard } from '../sprints/SprintSummaryCard';
import type { Todo, TodoStatus } from '../../types/api';
import { Burndown } from './Burndown';
import { CapacityPanel } from './CapacityPanel';
import { CardView, SortableCard } from './BoardCard';
import { SprintHeader } from './SprintHeader';

const byOrder = (a: Todo, b: Todo) => a.order - b.order;
const EMPTY_LISTS: Record<TodoStatus, Todo[]> = { todo: [], in_progress: [], in_review: [], done: [] };

export default function BoardPage() {
  const { t } = useI18n();
  const project = useCurrentProject();
  const activeRef = project.stats.activeSprint;
  const board = useBoard(activeRef?.id);
  const move = useMoveTodo(project.id);
  const sprintsQuery = useSprints(project.id);
  const { openTodo } = useTodoDetails();
  const [completing, setCompleting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showBurndown, setShowBurndown] = useState(false);

  const lists = useMemo<Record<TodoStatus, Todo[]>>(() => {
    if (!board.data) return EMPTY_LISTS;
    const out = { ...EMPTY_LISTS };
    STATUSES.forEach((s) => {
      out[s] = [...(board.data?.columns[s] ?? [])].sort(byOrder);
    });
    return out;
  }, [board.data]);

  const { ids, todosById, wrap } = useSortableLists({
    lists,
    onMove: ({ todoId, container, index }) => move.mutate({ todoId, move: { status: container as TodoStatus, position: index } }),
    renderOverlay: (todo) => <CardView todo={todo} overlay />,
  });

  const allTodos = useMemo(() => STATUSES.flatMap((s) => lists[s]), [lists]);
  const stats = useMemo(
    () => ({
      totalTodos: allTodos.length,
      doneTodos: lists.done.length,
      totalPoints: sumPoints(allTodos),
      donePoints: sumPoints(lists.done),
    }),
    [allTodos, lists.done],
  );

  const health = useMemo(() => (board.data ? sprintHealth(board.data.sprint, allTodos, todayISO()) : null), [board.data, allTodos]);

  if (!activeRef) {
    return (
      <div className="page-narrow">
        <EmptyState
          icon={Flag}
          title={t('board.noActive.title')}
          description={t('board.noActive.desc')}
          actions={
            <Link to={`/projects/${project.id}/backlog`} className="btn btn-primary">
              <ListTodo size={16} aria-hidden="true" />
              <span>{t('board.goBacklog')}</span>
            </Link>
          }
        />
      </div>
    );
  }
  if (board.isLoading) return <PageLoader />;
  if (board.error || !board.data) return <ErrorState error={board.error} onRetry={() => void board.refetch()} title={t('board.loadError')} />;

  const sprint = board.data.sprint;
  const moveToStatus = (todo: Todo, status: TodoStatus) => move.mutate({ todoId: todo.id, move: { status, position: END_OF_LIST } });

  return (
    <div className="page-board">
      <SprintHeader sprint={sprint} stats={stats} health={health} />

      <CapacityPanel projectId={project.id} stats={stats} sprints={sprintsQuery.data?.sprints ?? []} />

      <div className="board-actions">
        <Button icon={LineChart} onClick={() => setShowBurndown((s) => !s)} aria-expanded={showBurndown}>
          {showBurndown ? t('board.hideBurndown') : t('board.burndown')}
        </Button>
        <Button variant="ai" icon={Sparkles} onClick={() => setShowSummary((s) => !s)} aria-expanded={showSummary}>
          {sprint.summary ? (showSummary ? t('sum.hide') : t('sum.view')) : t('sum.btn')}
        </Button>
        <Button variant="primary" onClick={() => setCompleting(true)}>
          {t('board.complete')}
        </Button>
      </div>

      {showBurndown ? (
        <div className="reveal">
          <Burndown sprint={sprint} todos={allTodos} />
        </div>
      ) : null}
      {showSummary ? (
        <div className="reveal">
          <SprintSummaryCard projectId={project.id} sprint={sprint} />
        </div>
      ) : null}

      {wrap(
        <div className="board" role="group" aria-label={t('board.label')}>
          {STATUSES.map((status, ci) => {
            const items = (ids[status] ?? []).map((id) => todosById.get(id)).filter((x): x is Todo => !!x);
            return (
              <section key={status} className={`column column-${status}`} aria-label={t(`status.${status}`)} style={{ animationDelay: `${ci * 60}ms` }}>
                <header className="column-head">
                  <StatusDot status={status} />
                  <h3>{t(`status.${status}`)}</h3>
                  <span className="column-count">{items.length}</span>
                  <span className="column-points">{t('common.pts', { n: sumPoints(items) })}</span>
                </header>
                <SortableList id={status} itemIds={ids[status] ?? []} className="column-list" aria-label={t('board.columnTodos', { status: t(`status.${status}`) })}>
                  {items.map((todo) => (
                    <SortableCard key={todo.id} todo={todo} onOpen={openTodo} onMoveToStatus={moveToStatus} />
                  ))}
                  {items.length === 0 ? <li className="list-placeholder">{t('board.drop')}</li> : null}
                </SortableList>
              </section>
            );
          })}
        </div>,
      )}

      {completing ? <CompleteSprintDialog projectId={project.id} sprint={sprint} stats={stats} onClose={() => setCompleting(false)} /> : null}
    </div>
  );
}
