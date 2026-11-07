import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Options {
  projectId: string | undefined;
  onPalette: () => void;
  onHelp: () => void;
}

const isTyping = (el: Element | null): boolean => {
  const node = el as HTMLElement | null;
  return !!node && (['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName) || node.isContentEditable);
};

/** Ctrl/Cmd+K, ?, c, and "g then p/l/b/s" navigation. Ignored while typing or when a dialog is open. */
export function useGlobalShortcuts({ projectId, onPalette, onHelp }: Options): void {
  const navigate = useNavigate();
  const pendingG = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onPalette();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(document.activeElement) || document.querySelector('[role="dialog"]')) return;

      if (pendingG.current && Date.now() - pendingG.current < 1000) {
        pendingG.current = 0;
        const base = projectId ? `/projects/${projectId}` : null;
        if (e.key === 'p') navigate('/projects');
        else if (e.key === 'l' && base) navigate(`${base}/backlog`);
        else if (e.key === 'b' && base) navigate(`${base}/board`);
        else if (e.key === 's' && base) navigate(`${base}/sprints`);
        else return;
        e.preventDefault();
        return;
      }
      if (e.key === 'g') {
        pendingG.current = Date.now();
      } else if (e.key === '?') {
        e.preventDefault();
        onHelp();
      } else if (e.key === 'c' && projectId) {
        e.preventDefault();
        navigate(`/projects/${projectId}/backlog?new=1`);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [projectId, onPalette, onHelp, navigate]);
}
