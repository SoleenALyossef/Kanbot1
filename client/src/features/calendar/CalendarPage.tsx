import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  AlertCircle,
  CalendarCheck2,
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
} from 'lucide-react';
import { useCurrentProject } from '../../context/ProjectContext';
import { useTodoDetails } from '../../context/TodoDetailsContext';
import { useTodos } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { cn } from '../../lib/cn';
import { todayISO } from '../../lib/format';
import { PointsBadge, PriorityBadge, TypeIcon } from '../../components/ui/Badges';
import { Button } from '../../components/ui/Button';
import { ErrorState, Skeleton } from '../../components/ui/Feedback';
import { filterCalendarTodos, getCalendarSummary, groupCalendarTodos, type CalendarFilter } from './calendarModel';

const MAX_VISIBLE = 3;

/** Month calendar of todos by due date. Date changes remain in the todo details dialog. */
export default function CalendarPage() {
  const { t, tp, dir } = useI18n();
  const { locale } = useFormat();
  const project = useCurrentProject();
  const { openTodo } = useTodoDetails();
  const query = useTodos(project.id, {});
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [filter, setFilter] = useState<CalendarFilter>('all');

  // Keep the empty fallback stable so memoized calendar selectors do not rerun on every render.
  const allTodos = useMemo(() => query.data?.todos ?? [], [query.data?.todos]);
  const today = todayISO();
  const monthKey = format(month, 'yyyy-MM');
  const summary = useMemo(() => getCalendarSummary(allTodos, monthKey, today), [allTodos, monthKey, today]);
  const visibleTodos = useMemo(() => filterCalendarTodos(allTodos, filter), [allTodos, filter]);
  const byDay = useMemo(() => groupCalendarTodos(visibleTodos), [visibleTodos]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(month, { locale }), end: endOfWeek(endOfMonth(month), { locale }) }),
    [month, locale],
  );
  const weekdays = days.slice(0, 7).map((day) => format(day, 'EEE', { locale }));
  const selectedTodos = byDay.get(selectedDate) ?? [];
  const selectedAsDate = parseISO(selectedDate);
  const rtl = dir === 'rtl';
  const monthLabel = format(month, 'LLLL yyyy', { locale });

  function changeMonth(offset: number) {
    const next = addMonths(month, offset);
    setMonth(next);
    setSelectedDate(format(startOfMonth(next), 'yyyy-MM-dd'));
  }

  function goToToday() {
    const now = new Date();
    setMonth(startOfMonth(now));
    setSelectedDate(today);
  }

  function selectDay(day: Date) {
    if (!isSameMonth(day, month)) setMonth(startOfMonth(day));
    setSelectedDate(format(day, 'yyyy-MM-dd'));
  }

  const filters: { id: CalendarFilter; label: string }[] = [
    { id: 'all', label: t('cal.filter.all') },
    { id: 'open', label: t('cal.filter.open') },
    { id: 'done', label: t('cal.filter.done') },
  ];

  return (
    <div className="page-wide calendar-page">
      <div className="page-head calendar-page-head">
        <div>
          <span className="eyebrow"><CalendarDays size={14} aria-hidden="true" /> {t('cal.eyebrow')}</span>
          <h2 className="page-title">{t('cal.title')}</h2>
          <p className="page-sub">{t('cal.sub')}</p>
        </div>
        <div className="cal-toolbar">
          <div className="cal-filters" role="group" aria-label={t('cal.filter.label')}>
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn('cal-filter', filter === item.id && 'is-active')}
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="cal-nav">
            <button type="button" className="icon-btn cal-nav-btn" onClick={() => changeMonth(-1)} aria-label={t('cal.prev')} title={t('cal.prev')}>
              {rtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <strong className="cal-month" key={format(month, 'yyyy-MM')}>{monthLabel}</strong>
            <button type="button" className="icon-btn cal-nav-btn" onClick={() => changeMonth(1)} aria-label={t('cal.next')} title={t('cal.next')}>
              {rtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <Button size="sm" onClick={goToToday}>{t('cal.today')}</Button>
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton lines={5} height={96} />
      ) : query.error ? (
        <ErrorState error={query.error} title={t('backlog.loadError')} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <section className="cal-summary" aria-label={t('cal.summary')}>
            <article className="cal-stat cal-stat-primary">
              <span className="cal-stat-icon"><CalendarCheck2 size={18} aria-hidden="true" /></span>
              <span className="cal-stat-copy"><strong>{summary.scheduled}</strong><span>{t('cal.stat.scheduled')}</span></span>
            </article>
            <article className="cal-stat cal-stat-danger">
              <span className="cal-stat-icon"><AlertCircle size={18} aria-hidden="true" /></span>
              <span className="cal-stat-copy"><strong>{summary.overdue}</strong><span>{t('cal.stat.overdue')}</span></span>
            </article>
            <article className="cal-stat cal-stat-success">
              <span className="cal-stat-icon"><CircleCheck size={18} aria-hidden="true" /></span>
              <span className="cal-stat-copy"><strong>{summary.completed}</strong><span>{t('cal.stat.done')}</span></span>
            </article>
            <article className="cal-stat cal-stat-neutral">
              <span className="cal-stat-icon"><CalendarOff size={18} aria-hidden="true" /></span>
              <span className="cal-stat-copy"><strong>{summary.undated}</strong><span>{t('cal.stat.undated')}</span></span>
            </article>
          </section>

          <section className="cal-layout" aria-label={t('cal.title')}>
            <div className="cal-main-card">
              <div className="cal-month-head">
                <div>
                  <strong>{monthLabel}</strong>
                  <span>{tp('cal.count', summary.scheduled)}</span>
                </div>
                <div className="cal-legend" aria-label={t('cal.legend')}>
                  <span><i className="legend-dot legend-urgent" />{t('priority.urgent')}</span>
                  <span><i className="legend-dot legend-high" />{t('priority.high')}</span>
                  <span><i className="legend-dot legend-medium" />{t('priority.medium')}</span>
                  <span><i className="legend-dot legend-low" />{t('priority.low')}</span>
                </div>
              </div>

              <div className="cal" key={format(month, 'yyyy-MM')}>
                {weekdays.map((weekday, index) => (
                  <div key={`${weekday}-${index}`} className="cal-weekday">{weekday}</div>
                ))}
                {days.map((day) => {
                  const iso = format(day, 'yyyy-MM-dd');
                  const list = byDay.get(iso) ?? [];
                  const selected = selectedDate === iso;
                  const visible = list.slice(0, MAX_VISIBLE);
                  return (
                    <div
                      key={iso}
                      className={cn('cal-cell', !isSameMonth(day, month) && 'is-out', isToday(day) && 'is-today', selected && 'is-selected')}
                    >
                      <div className="cal-cell-head">
                        <button
                          type="button"
                          className="cal-day-select"
                          onClick={() => selectDay(day)}
                          aria-label={t('cal.selectDate', { date: format(day, 'PPPP', { locale }) })}
                          aria-pressed={selected}
                        >
                          {format(day, 'd')}
                        </button>
                        {list.length > 0 ? <span className="cal-day-count">{list.length}</span> : null}
                      </div>
                      <div className="cal-cell-items">
                        {visible.map((todo) => (
                          <button
                            key={todo.id}
                            type="button"
                            className={cn('cal-chip', `cal-${todo.priority}`, todo.status === 'done' && 'is-done')}
                            onClick={() => openTodo(todo)}
                            title={`${todo.key} — ${todo.title}`}
                          >
                            <span className="cal-chip-key" dir="ltr">{todo.key}</span>
                            <span className="cal-chip-title">{todo.title}</span>
                          </button>
                        ))}
                        {list.length > MAX_VISIBLE ? (
                          <button type="button" className="cal-more" onClick={() => selectDay(day)}>
                            {t('cal.more', { n: list.length - MAX_VISIBLE })}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cal-footnote">
                <span className="cal-footnote-dot" />
                {t('cal.priorityHint')}
              </div>
            </div>

            <aside className="cal-agenda" aria-label={t('cal.selected')}>
              <div className="cal-agenda-head">
                <div>
                  <span className="cal-agenda-kicker">{t('cal.selected')}</span>
                  <h3>{format(selectedAsDate, 'EEEE', { locale })}</h3>
                  <p>{format(selectedAsDate, 'd MMMM yyyy', { locale })}</p>
                </div>
                <span className="cal-agenda-total">{selectedTodos.length}</span>
              </div>
              {selectedTodos.length === 0 ? (
                <div className="cal-agenda-empty">
                  <span><CalendarDays size={21} aria-hidden="true" /></span>
                  <strong>{t('cal.noDayTasks')}</strong>
                  <p>{t('cal.noDayTasksHint')}</p>
                </div>
              ) : (
                <ul className="cal-agenda-list">
                  {selectedTodos.map((todo) => (
                    <li key={todo.id}>
                      <button type="button" className="cal-agenda-item" onClick={() => openTodo(todo)}>
                        <TypeIcon type={todo.type} />
                        <span className="cal-agenda-item-copy">
                          <span className="cal-agenda-item-key" dir="ltr">{todo.key}</span>
                          <strong>{todo.title}</strong>
                          <span className="cal-agenda-item-meta">
                            <PriorityBadge priority={todo.priority} />
                            <PointsBadge points={todo.storyPoints} />
                            {todo.status === 'done' ? <span className="cal-done-label">{t('status.done')}</span> : null}
                          </span>
                        </span>
                        <ChevronRight className="cal-agenda-arrow" size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </section>

          {summary.undated > 0 ? (
            <div className="cal-undated-note">
              <CalendarOff size={16} aria-hidden="true" />
              <span>{tp('cal.undated', summary.undated)}</span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
