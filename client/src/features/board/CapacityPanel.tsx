import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useI18n } from '../../i18n';
import { ProgressBar } from '../../components/ui/Progress';
import type { Sprint } from '../../types/api';
import type { LiveStats } from '../sprints/CompleteSprintDialog';

/** Points done / remaining / carried over, and the sprint load against your capacity. */
export function CapacityPanel({ projectId, stats, sprints }: { projectId: string; stats: LiveStats; sprints: Sprint[] }) {
  const { t } = useI18n();
  const [override, setOverride] = useLocalStorage<number | null>(`kanbot.capacity.${projectId}`, null);

  const finished = sprints.filter((s) => s.status === 'completed' && s.completedStats);
  const recent = finished.slice(0, 3);
  const avg = recent.length ? Math.round(recent.reduce((n, s) => n + (s.completedStats?.donePoints ?? 0), 0) / recent.length) : null;
  const capacity = override ?? avg;
  const carried = finished[0]?.completedStats?.carriedOver ?? null;
  const remaining = Math.max(0, stats.totalPoints - stats.donePoints);
  const over = capacity !== null && stats.totalPoints > capacity ? stats.totalPoints - capacity : 0;

  return (
    <section className={`panel capacity${over ? ' is-over' : ''}`} aria-label={t('hp.title')}>
      <header className="panel-head">
        <h3>{t('hp.title')}</h3>
        <span className="muted">{capacity === null ? t('hp.none') : override === null ? t('hp.avg') : ''}</span>
      </header>
      <div className="cap-stats">
        <div><strong>{stats.donePoints}</strong><span>{t('hp.done')}</span></div>
        <div><strong>{remaining}</strong><span>{t('hp.remaining')}</span></div>
        <div><strong>{carried ?? '–'}</strong><span>{t('hp.carried')}</span></div>
        <label className="cap-input">
          <span>{t('hp.capacity')}</span>
          <span className="cap-edit">
            <input
              type="number"
              min={1}
              max={500}
              dir="ltr"
              value={capacity ?? ''}
              placeholder="–"
              aria-label={t('hp.set')}
              onChange={(e) => setOverride(e.target.value === '' ? null : Math.max(1, Math.min(500, Number(e.target.value))))}
            />
            {override !== null ? (
              <button type="button" className="icon-btn icon-btn-sm" onClick={() => setOverride(null)} title={t('hp.reset')} aria-label={t('hp.reset')}>
                <RotateCcw size={14} aria-hidden="true" />
              </button>
            ) : null}
          </span>
        </label>
      </div>
      {capacity !== null ? (
        <>
          <ProgressBar value={(stats.totalPoints / capacity) * 100} tone={over ? 'danger' : 'primary'} label={t('hp.within', { used: stats.totalPoints, cap: capacity })} />
          <p className={over ? 'cap-line text-danger' : 'cap-line muted'}>{over ? t('hp.over', { n: over }) : t('hp.within', { used: stats.totalPoints, cap: capacity })}</p>
        </>
      ) : null}
      {over ? (
        <div className="cap-alert" role="alert">
          <AlertTriangle size={16} aria-hidden="true" /> {t('hp.alert', { n: over })}
        </div>
      ) : null}
    </section>
  );
}
