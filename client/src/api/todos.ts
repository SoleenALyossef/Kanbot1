import type {
  BulkCreateTodosResponse,
  CreateTodoRequest,
  MoveTodoRequest,
  Todo,
  TodoListQuery,
  TodoListResponse,
  UpdateTodoRequest,
} from '../types/api';
import { buildQuery, http } from './client';

export const todosApi = {
  list: (projectId: string, filters: TodoListQuery = {}) =>
    http.get<TodoListResponse>(`/projects/${projectId}/todos${buildQuery({ ...filters })}`),
  create: (projectId: string, body: CreateTodoRequest) => http.post<{ todo: Todo }>(`/projects/${projectId}/todos`, body),
  bulkCreate: (projectId: string, todos: CreateTodoRequest[]) =>
    http.post<BulkCreateTodosResponse>(`/projects/${projectId}/todos/bulk`, { todos }),
  update: (id: string, body: UpdateTodoRequest) => http.patch<{ todo: Todo }>(`/todos/${id}`, body),
  move: (id: string, body: MoveTodoRequest) => http.post<{ todo: Todo }>(`/todos/${id}/move`, body),
  remove: (id: string) => http.delete<void>(`/todos/${id}`),
};
