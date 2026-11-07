import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCircle2, Timer } from 'lucide-react';
import { useCurrentProject } from '../../context/ProjectContext';
import { useTodoDetails } from '../../context/TodoDetailsContext';
import { useReminderPref } from '../../hooks/useReminders';
import { useTodos } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { addDaysISO, todayISO } from '../../lib/format';
import { PointsBadge, PriorityBadge, TypeIcon } from '../../components/ui/Badges';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { DueChip } from '../todos/TodoMeta';
import type { Todo } from '../../types/api';

function Group({ title, tone, todos, projectId }: { title: string; tone: string; todos: Todo[]; projectId: string }) {
  const { t } = useI18n();
  const { openTodo } = useTodoDetails();
  if (todos.length === 0) return null;
  return (
    <section className={`panel today-group today-${tone}`} aria-label={title}>
      <header className="panel-head">
        <h3>{title}</h3>
        <span className="column-count">{todos.length}</span>
      </header>
      <ul className="today-list stagger">
        {todos.map((x, i) => (
          <li key={x.id} className="today-row" style={{ '--i': Math.min(i, 8) } as CSSProperties}>
            <TypeIcon type={x.type} />
            <span className="todo-key" dir="ltr">{x.key}</span>
            <button type="button" className="todo-title" onClick={() => openTodo(x)}>
              {x.title}
            </button>
            <DueChip due={x.dueDate} />
            <PriorityBadge priority={x.priority} />
            <PointsBadge points={x.storyPoints} />
            <Link to={`/projects/${projectId}/focus?todo=${x.id}`} className="btn btn-secondary btn-sm">
              <Timer size={15} aria-hidden="true" />
              <span>{t('today.focusThis')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TodayPage() {
  const { t } = useI18n();
  const project = useCurrentProject();
  const query = useTodos(project.id, {});
  const rem = useReminderPref();

  const groups = useMemo(() => {
    const today = todayISO();
    const soonEnd = addDaysISO(today, 3);
    const open = (query.data?.todos ?? []).filter((x) => x.status !== 'done');
    const byDue = (a: Todo, b: Todo) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
    return {
      overdue: open.filter((x) => x.dueDate !== null && x.dueDate < today).sort(byDue),
      today: open.filter((x) => x.dueDate === today),
      soon: open.filter((x) => x.dueDate !== null && x.dueDate > today && x.dueDate <= soonEnd).sort(byDue),
      doing: open.filter((x) => x.status === 'in_progress'),
    };
  }, [query.data]);

  const none = !groups.overdue.length && !groups.today.length && !groups.soon.length && !groups.doing.length;

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <h2 className="page-title">{t('today.title')}</h2>
          <p className="page-sub">{t('today.sub')}</p>
        </div>
      </div>

      <section className="panel reminders">
        <div className="reminders-text">
          <h3>{rem.enabled ? <Bell size={17} aria-hidden="true" /> : <BellOff size={17} aria-hidden="true" />} {t('today.reminders')}</h3>
          <p className="muted">
            {rem.permission === 'unsupported'
              ? t('today.reminders.unsupported')
              : rem.permission === 'denied'
                ? t('today.reminders.denied')
                : rem.enabled
                  ? t('today.reminders.on')
                  : t('today.reminders.desc')}
          </p>
        </div>
        {rem.permission === 'unsupported' || rem.permission === 'denied' ? null : rem.enabled ? (
          <Button onClick={rem.disable}>{t('today.reminders.disable')}</Button>
        ) : (
          <Button variant="primary" icon={Bell} onClick={() => void rem.enable()}>
            {t('today.reminders.enable')}
          </Button>
        )}
      </section>

      {query.isLoading ? (
        <Skeleton lines={4} height={64} />
      ) : query.error ? (
        <ErrorState error={query.error} title={t('backlog.loadError')} onRetry={() => void query.refetch()} />
      ) : none ? (
        <EmptyState icon={CheckCircle2} title={t('today.title')} description={t('today.empty')} />
      ) : (
        <>
          <Group title={t('today.overdue')} tone="overdue" todos={groups.overdue} projectId={project.id} />
          <Group title={t('today.dueToday')} tone="due" todos={groups.today} projectId={project.id} />
          <Group title={t('today.soon')} tone="soon" todos={groups.soon} projectId={project.id} />
          <Group title={t('status.in_progress')} tone="doing" todos={groups.doing} projectId={project.id} />
        </>
      )}
    </div>
  );
}
