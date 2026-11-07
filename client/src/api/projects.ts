import type { CreateProjectRequest, Project, ProjectWithStats, UpdateProjectRequest } from '../types/api';
import { http } from './client';

export const projectsApi = {
  list: () => http.get<{ projects: ProjectWithStats[] }>('/projects'),
  get: (id: string) => http.get<{ project: ProjectWithStats }>(`/projects/${id}`),
  create: (body: CreateProjectRequest) => http.post<{ project: Project }>('/projects', body),
  update: (id: string, body: UpdateProjectRequest) => http.patch<{ project: Project }>(`/projects/${id}`, body),
  remove: (id: string) => http.delete<void>(`/projects/${id}`),
};
