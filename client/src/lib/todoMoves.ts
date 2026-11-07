import type { MoveTodoRequest, StoryPoints, Todo, TodoStatus } from '../types/api';
import { STATUSES } from './constants';

const byOrder = (a: Todo, b: Todo) => a.order - b.order;

/**
 * Pure helper used for optimistic updates (BL-5 / SPR-5).
 * `position` is the index in the target list *after* removing the dragged todo,
 * exactly like the server's POST /todos/:id/move contract.
 * A "list" is the backlog, or one status column of one sprint.
 */
export function applyMove(todos: Todo[], todoId: string, move: MoveTodoRequest): Todo[] {
  const current = todos.find((t) => t.id === todoId);
  if (!current) return todos;

  const next: Todo = { ...current };
  if (move.sprintId !== undefined) next.sprintId = move.sprintId;
  if (move.status !== undefined) next.status = move.status;
  next.completedAt = next.status === 'done' ? (current.completedAt ?? new Date().toISOString()) : null;

  const rest = todos.filter((t) => t.id !== todoId);
  const sameList = (t: Todo) => t.sprintId === next.sprintId && (next.sprintId === null || t.status === next.status);

  const target = rest.filter(sameList).sort(byOrder);
  const index = Math.max(0, Math.min(move.position, target.length));
  target.splice(index, 0, next);

  const newOrder = new Map(target.map((t, i) => [t.id, i]));
  const result = rest.map((t) => (newOrder.has(t.id) ? { ...t, order: newOrder.get(t.id) ?? t.order } : t));
  result.push({ ...next, order: newOrder.get(next.id) ?? 0 });
  return result;
}

export type Columns = Record<TodoStatus, Todo[]>;

export function flattenColumns(columns: Columns): Todo[] {
  return STATUSES.flatMap((s) => columns[s] ?? []);
}

export function groupByStatus(todos: Todo[]): Columns {
  const columns: Columns = { todo: [], in_progress: [], in_review: [], done: [] };
  todos.forEach((t) => columns[t.status].push(t));
  STATUSES.forEach((s) => columns[s].sort(byOrder));
  return columns;
}

export const pointsOf = (t: Todo): number => (t.storyPoints as StoryPoints | null) ?? 0;
export const sumPoints = (todos: Todo[]): number => todos.reduce((n, t) => n + pointsOf(t), 0);
