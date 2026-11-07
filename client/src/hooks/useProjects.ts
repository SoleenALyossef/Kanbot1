import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import type { CreateProjectRequest, UpdateProjectRequest } from '../types/api';

export const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });

export const useProject = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId as string),
    enabled: !!projectId,
  });

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectRequest) => projectsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProjectRequest }) => projectsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['project', id] });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
