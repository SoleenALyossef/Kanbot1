import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
};

/** "YYYY-MM-DD" for today in the user's timezone. */
export const todayISO = (): string => format(new Date(), 'yyyy-MM-dd');

export const addDaysISO = (iso: string, days: number): string =>
  format(addDays(toDate(iso) ?? new Date(), days), 'yyyy-MM-dd');

/** Whole days from today to `end` (negative once the date has passed). */
export function daysLeft(end: string | null | undefined): number | null {
  const d = toDate(end);
  return d ? differenceInCalendarDays(d, new Date()) : null;
}

export type DueState = 'overdue' | 'today' | 'upcoming';

export function dueState(due: string | null | undefined): DueState | null {
  const n = daysLeft(due);
  if (n === null) return null;
  if (n < 0) return 'overdue';
  if (n === 0) return 'today';
  return 'upcoming';
}

export const percent = (done: number, total: number): number => (total > 0 ? Math.round((done / total) * 100) : 0);
