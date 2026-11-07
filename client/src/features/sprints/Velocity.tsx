import { useI18n } from '../../i18n';
import type { Sprint } from '../../types/api';

/** Planned vs. completed points of the last completed sprints. */
export function Velocity({ sprints }: { sprints: Sprint[] }) {
  const { t } = useI18n();
  const done = sprints
    .filter((s) => s.status === 'completed' && s.completedStats)
    .slice(0, 8)
    .reverse();
  if (done.length === 0) return null;
  const max = Math.max(1, ...done.map((s) => s.completedStats?.totalPoints ?? 0));

  return (
    <section className="velocity" aria-label={t('vel.title')}>
      <header className="velocity-head">
        <h3>{t('vel.title')}</h3>
        <span className="muted">{t('vel.sub')}</span>
        <span className="burn-legend">
          <i className="lg lg-planned" /> {t('vel.committed')}
          <i className="lg lg-actual" /> {t('vel.done')}
        </span>
      </header>
      <ul className="bars">
        {done.map((s, i) => {
          const total = s.completedStats?.totalPoints ?? 0;
          const got = s.completedStats?.donePoints ?? 0;
          return (
            <li key={s.id} className="bar-group" title={`${s.name}: ${got}/${total}`}>
              <div className="bar-pair">
                <span className="bar bar-planned" style={{ height: `${(total / max) * 100}%`, animationDelay: `${i * 60}ms` }} />
                <span className="bar bar-done" style={{ height: `${(got / max) * 100}%`, animationDelay: `${i * 60 + 80}ms` }} />
              </div>
              <span className="bar-num">{got}</span>
              <span className="bar-name">{s.name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
