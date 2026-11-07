import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useCreateSprint, useUpdateSprint } from '../../hooks/useSprints';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormError, TextAreaField, TextField } from '../../components/ui/Field';
import type { CreateSprintRequest, Sprint } from '../../types/api';

interface Props {
  projectId: string;
  sprint?: Sprint;
  onClose: () => void;
}

/** Create (no `sprint`) or edit a planned sprint (SPR-1 / SPR-2). */
export function SprintFormDialog({ projectId, sprint, onClose }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const create = useCreateSprint(projectId);
  const update = useUpdateSprint(projectId);
  const [values, setValues] = useState({
    name: sprint?.name ?? '',
    goal: sprint?.goal ?? '',
    startDate: sprint?.startDate ?? '',
    endDate: sprint?.endDate ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const loading = create.isPending || update.isPending;
  const set = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const next: Record<string, string> = {};
    if (values.goal.length > 300) next.goal = t('common.err.max300');
    if (sprint && !values.name.trim()) next.name = t('sf.err.name');
    if (values.startDate && values.endDate && values.endDate < values.startDate) next.endDate = t('sf.err.end');
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    try {
      if (sprint) {
        await update.mutateAsync({
          id: sprint.id,
          body: { name: values.name.trim(), goal: values.goal.trim(), startDate: values.startDate || null, endDate: values.endDate || null },
        });
        toast.success(t('sf.updated'));
      } else {
        const body: CreateSprintRequest = {};
        if (values.name.trim()) body.name = values.name.trim();
        if (values.goal.trim()) body.goal = values.goal.trim();
        if (values.startDate) body.startDate = values.startDate;
        if (values.endDate) body.endDate = values.endDate;
        const res = await create.mutateAsync(body);
        toast.success(t('sf.created', { name: res.sprint.name }));
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details?.length) setErrors(fieldErrors(err));
      else setFormError(apiMessage(err, t));
    }
  }

  return (
    <Dialog
      title={sprint ? t('sf.edit', { name: sprint.name }) : t('sf.create')}
      description={sprint ? undefined : t('sf.createDesc')}
      onClose={loading ? undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="sprint-form" loading={loading}>
            {sprint ? t('common.save') : t('sf.create')}
          </Button>
        </>
      }
    >
      <form id="sprint-form" onSubmit={onSubmit} noValidate className="form">
        <FormError>{formError}</FormError>
        <TextField label={t('sf.name')} value={values.name} onChange={set('name')} error={errors.name} placeholder={sprint ? '' : t('sf.namePlaceholder')} maxLength={80} data-autofocus />
        <TextAreaField label={t('sf.goal')} value={values.goal} onChange={set('goal')} error={errors.goal} rows={3} maxLength={300} placeholder={t('sf.goalPlaceholder')} />
        <div className="field-row">
          <TextField label={t('sf.start')} type="date" value={values.startDate} onChange={set('startDate')} error={errors.startDate} dir="ltr" />
          <TextField label={t('sf.end')} type="date" value={values.endDate} onChange={set('endDate')} error={errors.endDate} min={values.startDate || undefined} dir="ltr" />
        </div>
      </form>
    </Dialog>
  );
}
