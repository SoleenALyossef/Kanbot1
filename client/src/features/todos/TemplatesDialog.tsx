import { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCreateTodo } from '../../hooks/useTodos';
import { useTemplates } from '../../hooks/useTemplates';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { PRIORITIES, STORY_POINTS, TYPES } from '../../lib/constants';
import { BUILT_IN, type TodoTemplate } from '../../lib/templates';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormError, SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import type { StoryPoints, TodoPriority, TodoType } from '../../types/api';

/** Pick a template (built-in or your own), edit it, create a normal todo. */
export function TemplatesDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const create = useCreateTodo(projectId);
  const { custom, remove } = useTemplates();
  const [draft, setDraft] = useState<TodoTemplate | null>(null);
  const [error, setError] = useState('');

  const builtIn: TodoTemplate[] = BUILT_IN.map((b) => ({
    id: b.id, name: t(b.name), title: t(b.title), description: t(b.description), type: b.type, priority: b.priority, storyPoints: b.storyPoints, labels: b.labels,
  }));

  async function submit() {
    if (!draft || create.isPending) return;
    if (!draft.title.trim()) {
      setError(t('td.err.title'));
      return;
    }
    setError('');
    try {
      const res = await create.mutateAsync({
        title: draft.title.trim().slice(0, 200),
        description: draft.description,
        type: draft.type,
        priority: draft.priority,
        storyPoints: draft.storyPoints,
        labels: draft.labels,
      });
      toast.success(t('quick.created', { key: res.todo.key }));
      onClose();
    } catch (err) {
      setError(apiMessage(err, t));
    }
  }

  const row = (tpl: TodoTemplate, removable: boolean) => (
    <li key={tpl.id} className="tpl-row">
      <FileText size={16} aria-hidden="true" />
      <span className="tpl-name">{tpl.name}</span>
      <span className="muted tpl-meta">{t(`type.${tpl.type}`)} · {t(`priority.${tpl.priority}`)}</span>
      {removable ? (
        <button type="button" className="icon-btn icon-btn-sm" onClick={() => remove(tpl.id)} aria-label={t('tpl.delete')} title={t('tpl.delete')}>
          <Trash2 size={14} aria-hidden="true" />
        </button>
      ) : null}
      <Button size="sm" onClick={() => setDraft(tpl)}>
        {t('tpl.use')}
      </Button>
    </li>
  );

  return (
    <Dialog
      title={t('tpl.title')}
      description={t('tpl.sub')}
      size={draft ? 'lg' : 'md'}
      onClose={create.isPending ? undefined : onClose}
      footer={
        draft ? (
          <>
            <Button onClick={() => setDraft(null)} disabled={create.isPending} className="push-start">
              {t('common.back')}
            </Button>
            <Button variant="primary" onClick={() => void submit()} loading={create.isPending}>
              {t('tpl.create')}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>{t('common.cancel')}</Button>
        )
      }
    >
      {draft ? (
        <div className="form">
          <FormError>{error}</FormError>
          <TextField label={t('td.title')} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={200} data-autofocus />
          <TextAreaField label={t('td.description')} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={7} />
          <div className="field-row3">
            <SelectField label={t('td.type')} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TodoType })} options={TYPES.map((x) => ({ value: x, label: t(`type.${x}`) }))} />
            <SelectField label={t('td.priority')} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TodoPriority })} options={PRIORITIES.map((x) => ({ value: x, label: t(`priority.${x}`) }))} />
            <SelectField
              label={t('td.points')}
              value={draft.storyPoints === null ? '' : String(draft.storyPoints)}
              onChange={(e) => setDraft({ ...draft, storyPoints: e.target.value === '' ? null : (Number(e.target.value) as StoryPoints) })}
              options={[{ value: '', label: t('common.none') }, ...STORY_POINTS.map((p) => ({ value: String(p), label: String(p) }))]}
            />
          </div>
        </div>
      ) : (
        <div className="tpl-groups">
          <h3 className="tpl-heading">{t('tpl.builtin')}</h3>
          <ul className="tpl-list">{builtIn.map((x) => row(x, false))}</ul>
          <h3 className="tpl-heading">{t('tpl.custom')}</h3>
          {custom.length ? <ul className="tpl-list">{custom.map((x) => row(x, true))}</ul> : <p className="muted">{t('tpl.customEmpty')}</p>}
        </div>
      )}
    </Dialog>
  );
}
