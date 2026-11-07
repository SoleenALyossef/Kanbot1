import { useEffect, useRef, useState } from 'react';

/** Animates a number from its previous value to `target` (skipped for reduced motion). */
export function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from.current === target) {
      from.current = target;
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
