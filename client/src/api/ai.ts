import type {
  AiStatusResponse,
  ChatMessage,
  ChatResponse,
  GenerateTodosRequest,
  GenerateTodosResponse,
  PlanSprintRequest,
  PlanSprintResponse,
  SprintSummaryResponse,
} from '../types/api';
import { http } from './client';

export const aiApi = {
  status: () => http.get<AiStatusResponse>('/ai/status'),
  chat: (projectId: string, messages: ChatMessage[]) =>
    http.post<ChatResponse>(`/projects/${projectId}/ai/chat`, { messages }),
  generateTodos: (projectId: string, body: GenerateTodosRequest) =>
    http.post<GenerateTodosResponse>(`/projects/${projectId}/ai/generate-todos`, body),
  planSprint: (projectId: string, body: PlanSprintRequest) =>
    http.post<PlanSprintResponse>(`/projects/${projectId}/ai/plan-sprint`, body),
  summary: (sprintId: string) => http.post<SprintSummaryResponse>(`/sprints/${sprintId}/ai/summary`, {}),
};
