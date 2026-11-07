import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { FilePlus2, Sparkles, Trash2, X } from 'lucide-react';
import { ApiError, fieldErrors } from '../../api/client';
import { useAssistant } from '../../context/AssistantContext';
import { useToast } from '../../context/ToastContext';
import { useSprints } from '../../hooks/useSprints';
import { useTemplates } from '../../hooks/useTemplates';
import { useDeleteTodo, useUpdateTodo } from '../../hooks/useTodos';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { useFormat } from '../../i18n/useFormat';
import { PRIORITIES, STATUSES, STORY_POINTS, TYPES } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Dialog } from '../../components/ui/Dialog';
import { FormError, SelectField, TextAreaField, TextField, type SelectOption } from '../../components/ui/Field';
import { TypeIcon } from '../../components/ui/Badges';
import type { StoryPoints, Todo, TodoPriority, TodoStatus, TodoType, UpdateTodoRequest } from '../../types/api';

interface FormState {
  title: string;
  description: string;
  type: TodoType;
  status: TodoStatus;
  priority: TodoPriority;
  storyPoints: string;
  labels: string[];
  dueDate: string;
  sprintId: string;
}

const toForm = (x: Todo): FormState => ({
  title: x.title,
  description: x.description,
  type: x.type,
  status: x.status,
  priority: x.priority,
  storyPoints: x.storyPoints === null ? '' : String(x.storyPoints),
  labels: x.labels,
  dueDate: x.dueDate ?? '',
  sprintId: x.sprintId ?? '',
});

function LabelsInput({ labels, onChange, error }: { labels: string[]; onChange: (l: string[]) => void; error?: string }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');

  function commit() {
    const value = draft.trim().replace(/,$/, '').trim();
    if (value && !labels.includes(value) && labels.length < 10) onChange([...labels, value.slice(0, 30)]);
    setDraft('');
  }

  return (
    <div className={error ? 'field field-invalid' : 'field'}>
      <label htmlFor="todo-labels" className="field-label">
        {t('td.labels')}
      </label>
      <div className="chips-input">
        {labels.map((l) => (
          <span key={l} className="label-chip label-removable">
            {l}
            <button type="button" onClick={() => onChange(labels.filter((x) => x !== l))} aria-label={t('td.removeLabel', { label: l })}>
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id="todo-labels"
          value={draft}
          maxLength={30}
          placeholder={labels.length ? '' : t('td.labelsPlaceholder')}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && labels.length) {
              onChange(labels.slice(0, -1));
            }
          }}
        />
      </div>
      {error ? <p className="field-error">{error}</p> : <p className="field-hint">{t('td.labelsHint')}</p>}
    </div>
  );
}

