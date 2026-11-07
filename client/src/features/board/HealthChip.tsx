import { Activity } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { SprintHealth } from '../../lib/health';

/** On track / at risk / behind, from the ideal burndown. Colour + icon + text. */
export function HealthChip({ health }: { health: SprintHealth }) {
  const { t } = useI18n();
  return (
    <span className={`health health-${health.level}`} title={t('health.hint', { left: health.leftPct, plan: health.planPct })}>
      <Activity size={14} aria-hidden="true" />
      <span className="sr-only">{t('health.label')}: </span>
      {t(`health.${health.level}`)}
    </span>
  );
}
