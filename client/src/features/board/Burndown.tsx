import { useMemo } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { computeBurndown } from '../../lib/burndown';
import { todayISO } from '../../lib/format';
import type { Sprint, Todo } from '../../types/api';

const H = 230;
const PAD = { l: 40, r: 40, t: 16, b: 34 };

/** Ideal vs. actual remaining points per day (SVG drawn at the real container width). */
export function Burndown({ sprint, todos }: { sprint: Sprint; todos: Todo[] }) {
  const { t } = useI18n();
  const { shortDay } = useFormat();
  const [boxRef, W] = useElementWidth<HTMLDivElement>();
  const data = useMemo(() => computeBurndown(sprint, todos, todayISO()), [sprint, todos]);

  if (!data) return <p className="muted burn-empty">{t('burn.noDates')}</p>;

  const max = Math.max(data.total, 1);
  const n = Math.max(data.days.length - 1, 1);
  const x = (i: number) => PAD.l + ((W - PAD.l - PAD.r) * i) / n;
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / max);
  const line = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const actualPoints = data.actual.map((v, i) => (v === null ? null : ([x(i), y(v)] as const))).filter((p): p is readonly [number, number] => p !== null);
  const actualPath = actualPoints.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const ticks = [...new Set([0, 0.5, 1].map((f) => Math.round(max * f)))];
  const labelEvery = Math.max(1, Math.ceil(data.days.length / Math.max(2, Math.floor(W / 90))));
  const lastPoint = actualPoints[actualPoints.length - 1];

  return (
    <figure className="burndown">
      <figcaption className="burn-head">
        <strong>{t('burn.title')}</strong>
        <span className="muted">{t('burn.left', { n: data.remaining })}</span>
        <span className="burn-legend">
          <i className="lg lg-ideal" /> {t('burn.ideal')}
          <i className="lg lg-actual" /> {t('burn.actual')}
        </span>
      </figcaption>
      <div ref={boxRef} className="burn-box">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('burn.aria', { n: data.remaining })} className="burn-svg" direction="ltr">
          {ticks.map((tv) => (
            <g key={tv}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(tv)} y2={y(tv)} className="burn-grid" />
              <text x={PAD.l - 8} y={y(tv) + 4} textAnchor="end" className="burn-text">
                {tv}
              </text>
            </g>
          ))}
          {data.days.map((d, i) =>
            i % labelEvery === 0 || i === data.days.length - 1 ? (
              <text key={d} x={x(i)} y={H - 10} textAnchor={i === 0 ? 'start' : i === data.days.length - 1 ? 'end' : 'middle'} className="burn-text">
                {shortDay(d)}
              </text>
            ) : null,
          )}
          <path d={line(data.ideal)} className="burn-ideal" />
          {actualPath ? <path d={actualPath} className="burn-actual" pathLength={1} /> : null}
          {lastPoint ? <circle cx={lastPoint[0]} cy={lastPoint[1]} r={5} className="burn-dot" /> : null}
        </svg>
      </div>
    </figure>
  );
}
