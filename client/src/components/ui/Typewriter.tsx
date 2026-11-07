import { useEffect, useState } from 'react';
import { Markdown } from './Markdown';

interface TypewriterProps {
  text: string;
  /** When false the full text is shown immediately (history, reduced motion). */
  animate: boolean;
  onProgress?: () => void;
}

/** Reveals an AI answer progressively, then renders it as Markdown. */
export function Typewriter({ text, animate, onProgress }: TypewriterProps) {
  // Runtime guard: API payloads are untrusted even when TypeScript declares `text` as a string.
  const safeText = typeof text === 'string' ? text : '';
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const instant = !animate || reduce;
  const [count, setCount] = useState(instant ? safeText.length : 0);

  useEffect(() => {
    if (instant) return undefined;
    const step = Math.max(2, Math.ceil(safeText.length / 140));
    const id = window.setInterval(() => {
      setCount((c) => {
        const next = Math.min(safeText.length, c + step);
        if (next >= safeText.length) window.clearInterval(id);
        return next;
      });
      onProgress?.();
    }, 16);
    return () => window.clearInterval(id);
  }, [safeText, instant, onProgress]);

  return <Markdown>{instant || count >= safeText.length ? safeText : safeText.slice(0, count)}</Markdown>;
}
