import { useEffect, useState } from 'react';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface TypingOptions {
  /** Keep cycling through the phrases; when false the last phrase stays on screen. */
  loop?: boolean;
  enabled?: boolean;
  typeMs?: number;
  deleteMs?: number;
  pauseMs?: number;
  startDelay?: number;
}

/**
 * Types phrases out letter by letter (and deletes them), returning the text so far.
 * Works per code point, so Arabic text is typed correctly. Static for reduced motion.
 */
export function useTypingLoop(phrases: string[], opts: TypingOptions = {}): string {
  const safePhrases = Array.isArray(phrases) ? phrases.filter((phrase): phrase is string => typeof phrase === 'string') : [];
  const { loop = true, enabled = true, typeMs = 55, deleteMs = 24, pauseMs = 1600, startDelay = 300 } = opts;
  const reduce = prefersReducedMotion();
  const key = safePhrases.join('\u0000');
  const [text, setText] = useState(reduce ? (safePhrases[0] ?? '') : '');

  useEffect(() => {
    if (reduce || !enabled || safePhrases.length === 0) return undefined;
    let cancelled = false;
    let timer = 0;
    let pi = 0;
    let ci = 0;
    let deleting = false;

    const tick = () => {
      if (cancelled) return;
      const chars = Array.from(safePhrases[pi] ?? '');
      if (!deleting) {
        ci += 1;
        setText(chars.slice(0, ci).join(''));
        if (ci >= chars.length) {
          if (!loop && pi === safePhrases.length - 1) return;
          deleting = true;
          timer = window.setTimeout(tick, pauseMs);
          return;
        }
        timer = window.setTimeout(tick, typeMs + Math.round(Math.random() * 40));
      } else {
        ci -= 1;
        setText(chars.slice(0, Math.max(ci, 0)).join(''));
        if (ci <= 0) {
          deleting = false;
          pi = (pi + 1) % safePhrases.length;
          timer = window.setTimeout(tick, 320);
          return;
        }
        timer = window.setTimeout(tick, deleteMs);
      }
    };
    timer = window.setTimeout(tick, startDelay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // `key` stands for the phrases content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loop, enabled, typeMs, deleteMs, pauseMs, startDelay, reduce]);

  return text;
}
