import { useCountUp } from '../../hooks/useCountUp';
import { useI18n } from '../../i18n';
import { STATUSES } from '../../lib/constants';
import type { TodoStatus } from '../../types/api';

/** Todos by status as an animated ring. Segments grow in one after another. */
export function Donut({ counts }: { counts: Record<TodoStatus, number> }) {
  const { t } = useI18n();
  const total = STATUSES.reduce((n, s) => n + counts[s], 0);
  const shown = useCountUp(total);
  const R = 15.9155; // circumference = 100, so dash lengths are percentages
  let offset = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 42 42" role="img" aria-label={t('ov.donutAria')}>
        <circle cx="21" cy="21" r={R} className="donut-track" />
        {total > 0
          ? STATUSES.map((s, i) => {
              const pct = (counts[s] / total) * 100;
              const el = (
                <circle
                  key={s}
                  cx="21"
                  cy="21"
                  r={R}
                  className={`donut-seg donut-${s}`}
                  strokeDasharray={`${Math.max(pct - 0.8, 0)} ${100 - Math.max(pct - 0.8, 0)}`}
                  strokeDashoffset={25 - offset}
                  style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                />
              );
              offset += pct;
              return el;
            })
          : null}
      </svg>
      <div className="donut-center">
        <strong>{shown}</strong>
        <span>{t('ov.todos')}</span>
      </div>
    </div>
  );
}
