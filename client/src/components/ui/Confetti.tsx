import { useEffect, useMemo, useState, type CSSProperties } from 'react';

const COLORS = ['#3d4df0', '#ffb224', '#17a07a', '#e5484d', '#8a5cf0', '#2d86ee'];

/** One-shot celebration. Decorative only (aria-hidden), removed after the animation. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const [alive, setAlive] = useState(true);
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 53) % 40) / 100,
        duration: 1.6 + ((i * 29) % 12) / 10,
        drift: ((i * 17) % 60) - 30,
        rotate: (i * 97) % 360,
        color: COLORS[i % COLORS.length],
        w: 6 + (i % 4) * 2,
      })),
    [pieces],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setAlive(false), 3400);
    return () => window.clearTimeout(id);
  }, []);

  if (!alive) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.w * 1.6,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}vw`,
              '--rot': `${p.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
