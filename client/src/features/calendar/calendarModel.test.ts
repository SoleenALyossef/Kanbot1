import { describe, expect, it } from 'vitest';
import { filterCalendarTodos, getCalendarSummary, groupCalendarTodos } from './calendarModel';
import type { Todo } from '../../types/api';

function todo(overrides: Partial<Todo>): Todo {
  return {
    id: 'todo-1',
    projectId: 'project-1',
    sprintId: null,
    key: 'KAN-1',
    title: 'Example todo',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    storyPoints: null,
    labels: [],
    dueDate: null,
    order: 0,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

describe('calendar model', () => {
  it('filters open and completed todos without changing the source list', () => {
    const rows = [todo({ id: 'open', status: 'in_progress' }), todo({ id: 'done', status: 'done' })];
    expect(filterCalendarTodos(rows, 'open').map((x) => x.id)).toEqual(['open']);
    expect(filterCalendarTodos(rows, 'done').map((x) => x.id)).toEqual(['done']);
    expect(filterCalendarTodos(rows, 'all')).toHaveLength(2);
    expect(rows).toHaveLength(2);
  });

  it('groups dated todos and orders the highest priority first', () => {
    const rows = [
      todo({ id: 'low', dueDate: '2026-11-06', priority: 'low', order: 0 }),
      todo({ id: 'urgent', dueDate: '2026-11-06', priority: 'urgent', order: 2 }),
      todo({ id: 'high', dueDate: '2026-11-06', priority: 'high', order: 1 }),
      todo({ id: 'undated', dueDate: null }),
    ];
    expect(groupCalendarTodos(rows).get('2026-11-06')?.map((x) => x.id)).toEqual(['urgent', 'high', 'low']);
    expect(groupCalendarTodos(rows).has('')).toBe(false);
  });

  it('calculates month schedule, overdue, completion and undated totals separately', () => {
    const rows = [
      todo({ id: 'scheduled', dueDate: '2026-11-12' }),
      todo({ id: 'overdue', dueDate: '2026-10-31' }),
      todo({ id: 'completed', status: 'done', dueDate: '2026-10-29', completedAt: '2026-11-03T12:00:00.000Z' }),
      todo({ id: 'undated', dueDate: null }),
    ];
    expect(getCalendarSummary(rows, '2026-11', '2026-11-06')).toEqual({
      scheduled: 1,
      overdue: 1,
      completed: 1,
      undated: 1,
    });
  });
});
