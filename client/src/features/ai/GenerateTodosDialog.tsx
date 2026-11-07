import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAiStatus, useGenerateTodos } from '../../hooks/useAi';
import { useBulkCreateTodos } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { PRIORITIES, STORY_POINTS, TYPES } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { ErrorState } from '../../components/ui/Feedback';
import { FormError, TextAreaField, TextField } from '../../components/ui/Field';
import type { AiSource, DraftTodo, StoryPoints, TodoPriority, TodoType } from '../../types/api';

interface Draft extends DraftTodo {
  _id: number;
  selected: boolean;
}

/** AI-2: describe a feature → review editable drafts → save only the checked ones. */
export function GenerateTodosDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { t, tp, lang } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const aiMode = useAiStatus().data?.mode;
  const generate = useGenerateTodos(projectId);
  const bulk = useBulkCreateTodos(projectId);

  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState('5');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [source, setSource] = useState<AiSource | null>(null);
  const [saveError, setSaveError] = useState('');

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (prompt.trim().length < 3) next.prompt = t('gen.err.prompt');
    else if (prompt.length > 2000) next.prompt = t('common.err.max2000');
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 10) next.count = t('gen.err.count');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function run() {
    if (generate.isPending || !validate()) return;
    // With a real model and an Arabic UI, ask for Arabic todos (never in mock mode: it would become a todo itself).
    const text = lang === 'ar' && aiMode === 'ai' ? `${prompt.trim().slice(0, 1950)}\n${t('ai.replyLang')}` : prompt.trim();
    generate.mutate(
      { prompt: text, count: Number(count) },
      {
        onSuccess: (res) => {
          setDrafts(res.todos.map((d, i) => ({ ...d, _id: i, selected: true })));
          setSource(res.source);
        },
      },
    );
  }

  const patch = (id: number, changes: Partial<Draft>) => setDrafts((list) => (list ?? []).map((d) => (d._id === id ? { ...d, ...changes } : d)));
  const selected = drafts?.filter((d) => d.selected) ?? [];

  async function save() {
    if (bulk.isPending || selected.length === 0) return;
    if (selected.some((d) => !d.title.trim())) {
      setSaveError(t('gen.needTitle'));
      return;
    }
    setSaveError('');
    try {
      await bulk.mutateAsync(
        selected.map((d) => ({ title: d.title.trim().slice(0, 200), description: d.description, type: d.type, priority: d.priority, storyPoints: d.storyPoints })),
      );
      toast.success(tp('gen.added', selected.length));
      onClose();
      navigate(`/projects/${projectId}/backlog`);
    } catch (err) {
      setSaveError(apiMessage(err, t));
    }
  }

  const reviewing = drafts !== null;

  return (
    <Dialog
      size={reviewing ? 'xl' : 'md'}
      title={
        <span className="ai-dialog-title">
          <Sparkles size={18} aria-hidden="true" /> {reviewing ? t('gen.review') : t('gen.title')}
          {source === 'mock' ? <span className="mock-badge">{t('ai.mock')}</span> : null}
        </span>
      }
      description={reviewing ? t('gen.reviewDesc') : t('gen.desc')}
      onClose={generate.isPending || bulk.isPending ? undefined : onClose}
      footer={
        reviewing ? (
          <>
            <Button
              onClick={() => {
                setDrafts(null);
                setSource(null);
                generate.reset();
              }}
              disabled={bulk.isPending}
              className="push-start"
            >
              {t('common.back')}
            </Button>
            <Button onClick={onClose} disabled={bulk.isPending}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={bulk.isPending} disabled={selected.length === 0}>
              {selected.length === 0 ? t('gen.add') : t('gen.addN', { n: selected.length })}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={generate.isPending}>
              {t('common.cancel')}
            </Button>
            <Button variant="ai" icon={Sparkles} onClick={run} loading={generate.isPending}>
              {t('gen.btn')}
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
          <TextAreaField label={t('gen.describe')} value={prompt} onChange={(e) => setPrompt(e.target.value)} error={errors.prompt} rows={5} maxLength={2000} placeholder={t('gen.placeholder')} hint={t('gen.tip')} required data-autofocus disabled={generate.isPending} />
          <TextField label={t('gen.count')} type="number" min={1} max={10} value={count} onChange={(e) => setCount(e.target.value)} error={errors.count} disabled={generate.isPending} className="field-narrow" dir="ltr" />
          {generate.error ? <ErrorState compact error={generate.error} onRetry={run} title={t('gen.error')} /> : null}
          <p className="ai-foot">{t('ai.disclaimer')}</p>
        </form>
      ) : (
        <div className="drafts">
          <FormError>{saveError}</FormError>
          {drafts.length === 0 ? <p className="muted">{t('gen.empty')}</p> : null}
          <ul className="draft-list">
            {drafts.map((d, i) => (
              <li key={d._id} className={d.selected ? 'draft row-enter' : 'draft draft-off'} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <input type="checkbox" checked={d.selected} onChange={(e) => patch(d._id, { selected: e.target.checked })} aria-label={t('gen.include', { title: d.title })} />
                <div className="draft-body">
                  <input className="input" value={d.title} onChange={(e) => patch(d._id, { title: e.target.value })} aria-label={t('gen.titleLabel')} maxLength={200} />
                  {d.description ? <p className="draft-desc">{d.description}</p> : null}
                </div>
                <select className="input select" value={d.type} onChange={(e) => patch(d._id, { type: e.target.value as TodoType })} aria-label={t('td.type')}>
                  {TYPES.map((x) => (
                    <option key={x} value={x}>
                      {t(`type.${x}`)}
                    </option>
                  ))}
                </select>
                <select className="input select" value={d.priority} onChange={(e) => patch(d._id, { priority: e.target.value as TodoPriority })} aria-label={t('td.priority')}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`priority.${p}`)}
                    </option>
                  ))}
                </select>
                <select
                  className="input select select-points"
                  value={d.storyPoints ?? ''}
                  onChange={(e) => patch(d._id, { storyPoints: e.target.value === '' ? null : (Number(e.target.value) as StoryPoints) })}
                  aria-label={t('td.points')}
                >
                  <option value="">{t('gen.noPts')}</option>
                  {STORY_POINTS.map((p) => (
                    <option key={p} value={p}>
                      {t('common.pts', { n: p })}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <p className="ai-foot">{t('ai.disclaimer')}</p>
        </div>
      )}
    </Dialog>
  );
}
