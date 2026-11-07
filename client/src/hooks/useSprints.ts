import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sprintsApi } from '../api/sprints';
import type {
  CompleteSprintRequest,
  CreateSprintRequest,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../types/api';
import { invalidateProjectData } from './invalidate';

export const useSprints = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.list(projectId as string),
    enabled: !!projectId,
  });

/** GET /sprints/:id/todos → { sprint, columns } */
export const useBoard = (sprintId: string | undefined) =>
  useQuery({
    queryKey: ['board', sprintId],
    queryFn: () => sprintsApi.board(sprintId as string),
    enabled: !!sprintId,
  });

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'sprint.created', projectId },
    mutationFn: (body: CreateSprintRequest) => sprintsApi.create(projectId, body),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export function useUpdateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'sprint.updated', projectId },
    mutationFn: ({ id, body }: { id: string; body: UpdateSprintRequest }) => sprintsApi.update(id, body),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export function useDeleteSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'sprint.deleted', projectId },
    mutationFn: (id: string) => sprintsApi.remove(id),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export function useStartSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'sprint.started', projectId },
    mutationFn: ({ id, body }: { id: string; body: StartSprintRequest }) => sprintsApi.start(id, body),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}

export function useCompleteSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    meta: { activity: 'sprint.completed', projectId },
    mutationFn: ({ id, body }: { id: string; body: CompleteSprintRequest }) => sprintsApi.complete(id, body),
    onSuccess: () => invalidateProjectData(qc, projectId),
  });
}
