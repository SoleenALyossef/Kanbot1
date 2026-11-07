import { createContext, useContext } from 'react';
import type { ProjectWithStats } from '../types/api';

export const ProjectContext = createContext<ProjectWithStats | null>(null);

/** The current project (with stats), provided by ProjectLayout. */
export function useCurrentProject(): ProjectWithStats {
  const project = useContext(ProjectContext);
  if (!project) throw new Error('useCurrentProject must be used inside a project route');
  return project;
}
