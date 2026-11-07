import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { useI18n, type MsgKey } from '../../i18n';
import { cn } from '../../lib/cn';

export interface Step {
  key: MsgKey;
  done: boolean;
}

/** Progress ring + checklist, derived from the project's real data. */
export function GettingStarted({ steps }: { steps: Step[] }) {
  const { t } = useI18n();
  const done = steps.filter((s) => s.done).length;
  const pct = (done / steps.length) * 100;
  const all = done === steps.length;
  return (
    <section className={cn('panel start', all && 'start-done')} aria-label={t('ov.start.title')}>
      <header className="panel-head">
        <h3>{t('ov.start.title')}</h3>
        <span className="muted">{t('ov.stepsDone', { done, total: steps.length })}</span>
      </header>
      <div className="start-body">
        <svg viewBox="0 0 42 42" className="ring" aria-hidden="true">
          <circle cx="21" cy="21" r="15.9155" className="ring-track" />
          <circle cx="21" cy="21" r="15.9155" className="ring-fill" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" />
        </svg>
        {all ? (
          <p className="start-msg">{t('ov.start.done')}</p>
        ) : (
          <ul className="steps">
            {steps.map((s, i) => (
              <li key={s.key} className={cn('step', s.done && 'is-done')} style={{ '--i': i } as CSSProperties}>
                <span className="step-check">{s.done ? <Check size={13} aria-hidden="true" /> : null}</span>
                <span>{t(s.key)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
