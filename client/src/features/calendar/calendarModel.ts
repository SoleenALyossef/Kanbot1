import type { Todo } from '../../types/api';

export type CalendarFilter = 'all' | 'open' | 'done';

export interface CalendarSummary {
  scheduled: number;
  overdue: number;
  completed: number;
  undated: number;
}

const PRIORITY_ORDER: Record<Todo['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function filterCalendarTodos(todos: Todo[], filter: CalendarFilter): Todo[] {
  if (filter === 'done') return todos.filter((todo) => todo.status === 'done');
  if (filter === 'open') return todos.filter((todo) => todo.status !== 'done');
  return todos;
}

export function groupCalendarTodos(todos: Todo[]): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  todos.forEach((todo) => {
    if (!todo.dueDate) return;
    map.set(todo.dueDate, [...(map.get(todo.dueDate) ?? []), todo]);
  });
  map.forEach((list, day) => {
    map.set(
      day,
      [...list].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.order - b.order || a.title.localeCompare(b.title),
      ),
    );
  });
  return map;
}

/** Statistics use dueDate for scheduled items and completedAt for finished items. */
export function getCalendarSummary(todos: Todo[], monthKey: string, today: string): CalendarSummary {
  const monthPrefix = `${monthKey}-`;
  return {
    scheduled: todos.filter((todo) => todo.dueDate?.startsWith(monthPrefix)).length,
    overdue: todos.filter((todo) => todo.status !== 'done' && todo.dueDate !== null && todo.dueDate < today).length,
    completed: todos.filter((todo) => todo.status === 'done' && todo.completedAt?.startsWith(monthPrefix)).length,
    undated: todos.filter((todo) => todo.status !== 'done' && todo.dueDate === null).length,
  };
}
