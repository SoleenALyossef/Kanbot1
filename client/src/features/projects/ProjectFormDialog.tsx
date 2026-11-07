import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormError, TextAreaField, TextField } from '../../components/ui/Field';
import type { Project } from '../../types/api';

interface Props {
  project?: Project;
  onClose: () => void;
  onSaved?: (project: Project) => void;
}

/** Create (no `project`) or edit (with `project`). PRJ-2 / PRJ-3. */
export function ProjectFormDialog({ project, onClose, onSaved }: Props) {
  const { t } = useI18n();
  const editing = !!project;
  const toast = useToast();
  const create = useCreateProject();
  const update = useUpdateProject();
  const [values, setValues] = useState({ name: project?.name ?? '', key: project?.key ?? '', description: project?.description ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const loading = create.isPending || update.isPending;

  const set = (name: 'name' | 'description') => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const next: Record<string, string> = {};
    const name = values.name.trim();
    const key = values.key.trim().toUpperCase();
    if (!name) next.name = t('pf.err.name');
    else if (name.length > 80) next.name = t('common.err.max80');
    if (key && !/^[A-Z]{2,6}$/.test(key)) next.key = t('pf.err.key');
    if (values.description.length > 500) next.description = t('common.err.max500');
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    const body = { name, description: values.description.trim(), ...(key ? { key } : {}) };
    try {
      const res = project ? await update.mutateAsync({ id: project.id, body }) : await create.mutateAsync(body);
      toast.success(project ? t('pf.updated') : t('pf.created', { key: res.project.key }));
      onSaved?.(res.project);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ key: t('pf.err.keyUsed') });
      else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details?.length) setErrors(fieldErrors(err));
      else setFormError(apiMessage(err, t));
    }
  }

  return (
    <Dialog
      title={editing ? t('pf.edit') : t('pf.create')}
      description={editing ? undefined : t('pf.createDesc')}
      onClose={loading ? undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="project-form" loading={loading}>
            {editing ? t('common.save') : t('pf.createBtn')}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={onSubmit} noValidate className="form">
        <FormError>{formError}</FormError>
        <TextField label={t('pf.name')} value={values.name} onChange={set('name')} error={errors.name} maxLength={80} required data-autofocus placeholder={t('pf.namePlaceholder')} />
        <TextField
          label={t('pf.key')}
          value={values.key}
          onChange={(e) => setValues((v) => ({ ...v, key: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) }))}
          error={errors.key}
          hint={editing ? t('pf.keyHintEdit') : t('pf.keyHintCreate')}
          placeholder="KAN"
          autoComplete="off"
          dir="ltr"
        />
        <TextAreaField label={t('pf.description')} value={values.description} onChange={set('description')} error={errors.description} rows={3} maxLength={500} placeholder={t('pf.descPlaceholder')} />
      </form>
    </Dialog>
  );
}
