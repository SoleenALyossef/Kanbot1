import type { Sprint, Todo } from '../types/api';
import { computeBurndown } from './burndown';

export type HealthLevel = 'on' | 'risk' | 'behind';
export interface SprintHealth {
  level: HealthLevel;
  leftPct: number;
  planPct: number;
}

/** Compares the points still open with the ideal burndown for today. */
export function sprintHealth(sprint: Sprint, todos: Todo[], today: string): SprintHealth | null {
  const data = computeBurndown(sprint, todos, today);
  if (!data || data.total === 0 || today < (data.days[0] ?? today)) return null;
  const found = data.days.indexOf(today);
  const idx = found >= 0 ? found : data.days.length - 1;
  const plan = data.ideal[idx] ?? 0;
  const diff = (data.remaining - plan) / data.total;
  const level: HealthLevel = diff <= 0.05 ? 'on' : diff <= 0.2 ? 'risk' : 'behind';
  return { level, leftPct: Math.round((data.remaining / data.total) * 100), planPct: Math.round((plan / data.total) * 100) };
}
