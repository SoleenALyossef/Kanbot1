import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useCompleteSprint, useSprints } from '../../hooks/useSprints';
import { useSprintSummary } from '../../hooks/useAi';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormError } from '../../components/ui/Field';
import type { Sprint } from '../../types/api';

export interface LiveStats {
  totalTodos: number;
  doneTodos: number;
  totalPoints: number;
  donePoints: number;
}

interface Props {
  projectId: string;
  sprint: Sprint;
  stats: LiveStats;
  onClose: () => void;
}

/** SPR-6 */
export function CompleteSprintDialog({ projectId, sprint, stats, onClose }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const complete = useCompleteSprint(projectId);
  const summarize = useSprintSummary(projectId);
  const sprints = useSprints(projectId);
  const [destination, setDestination] = useState('backlog');
  const [wantSummary, setWantSummary] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const notDone = stats.totalTodos - stats.doneTodos;
  const options = useMemo(
    () => [
      { value: 'backlog', label: t('td.backlogOpt'), hint: t('cs.backlogHint') },
      ...(sprints.data?.sprints ?? [])
        .filter((s) => s.status === 'planned')
        .map((s) => ({ value: s.id, label: s.name, hint: t('cs.sprintHint') })),
    ],
    [sprints.data, t],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (working) return;
    setWorking(true);
    setError('');
    try {
      await complete.mutateAsync({ id: sprint.id, body: { moveUnfinishedTo: destination } });
    } catch (err) {
      setError(apiMessage(err, t));
      setWorking(false);
      return;
    }
    if (wantSummary) {
      try {
        await summarize.mutateAsync(sprint.id);
      } catch (err) {
        toast.error(t('cs.summaryFailed', { msg: apiMessage(err, t) }));
      }
    }
    toast.success(t('cs.completed', { name: sprint.name }));
    onClose();
    const perfect = stats.totalTodos > 0 && notDone === 0;
    navigate(`/projects/${projectId}/sprints/${sprint.id}`, { state: { celebrate: perfect } });
  }

  return (
    <Dialog
      title={t('cs.title', { name: sprint.name })}
      onClose={working ? undefined : onClose}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={working}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="complete-form" loading={working} disabled={notDone > 0 && sprints.isLoading}>
            {t('cs.btn')}
          </Button>
        </>
      }
    >
      <form id="complete-form" onSubmit={onSubmit} className="form">
        <FormError>{error}</FormError>
        <div className="complete-stats">
          <div>
            <span className="stat-num">{stats.doneTodos}</span>
            <span className="stat-label">{t('cs.done')}</span>
          </div>
          <div>
            <span className="stat-num">{notDone}</span>
            <span className="stat-label">{t('cs.notDone')}</span>
          </div>
        </div>
        <p className="complete-points">{t('cs.points', { done: stats.donePoints, total: stats.totalPoints })}</p>
        {notDone > 0 && sprints.isLoading ? <p className="muted">{t('cs.loadingDestinations')}</p> : null}
        {notDone > 0 && sprints.error ? (
          <div className="complete-destination-error" role="alert">
            <span>{t('cs.destinationLoadError')}</span>
            <Button size="sm" onClick={() => void sprints.refetch()}>{t('common.tryAgain')}</Button>
          </div>
        ) : null}
        {notDone === 0 ? (
          <p className="complete-all-done">{t('cs.allDone')}</p>
        ) : !sprints.isLoading ? (
          <fieldset className="complete-destination">
            <legend>{t('cs.whereLabel')}</legend>
            <div className="complete-destination-options">
              {options.map((option) => (
                <label key={option.value} className={`complete-destination-option${destination === option.value ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="unfinished-destination"
                    value={option.value}
                    checked={destination === option.value}
                    onChange={() => setDestination(option.value)}
                  />
                  <span className="complete-radio-mark" aria-hidden="true" />
                  <span className="complete-destination-copy">
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className="complete-summary-option">
          <label className="check">
            <input type="checkbox" checked={wantSummary} onChange={(e) => setWantSummary(e.target.checked)} />
            <span>{t('cs.summary')}</span>
          </label>
          <p>{t('cs.summaryHint')}</p>
        </div>
      </form>
    </Dialog>
  );
}
