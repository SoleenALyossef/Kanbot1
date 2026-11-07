import type { TodoTemplate } from '../lib/templates';
import { useLocalStorage } from './useLocalStorage';

/** User-made templates, kept in this browser. */
export function useTemplates() {
  const [custom, setCustom] = useLocalStorage<TodoTemplate[]>('kanbot.templates', []);
  const add = (tpl: Omit<TodoTemplate, 'id'>) => setCustom((prev) => [{ ...tpl, id: `c-${Date.now()}` }, ...prev].slice(0, 30));
  const remove = (id: string) => setCustom((prev) => prev.filter((x) => x.id !== id));
  return { custom, add, remove };
}
