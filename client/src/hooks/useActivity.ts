import { useMemo } from 'react';
import { ACTIVITY_KEY, type ActivityEvent } from '../lib/activity';
import { useLocalStorage } from './useLocalStorage';

export function useActivity(projectId: string) {
  const [all, setAll] = useLocalStorage<ActivityEvent[]>(ACTIVITY_KEY, []);
  const events = useMemo(() => all.filter((e) => e.projectId === projectId), [all, projectId]);
  const clear = () => setAll((prev) => prev.filter((e) => e.projectId !== projectId));
  return { events, clear };
}
