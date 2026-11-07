import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAiStatus, usePlanSprint } from '../../hooks/useAi';
import { useCreateSprint } from '../../hooks/useSprints';
import { useTodos } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { pointsOf } from '../../lib/todoMoves';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { ErrorState } from '../../components/ui/Feedback';
import { FormError, TextField } from '../../components/ui/Field';
import { PointsBadge, PriorityBadge, TypeIcon } from '../../components/ui/Badges';
import { ProgressBar } from '../../components/ui/Progress';
import type { AiSource, PlanSprintRequest, Todo } from '../../types/api';

interface PlanResult {
  reasoning: string;
  source: AiSource;
  order: string[];
}

/** AI-3: capacity + focus → suggested goal and backlog todos → create a planned sprint. */
export function PlanSprintDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { t, tp, lang } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const aiMode = useAiStatus().data?.mode;
  const plan = usePlanSprint(projectId);
  const createSprint = useCreateSprint(projectId);
  const todosQuery = useTodos(projectId, {});

  const [capacity, setCapacity] = useState('20');
  const [focus, setFocus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PlanResult | null>(null);
  const [goal, setGoal] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState('');

  const byId = useMemo(() => new Map((todosQuery.data?.todos ?? []).map((x) => [x.id, x])), [todosQuery.data]);
  const suggested = (result?.order ?? []).map((id) => byId.get(id)).filter((x): x is Todo => !!x);
  const chosen = suggested.filter((x) => picked.has(x.id));
  const totalPoints = chosen.reduce((n, x) => n + pointsOf(x), 0);
  const cap = Number(capacity);
  const over = totalPoints > cap;

  function run() {
    if (plan.isPending) return;
    const next: Record<string, string> = {};
    const n = Number(capacity);
    if (!Number.isInteger(n) || n < 1 || n > 200) next.capacity = t('pl.err.cap');
    if (focus.length > 300) next.focus = t('common.err.max300');
    setErrors(next);
    if (Object.keys(next).length) return;

    const body: PlanSprintRequest = { capacity: n };
    const hint = lang === 'ar' && aiMode === 'ai' ? t('ai.replyLang') : '';
    const focusText = `${focus.trim()} ${hint}`.trim().slice(0, 300);
    if (focusText) body.focus = focusText;
    plan.mutate(body, {
      onSuccess: (res) => {
        setResult({ reasoning: res.reasoning, source: res.source, order: res.todoIds });
        setGoal(res.goal);
        setPicked(new Set(res.todoIds));
      },
    });
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function create() {
    if (createSprint.isPending || chosen.length === 0) return;
    setSaveError('');
    try {
      const res = await createSprint.mutateAsync({ todoIds: chosen.map((x) => x.id), ...(goal.trim() ? { goal: goal.trim().slice(0, 300) } : {}) });
      toast.success(tp('pl.created', chosen.length, { name: res.sprint.name }));
      onClose();
      navigate(`/projects/${projectId}/backlog`);
    } catch (err) {
      setSaveError(apiMessage(err, t));
    }
  }

  const reviewing = result !== null;

  return (
    <Dialog
      size={reviewing ? 'lg' : 'md'}
      title={
        <span className="ai-dialog-title">
          <Target size={18} aria-hidden="true" /> {reviewing ? t('pl.review') : t('pl.title')}
          {result?.source === 'mock' ? <span className="mock-badge">{t('ai.mock')}</span> : null}
        </span>
      }
      description={reviewing ? t('pl.reviewDesc') : t('pl.desc')}
      onClose={plan.isPending || createSprint.isPending ? undefined : onClose}
      footer={
        reviewing ? (
          <>
            <Button
              onClick={() => {
                setResult(null);
                plan.reset();
              }}
              disabled={createSprint.isPending}
              className="push-start"
            >
              {t('common.back')}
            </Button>
            <Button onClick={onClose} disabled={createSprint.isPending}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={() => void create()} loading={createSprint.isPending} disabled={chosen.length === 0}>
              {chosen.length === 0 ? t('pl.create') : t('pl.createN', { n: chosen.length })}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={plan.isPending}>
              {t('common.cancel')}
            </Button>
            <Button variant="ai" icon={Sparkles} onClick={run} loading={plan.isPending}>
              {t('pl.btn')}
            </Button>
          </>
        )
      }
    >
      {!reviewing ? (
        <form
          className="form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <TextField label={t('pl.capacity')} type="number" min={1} max={200} value={capacity} onChange={(e) => setCapacity(e.target.value)} error={errors.capacity} hint={t('pl.capHint')} required data-autofocus disabled={plan.isPending} className="field-narrow" dir="ltr" />
          <TextField label={t('pl.focus')} value={focus} onChange={(e) => setFocus(e.target.value)} error={errors.focus} maxLength={300} placeholder={t('pl.focusPlaceholder')} disabled={plan.isPending} />
          {plan.error ? <ErrorState compact error={plan.error} onRetry={run} title={t('pl.error')} /> : null}
          <p className="ai-foot">{t('ai.disclaimer')}</p>
        </form>
      ) : (
        <div className="plan">
          <FormError>{saveError}</FormError>
          <TextField label={t('pl.goal')} value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} />

          <div className="capacity" aria-live="polite">
            <div className="capacity-row">
              <span>
                <strong className={over ? 'text-danger' : undefined}>{t('pl.of', { used: totalPoints, cap })}</strong>
              </span>
              <span className={over ? 'text-danger' : 'muted'}>{over ? t('pl.over', { n: totalPoints - cap }) : t('pl.left', { n: cap - totalPoints })}</span>
            </div>
            <ProgressBar value={cap > 0 ? (totalPoints / cap) * 100 : 0} tone={over ? 'danger' : 'primary'} label={t('pl.aria', { used: totalPoints, cap })} />
          </div>

          {result.reasoning ? <p className="reasoning">{result.reasoning}</p> : null}

          {todosQuery.isLoading ? (
            <p className="muted">{t('pl.loadingBacklog')}</p>
          ) : suggested.length === 0 ? (
            <p className="muted">{t('pl.none')}</p>
          ) : (
            <ul className="pick-list">
              {suggested.map((x) => (
                <li key={x.id}>
                  <label className="pick">
                    <input type="checkbox" checked={picked.has(x.id)} onChange={() => toggle(x.id)} />
                    <TypeIcon type={x.type} />
                    <span className="todo-key" dir="ltr">{x.key}</span>
                    <span className="pick-title">{x.title}</span>
                    <PriorityBadge priority={x.priority} />
                    <PointsBadge points={x.storyPoints} />
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="ai-foot">{t('ai.disclaimer')}</p>
        </div>
      )}
    </Dialog>
  );
}
