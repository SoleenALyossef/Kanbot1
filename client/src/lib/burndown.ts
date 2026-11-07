import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { Sprint, Todo } from '../types/api';
import { pointsOf } from './todoMoves';

export interface BurndownData {
  days: string[]; // YYYY-MM-DD
  ideal: number[];
  actual: Array<number | null>; // null for days in the future
  total: number;
  remaining: number;
}

/** Points left at the end of each day of the sprint, based on `completedAt` of the todos. */
export function computeBurndown(sprint: Sprint, todos: Todo[], today: string): BurndownData | null {
  const start = sprint.startDate ?? sprint.startedAt?.slice(0, 10) ?? null;
  const end = sprint.endDate;
  if (!start || !end) return null;
  const startD = parseISO(start);
  const length = differenceInCalendarDays(parseISO(end), startD);
  if (length < 0) return null;

  const total = todos.reduce((n, t) => n + pointsOf(t), 0);
  const days = Array.from({ length: length + 1 }, (_, i) => format(addDays(startD, i), 'yyyy-MM-dd'));
  const ideal = days.map((_, i) => (length === 0 ? 0 : Math.round((total * (1 - i / length)) * 100) / 100));

  const doneEvents = todos
    .filter((t) => t.status === 'done' && t.completedAt)
    .map((t) => ({ day: (t.completedAt as string).slice(0, 10), pts: pointsOf(t) }));

  const actual = days.map((day) => {
    if (day > today) return null;
    const burned = doneEvents.filter((e) => e.day <= day).reduce((n, e) => n + e.pts, 0);
    return Math.max(0, total - burned);
  });

  const last = [...actual].reverse().find((v): v is number => v !== null) ?? total;
  return { days, ideal, actual, total, remaining: last };
}
