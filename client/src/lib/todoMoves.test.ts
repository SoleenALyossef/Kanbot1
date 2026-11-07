import { describe, expect, it } from 'vitest';
import type { Todo } from '../types/api';
import { applyMove, groupByStatus } from './todoMoves';

const mk = (id: string, sprintId: string | null, status: Todo['status'], order: number): Todo => ({
  id,
  projectId: 'p',
  sprintId,
  key: `K-${id}`,
  title: id,
  description: '',
  type: 'task',
  status,
  priority: 'medium',
  storyPoints: null,
  labels: [],
  dueDate: null,
  order,
  createdAt: '',
  updatedAt: '',
  completedAt: null,
});

const base = [mk('a', null, 'todo', 0), mk('b', null, 'todo', 1), mk('c', null, 'todo', 2), mk('x', 's1', 'todo', 0), mk('y', 's1', 'in_progress', 0)];
const ids = (list: Todo[]) => list.sort((p, q) => p.order - q.order).map((t) => t.id).join('');

describe('applyMove', () => {
  it('reorders inside the backlog', () => {
    const r = applyMove(base, 'c', { sprintId: null, position: 0 });
    expect(ids(r.filter((t) => t.sprintId === null))).toBe('cab');
  });

  it('moves from backlog into a sprint column at a position', () => {
    const r = applyMove(base, 'a', { sprintId: 's1', position: 0 });
    expect(ids(r.filter((t) => t.sprintId === 's1' && t.status === 'todo'))).toBe('ax');
  });

  it('changing status moves between columns and sets completedAt for done', () => {
    const r = applyMove(base, 'x', { status: 'done', position: 0 });
    const col = groupByStatus(r.filter((t) => t.sprintId === 's1')).done;
    expect(col.map((t) => t.id)).toEqual(['x']);
    expect(col[0]?.completedAt).not.toBeNull();
  });

  it('clamps huge positions to the end', () => {
    const r = applyMove(base, 'a', { sprintId: null, position: 99999 });
    expect(ids(r.filter((t) => t.sprintId === null))).toBe('bca');
  });
});
