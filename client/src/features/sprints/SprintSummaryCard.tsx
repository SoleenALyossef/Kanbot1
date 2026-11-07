import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useSprintSummary } from '../../hooks/useAi';
import { useI18n } from '../../i18n';
import { useFormat } from '../../i18n/useFormat';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/Feedback';
import { Markdown } from '../../components/ui/Markdown';
import type { Sprint, SprintSummary } from '../../types/api';

/** AI-4: shows the saved summary, or lets the user generate / regenerate it. */
export function SprintSummaryCard({ projectId, sprint }: { projectId: string; sprint: Sprint }) {
  const { t } = useI18n();
  const { timeAgo } = useFormat();
  const mutation = useSprintSummary(projectId);
  const [fresh, setFresh] = useState<SprintSummary | null>(null);
  const summary = fresh ?? sprint.summary;

  function generate() {
    mutation.mutate(sprint.id, { onSuccess: (res) => setFresh(res.summary) });
  }

  return (
    <section className="ai-card" aria-labelledby={`summary-${sprint.id}`}>
      <header className="ai-card-head">
        <h3 id={`summary-${sprint.id}`} className="ai-card-title">
          <Sparkles size={16} aria-hidden="true" /> {t('sum.title')}
          {summary?.source === 'mock' ? <span className="mock-badge">{t('ai.mock')}</span> : null}
        </h3>
        {summary ? (
          <Button size="sm" icon={RefreshCw} onClick={generate} loading={mutation.isPending}>
            {t('sum.regenerate')}
          </Button>
        ) : null}
      </header>

      {mutation.error ? <ErrorState compact error={mutation.error} onRetry={generate} title={t('sum.error')} /> : null}

      {summary ? (
        <>
          <div className={mutation.isPending ? 'is-busy' : undefined}>
            <Markdown>{summary.content}</Markdown>
          </div>
          <p className="ai-foot">
            {t('sum.generated', { when: timeAgo(summary.generatedAt) })} {t('ai.disclaimer')}
          </p>
        </>
      ) : !mutation.error ? (
        <div className="ai-card-empty">
          <p>{t('sum.empty')}</p>
          <Button variant="ai" icon={Sparkles} onClick={generate} loading={mutation.isPending}>
            {t('sum.btn')}
          </Button>
          <p className="ai-foot">{t('ai.disclaimer')}</p>
        </div>
      ) : null}
    </section>
  );
}
