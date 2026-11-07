import type {
  CompleteSprintRequest,
  CreateSprintRequest,
  Sprint,
  SprintBoardResponse,
  SprintListResponse,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../types/api';
import { http } from './client';

export const sprintsApi = {
  list: (projectId: string) => http.get<SprintListResponse>(`/projects/${projectId}/sprints`),
  create: (projectId: string, body: CreateSprintRequest) =>
    http.post<{ sprint: Sprint }>(`/projects/${projectId}/sprints`, body),
  board: (id: string) => http.get<SprintBoardResponse>(`/sprints/${id}/todos`),
  update: (id: string, body: UpdateSprintRequest) => http.patch<{ sprint: Sprint }>(`/sprints/${id}`, body),
  remove: (id: string) => http.delete<void>(`/sprints/${id}`),
  start: (id: string, body: StartSprintRequest) => http.post<{ sprint: Sprint }>(`/sprints/${id}/start`, body),
  complete: (id: string, body: CompleteSprintRequest) => http.post<{ sprint: Sprint }>(`/sprints/${id}/complete`, body),
};
