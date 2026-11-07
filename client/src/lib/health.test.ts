import { describe, expect, it } from 'vitest';
import type { Sprint, Todo } from '../types/api';
import { sprintHealth } from './health';

const sprint = { startDate: '2026-01-01', endDate: '2026-01-05', startedAt: null } as Sprint;
const todo = (pts: 1 | 2 | 3 | 5 | 8, done?: string) => ({ storyPoints: pts, status: done ? 'done' : 'todo', completedAt: done ?? null }) as Todo;

describe('sprintHealth', () => {
  it('is on track when work burns as planned', () => {
    const h = sprintHealth(sprint, [todo(5, '2026-01-02T10:00:00Z'), todo(5)], '2026-01-03');
    expect(h?.level).toBe('on');
  });
  it('is behind when nothing is done late in the sprint', () => {
    expect(sprintHealth(sprint, [todo(8), todo(5)], '2026-01-05')?.level).toBe('behind');
  });
  it('is null before the sprint starts', () => {
    expect(sprintHealth(sprint, [todo(5)], '2025-12-30')).toBeNull();
  });
});
