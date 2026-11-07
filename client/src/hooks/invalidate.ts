import type { QueryClient } from '@tanstack/react-query';

/** Refresh everything that can depend on todos / sprints of a project. */
export function invalidateProjectData(qc: QueryClient, projectId: string): void {
  void qc.invalidateQueries({ queryKey: ['todos', projectId] });
  void qc.invalidateQueries({ queryKey: ['sprints', projectId] });
  void qc.invalidateQueries({ queryKey: ['project', projectId] });
  void qc.invalidateQueries({ queryKey: ['projects'] });
  void qc.invalidateQueries({ queryKey: ['board'] });
}