export function TodoDetailsDialog({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const { t } = useI18n();
  const { formatDay } = useFormat();
  const toast = useToast();
  const assistant = useAssistant();
  const update = useUpdateTodo(todo.projectId);
  const del = useDeleteTodo(todo.projectId);
  const sprintsQuery = useSprints(todo.projectId);
  const templates = useTemplates();

  const initial = useMemo(() => toForm(todo), [todo]);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const setText = (name: 'title' | 'description' | 'dueDate') => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));
  const setSelect = <K extends 'status' | 'priority' | 'type' | 'storyPoints' | 'sprintId'>(name: K) =>
    (e: ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, [name]: e.target.value as FormState[K] }));

  const sprintOptions = useMemo<SelectOption[]>(() => {
    const list: SelectOption[] = [{ value: '', label: t('td.backlogOpt') }];
    (sprintsQuery.data?.sprints ?? [])
      .filter((s) => s.status === 'planned' || s.status === 'active' || s.id === todo.sprintId)
      .forEach((s) =>
        list.push({
          value: s.id,
          label: s.status === 'planned' ? s.name : `${s.name} (${t(`sprint.${s.status}`)})`,
          disabled: s.status === 'completed' && s.id !== todo.sprintId,
        }),
      );
    return list;
  }, [sprintsQuery.data, todo.sprintId, t]);

  const enumOptions = <T extends string>(values: readonly T[], prefix: 'status' | 'priority' | 'type'): SelectOption[] =>
    values.map((v) => ({ value: v, label: t(`${prefix}.${v}` as `status.todo`) }));

  function requestClose() {
    if (update.isPending || del.isPending) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (update.isPending) return;
    const next: Record<string, string> = {};
    const title = form.title.trim();
    if (!title) next.title = t('td.err.title');
    else if (title.length > 200) next.title = t('common.err.max200');
    if (form.description.length > 5000) next.description = t('common.err.max5000');
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    const body: UpdateTodoRequest = {};
    if (title !== todo.title) body.title = title;
    if (form.description !== todo.description) body.description = form.description;
    if (form.type !== todo.type) body.type = form.type;
    if (form.status !== todo.status) body.status = form.status;
    if (form.priority !== todo.priority) body.priority = form.priority;
    const points = form.storyPoints === '' ? null : (Number(form.storyPoints) as StoryPoints);
    if (points !== todo.storyPoints) body.storyPoints = points;
    if (JSON.stringify(form.labels) !== JSON.stringify(todo.labels)) body.labels = form.labels;
    const due = form.dueDate || null;
    if (due !== todo.dueDate) body.dueDate = due;
    const sprintId = form.sprintId || null;
    if (sprintId !== todo.sprintId) body.sprintId = sprintId;

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }
    try {
      await update.mutateAsync({ id: todo.id, body });
      toast.success(t('td.saved', { key: todo.key }));
      onClose();
    } catch (err) {
      const fe = fieldErrors(err);
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && Object.keys(fe).length) setErrors(fe);
      else setFormError(apiMessage(err, t));
    }
  }

  async function onDelete() {
    try {
      await del.mutateAsync(todo.id);
      toast.success(t('td.deleted', { key: todo.key }));
      onClose();
    } catch (err) {
      setConfirmDelete(false);
      setFormError(apiMessage(err, t));
    }
  }

  function saveAsTemplate() {
    templates.add({ name: todo.title.slice(0, 40), title: todo.title, description: todo.description, type: todo.type, priority: todo.priority, storyPoints: todo.storyPoints, labels: todo.labels });
    toast.success(t('tpl.saved'));
  }

  function askAi(kind: 'improve' | 'estimate') {
    const prompt =
      kind === 'improve'
        ? t('ai.prompt.improve', {
            key: todo.key,
            title: todo.title,
            type: t(`type.${todo.type}`),
            priority: t(`priority.${todo.priority}`),
            description: todo.description || '-',
          })
        : t('ai.prompt.estimate', { key: todo.key, title: todo.title, description: todo.description || '-' });
    onClose();
    assistant.ask(prompt);
  }

  return (
    <>
      <Dialog
        size="lg"
        onClose={requestClose}
        title={
          <span className="todo-dialog-title">
            <TypeIcon type={todo.type} />
            <span className="todo-key" dir="ltr">{todo.key}</span>
          </span>
        }
        footer={
          confirmDiscard ? (
            <div className="discard-bar" role="alert">
              <strong>{t('td.discard.title')}</strong>
              <span>{t('td.discard.text', { key: todo.key })}</span>
              <div className="discard-actions">
                <Button onClick={() => setConfirmDiscard(false)} data-autofocus>
                  {t('td.keepEditing')}
                </Button>
                <Button variant="danger" onClick={onClose}>
                  {t('td.discard')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" icon={Trash2} className="btn-danger-text push-start" onClick={() => setConfirmDelete(true)} disabled={update.isPending}>
                {t('common.delete')}
              </Button>
              <Button onClick={requestClose} disabled={update.isPending}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" type="submit" form="todo-form" loading={update.isPending}>
                {t('common.save')}
              </Button>
            </>
          )
        }
      >
        <form id="todo-form" onSubmit={onSubmit} noValidate className="todo-form">
          <div className="todo-form-main">
            <FormError>{formError}</FormError>
            <TextField label={t('td.title')} value={form.title} onChange={setText('title')} error={errors.title} maxLength={200} required data-autofocus />
            <TextAreaField label={t('td.description')} value={form.description} onChange={setText('description')} error={errors.description} rows={9} placeholder={t('td.descPlaceholder')} />
            <div className="ai-row">
              <Button size="sm" variant="ai" icon={Sparkles} disabled={dirty} title={dirty ? t('td.ai.saveFirst') : undefined} onClick={() => askAi('improve')}>
                {t('td.ai.improve')}
              </Button>
              <Button size="sm" icon={FilePlus2} onClick={saveAsTemplate}>
                {t('tpl.save')}
              </Button>
              {todo.storyPoints === null ? (
                <Button size="sm" variant="ai" icon={Sparkles} disabled={dirty} title={dirty ? t('td.ai.saveFirst') : undefined} onClick={() => askAi('estimate')}>
                  {t('td.ai.estimate')}
                </Button>
              ) : null}
            </div>
            <p className="meta-line">
              {t('td.meta', { created: formatDay(todo.createdAt.slice(0, 10)), updated: formatDay(todo.updatedAt.slice(0, 10)) })}
              {todo.completedAt ? t('td.metaDone', { date: formatDay(todo.completedAt.slice(0, 10)) }) : ''}
            </p>
          </div>
          <div className="todo-form-side">
            <SelectField label={t('td.status')} value={form.status} onChange={setSelect('status')} options={enumOptions(STATUSES, 'status')} error={errors.status} />
            <SelectField label={t('td.priority')} value={form.priority} onChange={setSelect('priority')} options={enumOptions(PRIORITIES, 'priority')} error={errors.priority} />
            <div className="field-row">
              <SelectField label={t('td.type')} value={form.type} onChange={setSelect('type')} options={enumOptions(TYPES, 'type')} error={errors.type} />
              <SelectField
                label={t('td.points')}
                value={form.storyPoints}
                onChange={setSelect('storyPoints')}
                options={[{ value: '', label: t('common.none') }, ...STORY_POINTS.map((p) => ({ value: String(p), label: String(p) }))]}
                error={errors.storyPoints}
              />
            </div>
            <SelectField label={t('td.sprint')} value={form.sprintId} onChange={setSelect('sprintId')} options={sprintOptions} error={errors.sprintId} />
            <TextField label={t('td.due')} type="date" value={form.dueDate} onChange={setText('dueDate')} error={errors.dueDate} dir="ltr" />
            <LabelsInput labels={form.labels} onChange={(labels) => setForm((f) => ({ ...f, labels }))} error={errors.labels} />
          </div>
        </form>
      </Dialog>

      {confirmDelete ? (
        <ConfirmDialog title={t('td.deleteTitle', { key: todo.key })} confirmLabel={t('td.deleteBtn')} danger loading={del.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => void onDelete()}>
          <p>{t('td.deleteBody', { title: todo.title })}</p>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
