import { describe, expect, it } from 'vitest';
import type { Sprint, Todo } from '../types/api';
import { computeBurndown } from './burndown';

const sprint = { startDate: '2026-01-01', endDate: '2026-01-05', startedAt: null } as Sprint;
const todo = (pts: 1 | 2 | 3 | 5, done?: string) => ({ storyPoints: pts, status: done ? 'done' : 'todo', completedAt: done ?? null }) as Todo;

describe('computeBurndown', () => {
  it('returns null without dates', () => {
    expect(computeBurndown({ ...sprint, startDate: null } as Sprint, [], '2026-01-02')).toBeNull();
  });

  it('burns points on the day they were completed and hides the future', () => {
    const data = computeBurndown(sprint, [todo(5, '2026-01-02T10:00:00Z'), todo(3)], '2026-01-03');
    expect(data?.total).toBe(8);
    expect(data?.actual).toEqual([8, 3, 3, null, null]);
    expect(data?.remaining).toBe(3);
    expect(data?.ideal[0]).toBe(8);
    expect(data?.ideal[4]).toBe(0);
  });
});
