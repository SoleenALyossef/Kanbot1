import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai';
import type { ChatMessage, GenerateTodosRequest, PlanSprintRequest } from '../types/api';
import { invalidateProjectData } from './invalidate';

export const useAiStatus = () =>
  useQuery({ queryKey: ['ai-status'], queryFn: aiApi.status, staleTime: Infinity, retry: false });

export const useGenerateTodos = (projectId: string) =>
  useMutation({ mutationFn: (body: GenerateTodosRequest) => aiApi.generateTodos(projectId, body) });

export const usePlanSprint = (projectId: string) =>
  useMutation({ mutationFn: (body: PlanSprintRequest) => aiApi.planSprint(projectId, body) });

export function useSprintSummary(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => aiApi.summary(sprintId),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export const useChat = (projectId: string) =>
  useMutation({ mutationFn: (messages: ChatMessage[]) => aiApi.chat(projectId, messages) });
