import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todosApi } from '../api/todos';
import { useToast } from '../context/ToastContext';
import { apiMessage } from '../i18n/apiMessage';
import { useI18n } from '../i18n';
import { END_OF_LIST } from '../lib/constants';
import { applyMove, flattenColumns, groupByStatus } from '../lib/todoMoves';
import type {
  CreateTodoRequest,
  MoveTodoRequest,
  SprintBoardResponse,
  TodoListQuery,
  TodoListResponse,
  TodoPriority,
  UpdateTodoRequest,
} from '../types/api';
import { invalidateProjectData } from './invalidate';

export const useTodos = (projectId: string | undefined, filters: TodoListQuery = {}) =>
  useQuery({
    queryKey: ['todos', projectId, filters],
    queryFn: () => todosApi.list(projectId as string, filters),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });

export function useCreateTodo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'todo.created', projectId },
    mutationFn: (body: CreateTodoRequest) => todosApi.create(projectId, body),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export function useBulkCreateTodos(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'todo.bulk', projectId },
    mutationFn: (todos: CreateTodoRequest[]) => todosApi.bulkCreate(projectId, todos),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export function useUpdateTodo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'todo.updated', projectId },
    mutationFn: ({ id, body }: { id: string; body: UpdateTodoRequest }) => todosApi.update(id, body),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export function useDeleteTodo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'todo.deleted', projectId },
    mutationFn: (id: string) => todosApi.remove(id),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

/** Drag and drop / menu moves with optimistic updates and rollback (BL-5, SPR-5). */
export function useMoveTodo(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useI18n();
  const mutation = useMutation({
    meta: { activity: 'todo.moved', projectId },
    mutationFn: ({ todoId, move }: { todoId: string; move: MoveTodoRequest; silent?: boolean }) => todosApi.move(todoId, move),
    onMutate: async ({ todoId, move }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ['todos', projectId] }),
        qc.cancelQueries({ queryKey: ['board'] }),
      ]);
      const previous = [
        ...qc.getQueriesData({ queryKey: ['todos', projectId] }),
        ...qc.getQueriesData({ queryKey: ['board'] }),
      ];

      // Remember where the todo came from, so the move can be undone.
      const source = qc
        .getQueriesData<TodoListResponse>({ queryKey: ['todos', projectId] })
        .map(([, data]) => data?.todos ?? [])
        .find((list) => list.some((x) => x.id === todoId));
      const current = source?.find((x) => x.id === todoId);
      const origin =
        current && source
          ? {
              key: current.key,
              sprintId: current.sprintId,
              status: current.status,
              position: source
                .filter((x) => x.sprintId === current.sprintId && (current.sprintId === null || x.status === current.status))
                .sort((a, b) => a.order - b.order)
                .findIndex((x) => x.id === todoId),
            }
          : null;

      qc.setQueriesData<TodoListResponse>({ queryKey: ['todos', projectId] }, (old) =>
        old ? { ...old, todos: applyMove(old.todos, todoId, move) } : old,
      );
      qc.setQueriesData<SprintBoardResponse>({ queryKey: ['board'] }, (old) => {
        if (!old) return old;
        const flat = flattenColumns(old.columns);
        if (!flat.some((x) => x.id === todoId)) return old;
        const moved = applyMove(flat, todoId, move).filter((x) => x.sprintId === old.sprint.id);
        return { ...old, columns: groupByStatus(moved) };
      });
      return { previous, origin };
    },
    onSuccess: (_data, vars, ctx) => {
      if (vars.silent || !ctx?.origin) return;
      const { key, ...back } = ctx.origin;
      toast.action(t('move.done', { key }), t('common.undo'), () =>
        mutation.mutate({ todoId: vars.todoId, move: { ...back, position: Math.max(0, back.position) }, silent: true }),
      );
    },
    onError: (err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(t('move.error', { msg: apiMessage(err, t) }));
    },
    onSettled: () => invalidateProjectData(qc, projectId),
  });
  return mutation;
}

export type BulkAction =
  | { kind: 'move'; sprintId: string | null }
  | { kind: 'priority'; priority: TodoPriority }
  | { kind: 'delete' };

/** Applies one action to many todos. Moves run one after another so the order stays predictable. */
export function useBulkAction(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: BulkAction }) => {
      if (action.kind === 'move') {
        for (const id of ids) await todosApi.move(id, { sprintId: action.sprintId, position: END_OF_LIST });
      } else if (action.kind === 'priority') {
        await Promise.all(ids.map((id) => todosApi.update(id, { priority: action.priority })));
      } else {
        await Promise.all(ids.map((id) => todosApi.remove(id)));
      }
      return ids.length;
    },
    onSettled: () => invalidateProjectData(qc, projectId),
  });
}
